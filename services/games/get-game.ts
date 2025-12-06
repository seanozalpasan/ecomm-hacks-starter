import { db } from "@/lib/db/db";
import { games, users, gameParticipants, gameInvites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getGameDetails(gameId: string) {
	// Get game with author info
	const game = await db
		.select({
			id: games.id,
			priceLimit: games.priceLimit,
			deadline: games.deadline,
			categories: games.categories,
			status: games.status,
			authorId: games.authorID,
			authorClerkId: users.clerkID,
			authorName: users.name,
		})
		.from(games)
		.leftJoin(users, eq(games.authorID, users.id))
		.where(eq(games.id, gameId))
		.limit(1);

	if (!game.length) {
		return null;
	}

	// Get participants
	const participants = await db
		.select({
			userId: users.id,
			clerkId: users.clerkID,
			name: users.name,
			email: users.email,
		})
		.from(gameParticipants)
		.leftJoin(users, eq(gameParticipants.userID, users.id))
		.where(eq(gameParticipants.gameID, gameId));

	// Get invites
	const invites = await db
		.select({
			id: gameInvites.id,
			email: gameInvites.email,
			status: gameInvites.status,
		})
		.from(gameInvites)
		.where(eq(gameInvites.gameID, gameId));

	return {
		...game[0],
		participants,
		invites,
	};
}
