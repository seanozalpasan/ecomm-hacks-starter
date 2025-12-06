import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { generateGiftSuggestions } from "@/services/gifts";
import {
  enrichProductsWithFirecrawl,
  findProductsFromQueries,
  type ProductResult,
} from "@/services/productSearch";
import { enhanceProductDescriptions } from "@/services/descriptionEnhancer";

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

    // PHASE 1: GENERATE IDEAS (Gemini)
    // This returns the "buckets" like: [{ searchQuery: "mechanical keyboard", category: "Tech" }, ...]
    const ideationResult = await generateGiftSuggestions({
      query,
      userId,
      gameId,
      priceLimit,
    });

    // Ensure at least one suggestion directly relates to the user's query
    const suggestions = ideationResult.suggestions;
    const queryTerms = query.toLowerCase().split(/\s+/);

    // Check if any suggestion contains query terms
    const hasQueryMatch = suggestions.some((suggestion) => {
      const suggestionText = suggestion.searchQuery.toLowerCase();
      return queryTerms.some((term: string) => term.length > 2 && suggestionText.includes(term));
    });

    // If no match found, prepend a direct query-based suggestion
    const finalSuggestions = hasQueryMatch
      ? suggestions
      : [
          {
            searchQuery: query,
            description: `Direct match for your search: ${query}`,
            category: "User Request",
          },
          ...suggestions,
        ];

    const suggestionBuckets = finalSuggestions.slice(0, 6);

    // PHASE 2: FIND ACTUAL PRODUCTS (Exa)
    // Pass the Gemini suggestions into Exa in parallel
    const realProducts = await findProductsFromQueries(suggestionBuckets, {
      imageLinks: 3,
    });

    const limitedProducts = realProducts.slice(0, 6);

    // PHASE 2.5: Enrich with live scrape (Firecrawl) and enforce price limit
    const scrapedProducts = await enrichProductsWithFirecrawl(limitedProducts, {
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

    // PHASE 3: Return combined data
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
