import { eq } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { gameParticipants, games, users } from "@/lib/db/schema";

export async function getUserGames(clerkUserId: string) {
	// Get the user's database ID from their Clerk ID
	const user = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.clerkID, clerkUserId))
		.limit(1);

	if (!user.length) {
		return [];
	}

	const userId = user[0].id;

	// Get all games the user is participating in
	const userGames = await db
		.select({
			id: games.id,
			priceLimit: games.priceLimit,
			deadline: games.deadline,
			categories: games.categories,
			status: games.status,
			authorId: games.authorID,
			authorName: users.name,
			name: games.name,
		})
		.from(gameParticipants)
		.innerJoin(games, eq(gameParticipants.gameID, games.id))
		.leftJoin(users, eq(games.authorID, users.id))
		.where(eq(gameParticipants.userID, userId));

	return userGames;
}
