import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { games, gameParticipants, gameUserMatches } from "@/lib/db/schema";

export type CreateMatchesInput = {
  gameId: string;
  userId: string; // The user triggering the match (should be the author)
};

export type MatchResult = {
  buyerId: string;
  recipientId: string;
};

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Creates random matches for a Secret Santa style game.
 * Each participant will buy for exactly one other participant.
 * Uses a circular assignment pattern to ensure everyone gives and receives.
 */
export async function createMatches(input: CreateMatchesInput) {
  const { gameId, userId } = input;

  if (!gameId) throw new Error("Missing game ID");
  if (!userId) throw new Error("Missing user ID");

  // 1. Fetch the game and verify it exists
  const [game] = await db
    .select()
    .from(games)
    .where(eq(games.id, gameId))
    .limit(1);

  if (!game) {
    throw new Error("Game not found");
  }

  // 2. Verify the user is the game author
  if (game.authorID !== userId) {
    throw new Error("Only the game author can trigger matching");
  }

  // 3. Check if game is already active or completed
  if (game.status === "ACTIVE" || game.status === "COMPLETED") {
    throw new Error("Matches have already been created for this game");
  }

  // 4. Check if game is cancelled
  if (game.status === "CANCELLED") {
    throw new Error("Cannot create matches for a cancelled game");
  }

  // 5. Get all participants for this game
  const participants = await db
    .select()
    .from(gameParticipants)
    .where(eq(gameParticipants.gameID, gameId));

  // 6. Verify we have enough participants (minimum 2 for matching)
  if (participants.length < 2) {
    throw new Error(
      `Not enough participants to create matches. Need at least 2, found ${participants.length}`
    );
  }

  // 7. Check if matches already exist (extra safety check)
  const existingMatches = await db
    .select()
    .from(gameUserMatches)
    .where(eq(gameUserMatches.gameID, gameId))
    .limit(1);

  if (existingMatches.length > 0) {
    throw new Error("Matches already exist for this game");
  }

  // 8. Create random circular matching
  // Shuffle participants to randomize the assignments
  const shuffledParticipants = shuffleArray(participants);

  // Create circular assignment: participant[0] → participant[1] → ... → participant[n] → participant[0]
  const matches: MatchResult[] = [];

  for (let i = 0; i < shuffledParticipants.length; i++) {
    const buyer = shuffledParticipants[i];
    const recipient = shuffledParticipants[(i + 1) % shuffledParticipants.length];

    matches.push({
      buyerId: buyer.userID,
      recipientId: recipient.userID,
    });
  }

  // 9. Insert all matches into the database
  await db.insert(gameUserMatches).values(
    matches.map((match) => ({
      gameID: gameId,
      buyerID: match.buyerId,
      recipientID: match.recipientId,
    }))
  );

  // 10. Update game status to ACTIVE
  const [updatedGame] = await db
    .update(games)
    .set({ status: "ACTIVE" })
    .where(eq(games.id, gameId))
    .returning();

  return {
    game: updatedGame,
    matches,
    participantCount: participants.length,
  };
}
