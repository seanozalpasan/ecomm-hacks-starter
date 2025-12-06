import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { gameInvites, games, users } from "@/lib/db/schema";

export async function getPendingInvites(clerkUserId: string) {
	// Get the user's email from their Clerk ID
	const user = await db
		.select({ email: users.email })
		.from(users)
		.where(eq(users.clerkID, clerkUserId))
		.limit(1);

	if (!user.length) {
		return [];
	}

	const userEmail = user[0].email;

	// Get all pending invites for this user's email
	const pendingInvites = await db
		.select({
			id: gameInvites.id,
			gameId: gameInvites.gameID,
			gameName: games.name,
			priceLimit: games.priceLimit,
			deadline: games.deadline,
			categories: games.categories,
			status: games.status,
			invitedAt: gameInvites.invitedAt,
			hostName: users.name,
		})
		.from(gameInvites)
		.innerJoin(games, eq(gameInvites.gameID, games.id))
		.leftJoin(users, eq(games.authorID, users.id))
		.where(
			and(
				eq(gameInvites.email, userEmail.toLowerCase()),
				eq(gameInvites.status, "PENDING"),
			),
		);

	return pendingInvites;
}

