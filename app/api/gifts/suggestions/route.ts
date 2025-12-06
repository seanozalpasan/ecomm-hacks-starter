import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { generateGiftSuggestions } from "@/services/gifts";

interface GiftSuggestion {
  searchQuery: string;
  description: string;
  category: string;
}

interface GiftSuggestionsResponse {
  giftSuggestions: GiftSuggestion[];
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

    const result = await generateGiftSuggestions({ query, userId, gameId, priceLimit });

    return NextResponse.json<GiftSuggestionsResponse>(
      {
        giftSuggestions: result.suggestions,
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
