import { db } from "@/lib/db/db";
import { games, gameInvites, gameParticipants, users } from "@/lib/db/schema";
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

	// Get the user's database ID, name, and email from their Clerk ID
	const user = await db
		.select({ id: users.id, name: users.name, email: users.email })
		.from(users)
		.where(eq(users.clerkID, clerkUserId))
		.limit(1);

	if (!user.length) {
		throw new Error("User not found");
	}

	const userId = user[0].id;
	const userName = user[0].name;
	const userEmail = user[0].email;

	// Create the game
	const [game] = await db
		.insert(games)
		.values({
			authorID: userId,
			name: data.name,
			priceLimit: data.priceLimit.toString(),
			deadline: data.deadline,
			categories: data.categories,
			status: "DRAFT",
		})
		.returning({ id: games.id });

	// Automatically add the host as a participant in the game
	await db.insert(gameParticipants).values({
		gameID: game.id,
		userID: userId,
	});

	// Check if user is trying to invite themselves
	const userEmailLower = userEmail.toLowerCase();
	const hasSelfInvite = data.invites.some(
		(email) => email.toLowerCase() === userEmailLower,
	);

	if (hasSelfInvite) {
		throw new Error("You cannot invite yourself to the game");
	}

	// Filter out the host's email from invites (case-insensitive) as a safety measure
	const filteredInvites = data.invites.filter(
		(email) => email.toLowerCase() !== userEmailLower,
	);

	if (filteredInvites.length === 0) {
		throw new Error("You must invite at least one other person to the game");
	}

	// Create invites for each email
	const inviteRecords = filteredInvites.map((email) => ({
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
