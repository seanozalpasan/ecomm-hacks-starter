import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createMatches } from "@/services/games/match";
import { db } from "@/lib/db/db";
import { users, gameUserMatches, games } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

type RouteContext = {
  params: Promise<{
    gameId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get gameId from URL params
    const { gameId } = await context.params;

    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    // Get the user's database ID from their Clerk ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkID, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please complete onboarding first." },
        { status: 404 }
      );
    }

    // Trigger the matching algorithm
    const result = await createMatches({
      gameId,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Matches created successfully",
        data: {
          gameId: result.game.id,
          status: result.game.status,
          participantCount: result.participantCount,
          matchCount: result.matches.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating matches:", error);

    // Handle known errors with specific messages
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get gameId from URL params
    const { gameId } = await context.params;

    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    // Get the user's database ID from their Clerk ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkID, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please complete onboarding first." },
        { status: 404 }
      );
    }

    // Check if the game exists
    const [game] = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Get the match for this user
    const [match] = await db
      .select({
        recipient: users,
      })
      .from(gameUserMatches)
      .innerJoin(users, eq(gameUserMatches.recipientID, users.id))
      .where(
        and(
          eq(gameUserMatches.gameID, gameId),
          eq(gameUserMatches.buyerID, user.id)
        )
      )
      .limit(1);

    if (!match) {
      return NextResponse.json(
        {
          success: true,
          matched: false,
          message: "No match found for this user in this game",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        matched: true,
        data: {
          gameId,
          gameStatus: game.status,
          buyingFor: {
            id: match.recipient.id,
            name: match.recipient.name,
            email: match.recipient.email,
            location: match.recipient.location,
            giftPreferences: match.recipient.giftPreferences,
            clothingSize: match.recipient.clothingSize,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching match:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
