import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { games, gameInvites, gameParticipants, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

type RouteContext = {
  params: Promise<{
    gameId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { userId, sessionClaims } = await auth();

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

    // Get the user's database ID and email from their Clerk ID
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

    // Get user's email from Clerk session claims
    const email =
      typeof sessionClaims === "object" && sessionClaims
        ? // @ts-expect-error sessionClaims may not have email depending on Clerk config
          (sessionClaims.email ??
          // @ts-expect-error
          sessionClaims.email_address ??
          user.email)
        : user.email;

    // Check if the game exists
    const [game] = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // CRITICAL CHECK: Prevent joining if game has already started
    if (game.status === "ACTIVE" || game.status === "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          error: "This game has already started",
          message:
            "The game administrator has already created matches. You cannot join at this time.",
        },
        { status: 403 }
      );
    }

    // Check if game is cancelled
    if (game.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          error: "This game has been cancelled",
        },
        { status: 403 }
      );
    }

    // Find the invite for this user
    const [invite] = await db
      .select()
      .from(gameInvites)
      .where(
        and(eq(gameInvites.gameID, gameId), eq(gameInvites.email, email))
      )
      .limit(1);

    if (!invite) {
      return NextResponse.json(
        { error: "No invitation found for this game" },
        { status: 404 }
      );
    }

    // Check if invite was already accepted
    if (invite.status === "ACCEPTED") {
      // Check if user is already a participant
      const [existingParticipant] = await db
        .select()
        .from(gameParticipants)
        .where(
          and(
            eq(gameParticipants.gameID, gameId),
            eq(gameParticipants.userID, user.id)
          )
        )
        .limit(1);

      if (existingParticipant) {
        return NextResponse.json(
          {
            success: true,
            message: "You have already accepted this invitation",
          },
          { status: 200 }
        );
      }
    }

    // Check if invite was declined
    if (invite.status === "DECLINED") {
      return NextResponse.json(
        {
          error: "You have previously declined this invitation",
        },
        { status: 400 }
      );
    }

    // Add user to game participants
    await db.insert(gameParticipants).values({
      gameID: gameId,
      userID: user.id,
    });

    // Update invite status to ACCEPTED
    await db
      .update(gameInvites)
      .set({ status: "ACCEPTED" })
      .where(eq(gameInvites.id, invite.id));

    return NextResponse.json(
      {
        success: true,
        message: "Successfully joined the game!",
        data: {
          gameId,
          userId: user.id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error accepting invite:", error);

    // Handle known errors
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
