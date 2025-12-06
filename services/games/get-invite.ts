import { db } from "@/lib/db/db";
import { gameInvites, games, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface InviteDetails {
	id: string;
	email: string;
	status: string;
	game: {
		name: string | null;
		priceLimit: string | null;
		deadline: Date;
		categories: string[] | null;
		author: {
			name: string;
			clerkId: string;
		};
	};
}

export async function getInviteDetails(
	inviteId: string,
): Promise<InviteDetails | null> {
	const result = await db
		.select({
			id: gameInvites.id,
			email: gameInvites.email,
			status: gameInvites.status,
			gameName: games.name,
			priceLimit: games.priceLimit,
			deadline: games.deadline,
			categories: games.categories,
			authorName: users.name,
			authorClerkId: users.clerkID,
		})
		.from(gameInvites)
		.innerJoin(games, eq(gameInvites.gameID, games.id))
		.innerJoin(users, eq(games.authorID, users.id))
		.where(eq(gameInvites.id, inviteId))
		.limit(1);

	if (!result.length) {
		return null;
	}

	const invite = result[0];

	return {
		id: invite.id,
		email: invite.email,
		status: invite.status || "PENDING",
		game: {
			name: invite.gameName,
			priceLimit: invite.priceLimit,
			deadline: invite.deadline,
			categories: invite.categories,
			author: {
				name: invite.authorName,
				clerkId: invite.authorClerkId,
			},
		},
	};
}
