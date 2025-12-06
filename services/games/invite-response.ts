import { db } from "@/lib/db/db";
import { gameInvites, gameParticipants, users, games } from "@/lib/db/schema";
import {
	type InviteResponseInput,
	inviteResponseSchema,
} from "@/schemas/games/invite-response";
import { eq } from "drizzle-orm";
import { createMatches } from "./match";

interface InviteResponseResult {
	message: string;
	status: "accepted" | "declined";
	gameId: string;
}

export async function respondToInvite(
	input: InviteResponseInput,
	clerkUserId: string,
): Promise<InviteResponseResult> {
	const data = inviteResponseSchema.parse(input);

	// Get the user's database ID from their Clerk ID
	const user = await db
		.select({ id: users.id, email: users.email })
		.from(users)
		.where(eq(users.clerkID, clerkUserId))
		.limit(1);

	if (!user.length) {
		throw new Error("User not found");
	}

	const userId = user[0].id;
	const userEmail = user[0].email;

	// Get the invite and verify it belongs to this user's email
	const invite = await db
		.select({
			id: gameInvites.id,
			gameID: gameInvites.gameID,
			email: gameInvites.email,
			status: gameInvites.status,
		})
		.from(gameInvites)
		.where(eq(gameInvites.id, data.inviteId))
		.limit(1);

	if (!invite.length) {
		throw new Error("Invite not found");
	}

	// Case-insensitive email comparison
	if (invite[0].email.toLowerCase() !== userEmail.toLowerCase()) {
		throw new Error(
			`This invite is for ${invite[0].email} but you're logged in as ${userEmail}. Please log in with the invited email address.`,
		);
	}

	if (invite[0].status !== "PENDING") {
		throw new Error("This invite has already been responded to");
	}

	// Update the invite status
	const newStatus = data.action === "accept" ? "ACCEPTED" : "DECLINED";
	await db
		.update(gameInvites)
		.set({ status: newStatus })
		.where(eq(gameInvites.id, data.inviteId));

	// If accepted, add user to game participants
	if (data.action === "accept") {
		await db.insert(gameParticipants).values({
			gameID: invite[0].gameID,
			userID: userId,
		});

		// Check if all invites have been accepted and auto-trigger matching
		await checkAndAutoMatch(invite[0].gameID);
	}

	return {
		message:
			data.action === "accept"
				? "Invitation accepted successfully"
				: "Invitation declined",
		status: data.action === "accept" ? "accepted" : "declined",
		gameId: invite[0].gameID,
	};
}

/**
 * Checks if all invites for a game have been accepted.
 * If so, automatically triggers the matching process.
 */
async function checkAndAutoMatch(gameId: string): Promise<void> {
	// Get the game details
	const [game] = await db
		.select()
		.from(games)
		.where(eq(games.id, gameId))
		.limit(1);

	if (!game) {
		return; // Game not found, skip auto-matching
	}

	// Only auto-match if game is still in DRAFT status
	if (game.status !== "DRAFT") {
		return;
	}

	// Check if there are any pending invites
	const pendingInvites = await db
		.select()
		.from(gameInvites)
		.where(eq(gameInvites.gameID, gameId));

	const hasPendingInvites = pendingInvites.some(
		(invite) => invite.status === "PENDING",
	);

	// If all invites have been accepted (no pending invites), trigger matching
	if (!hasPendingInvites && pendingInvites.length > 0) {
		try {
			// Trigger the matching algorithm
			await createMatches({
				gameId,
				userId: game.authorID,
			});
			console.log(
				`Auto-matching triggered for game ${gameId} - all invites accepted`,
			);
		} catch (error) {
			// Log the error but don't fail the invite acceptance
			console.error(`Failed to auto-match game ${gameId}:`, error);
		}
	}
}
