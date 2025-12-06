import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { generateGiftSuggestions } from "@/services/gifts";
import {
  enrichProductsWithFirecrawl,
  findProductsFromQueries,
  type ProductResult,
} from "@/services/productSearch";
import { enhanceProductDescriptions } from "@/services/descriptionEnhancer";
import { db } from "@/lib/db/db";
import { users, gameUserMatches } from "@/lib/db/schema";
import { saveGiftSuggestionsBatch } from "@/services/saved-gift-suggestions/create";

interface GiftSuggestion {
  searchQuery: string;
  description: string;
  category: string;
}

interface RecipientContext {
  name: string;
  likes: string[];
  dislikes: string[];
  preferences: {
    music: string[];
    books: string[];
    movies: string[];
  };
  additionalInfo: string;
}

interface GiftSuggestionsResponse {
  context: RecipientContext;
  suggestionBuckets: GiftSuggestion[];
  products: ProductResult[];
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { query, gameId, priceLimit } = body ?? {};

    const priceLimitValue =
      typeof priceLimit === "string" && priceLimit.trim().length > 0
        ? Number(priceLimit)
        : undefined;

    if (priceLimit && Number.isNaN(priceLimitValue)) {
      return NextResponse.json({ error: "Price limit must be a number" }, { status: 400 });
    }

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
    }

    // Get the giver's database ID from their Clerk ID
    const [giver] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkID, userId))
      .limit(1);

    if (!giver) {
      return NextResponse.json(
        { error: "User not found. Please complete onboarding first." },
        { status: 404 }
      );
    }

    // Get the recipient they're matched with in this game
    const [match] = await db
      .select({
        recipientID: gameUserMatches.recipientID,
      })
      .from(gameUserMatches)
      .where(
        and(
          eq(gameUserMatches.gameID, gameId),
          eq(gameUserMatches.buyerID, giver.id)
        )
      )
      .limit(1);

    if (!match) {
      return NextResponse.json(
        { error: "No match found. Please wait for the game to start." },
        { status: 404 }
      );
    }

    // PHASE 1: GENERATE IDEAS (Gemini)
    // This returns the "buckets" like: [{ searchQuery: "mechanical keyboard", category: "Tech" }, ...]
    const ideationResult = await generateGiftSuggestions({
      query,
      userId,
      gameId,
      priceLimit,
    });

    // Use exactly 3 categories for balanced diversity
    // Gemini should return exactly 3 suggestions with different categories
    const suggestionBuckets = ideationResult.suggestions.slice(0, 3);

    // PHASE 2: FIND ACTUAL PRODUCTS (Exa)
    // Pass the Gemini suggestions into Exa in parallel
    // With 3 categories and 2 items per category, we get 6 diverse products
    const realProducts = await findProductsFromQueries(suggestionBuckets, {
      imageLinks: 3,
    });

    // PHASE 2.5: Enrich with live scrape (Firecrawl) and enforce price limit
    const scrapedProducts = await enrichProductsWithFirecrawl(realProducts, {
      priceLimit: priceLimitValue,
    });

    // PHASE 2.75: Enhance descriptions with Gemini (clean URLs, navigation text, etc.)
    const enhancedDescriptions = await enhanceProductDescriptions(
      scrapedProducts.map((p) => ({
        title: p.title,
        description: p.description,
        category: p.category,
        price: p.price,
        url: p.url,
      })),
    );

    // Apply enhanced descriptions
    const finalProducts = scrapedProducts.map((product, index) => ({
      ...product,
      description: enhancedDescriptions[index]?.description || product.description,
    }));

    // PHASE 3: Save the suggestions to the database
    try {
      await saveGiftSuggestionsBatch(
        finalProducts.map((product) => ({
          gameID: gameId,
          giverID: giver.id,
          recipientID: match.recipientID,
          product,
        }))
      );
    } catch (saveError) {
      console.error(`[${requestId}] Error saving gift suggestions:`, {
        error: saveError instanceof Error ? saveError.message : String(saveError),
        stack: saveError instanceof Error ? saveError.stack : undefined,
      });
      // Continue even if save fails - don't block the response
    }

    // PHASE 4: Return combined data
    return NextResponse.json<GiftSuggestionsResponse>(
      {
        context: ideationResult.recipient, // Helpful for debugging/UI
        suggestionBuckets, // The AI's abstract ideas (limited to 6)
        products: finalProducts, // The actual clickable links with cleaned descriptions
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(`[${requestId}] Error in gift suggestions route:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Internal server error", requestId },
      { status: 500 },
    );
  }
}
