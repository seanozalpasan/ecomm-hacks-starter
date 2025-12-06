import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { generateGiftSuggestions } from "@/services/gifts";
import { findProductsFromQueries, type ProductResult } from "@/services/productSearch";

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

    // PHASE 2: FIND ACTUAL PRODUCTS (Exa)
    // Pass the Gemini suggestions into Exa in parallel
    const realProducts = await findProductsFromQueries(ideationResult.suggestions, {
      imageLinks: 3,
    });

    // PHASE 3: Return combined data
    return NextResponse.json<GiftSuggestionsResponse>(
      {
        context: ideationResult.recipient, // Helpful for debugging/UI
        suggestionBuckets: ideationResult.suggestions, // The AI's abstract ideas
        products: realProducts, // The actual clickable links found by Exa
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
