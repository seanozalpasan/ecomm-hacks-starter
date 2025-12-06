import { db } from "@/lib/db/db";
import { games, gameInvites, users } from "@/lib/db/schema";
import {
	type CreateGameInput,
	createGameSchema,
} from "@/schemas/games/create";
import { sendInviteEmail } from "@/lib/email/resend";
import { eq } from "drizzle-orm";

interface CreateGameResult {
	gameId: string;
	inviteIds: string[];
	message: string;
}

export async function createGame(
	input: CreateGameInput,
	clerkUserId: string,
): Promise<CreateGameResult> {
	const data = createGameSchema.parse(input);

	// Get the user's database ID and name from their Clerk ID
	const user = await db
		.select({ id: users.id, name: users.name })
		.from(users)
		.where(eq(users.clerkID, clerkUserId))
		.limit(1);

	if (!user.length) {
		throw new Error("User not found");
	}

	const userId = user[0].id;
	const userName = user[0].name;

	// Create the game
	const [game] = await db
		.insert(games)
		.values({
			authorID: userId,
			priceLimit: data.priceLimit.toString(),
			deadline: data.deadline,
			categories: data.categories,
			status: "DRAFT",
		})
		.returning({ id: games.id });

	// Create invites for each email
	const inviteRecords = data.invites.map((email) => ({
		gameID: game.id,
		email,
		status: "PENDING" as const,
	}));

	const createdInvites = await db
		.insert(gameInvites)
		.values(inviteRecords)
		.returning({ id: gameInvites.id, email: gameInvites.email });

	// Send invite emails
	await Promise.allSettled(
		createdInvites.map((invite) =>
			sendInviteEmail({
				to: invite.email,
				inviteId: invite.id,
				gameName: "Secret Santa",
				hostName: userName,
				deadline: data.deadline,
				priceLimit: data.priceLimit.toString(),
			}),
		),
	);

	return {
		gameId: game.id,
		inviteIds: createdInvites.map((inv) => inv.id),
		message: "Game created successfully",
	};
}
