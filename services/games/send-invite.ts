import { db } from "@/lib/db/db";
import { games, gameInvites, users } from "@/lib/db/schema";
import { sendInviteEmail } from "@/lib/email/resend";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const sendInviteSchema = z.object({
	gameId: z.string(),
	email: z.string().email(),
});

export type SendInviteInput = z.infer<typeof sendInviteSchema>;

interface SendInviteResult {
	inviteId: string;
	message: string;
}

export async function sendGameInvite(
	input: SendInviteInput,
	clerkUserId: string,
): Promise<SendInviteResult> {
	const data = sendInviteSchema.parse(input);

	// Get the user's database ID from their Clerk ID
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

	// Get the game and verify the user is the author
	const game = await db
		.select({
			id: games.id,
			authorID: games.authorID,
			priceLimit: games.priceLimit,
			deadline: games.deadline,
		})
		.from(games)
		.where(eq(games.id, data.gameId))
		.limit(1);

	if (!game.length) {
		throw new Error("Game not found");
	}

	if (game[0].authorID !== userId) {
		throw new Error("Only the game author can send invites");
	}

	// Check if the email is the host's email
	if (data.email.toLowerCase() === userEmail.toLowerCase()) {
		throw new Error("You cannot invite yourself to the game");
	}

	// Check if this email already has an invite for this game
	const existingInvite = await db
		.select({ id: gameInvites.id })
		.from(gameInvites)
		.where(
			and(
				eq(gameInvites.gameID, data.gameId),
				eq(gameInvites.email, data.email.toLowerCase()),
			),
		)
		.limit(1);

	if (existingInvite.length > 0) {
		throw new Error("This email has already been invited to the game");
	}

	// Create the invite
	const [invite] = await db
		.insert(gameInvites)
		.values({
			gameID: data.gameId,
			email: data.email.toLowerCase(),
			status: "PENDING",
		})
		.returning({ id: gameInvites.id });

	// Send the invite email
	try {
		await sendInviteEmail({
			to: data.email,
			inviteId: invite.id,
			gameName: "Secret Santa",
			hostName: userName,
			deadline: game[0].deadline,
			priceLimit: game[0].priceLimit?.toString() || null,
		});
	} catch (error) {
		console.error("Failed to send invite email:", error);
		// Don't throw - the invite was created, email failure is not critical
	}

	return {
		inviteId: invite.id,
		message: "Invitation sent successfully",
	};
}
