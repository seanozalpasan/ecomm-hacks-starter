import { db } from "@/lib/db/db";
import { games, users } from "@/lib/db/schema";
import {
	type UpdateGameInput,
	updateGameSchema,
} from "@/schemas/games/update";
import { eq, and } from "drizzle-orm";

interface UpdateGameResult {
	gameId: string;
	message: string;
}

export async function updateGame(
	gameId: string,
	input: UpdateGameInput,
	clerkUserId: string,
): Promise<UpdateGameResult> {
	const data = updateGameSchema.parse(input);

	// Get the user's database ID from their Clerk ID
	const user = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.clerkID, clerkUserId))
		.limit(1);

	if (!user.length) {
		throw new Error("User not found");
	}

	const userId = user[0].id;

	// Fetch the game to verify ownership and status
	const [game] = await db
		.select({ authorID: games.authorID, status: games.status })
		.from(games)
		.where(eq(games.id, gameId))
		.limit(1);

	if (!game) {
		throw new Error("Game not found");
	}

	// Check if the user is the author
	if (game.authorID !== userId) {
		throw new Error("Only the game author can edit this game");
	}

	// Check if the game is in DRAFT status
	if (game.status !== "DRAFT") {
		throw new Error(
			"Game can only be edited while in DRAFT status. Current status: " +
				game.status,
		);
	}

	// Build the update object with only provided fields
	const updateData: Record<string, unknown> = {};

	if (data.priceLimit !== undefined) {
		updateData.priceLimit = data.priceLimit.toString();
	}
	if (data.deadline !== undefined) {
		updateData.deadline = data.deadline;
	}
	if (data.categories !== undefined) {
		updateData.categories = data.categories;
	}
	if (data.status !== undefined) {
		updateData.status = data.status;
	}

	// If no fields to update, return early
	if (Object.keys(updateData).length === 0) {
		return {
			gameId,
			message: "No fields to update",
		};
	}

	// Update the game
	await db
		.update(games)
		.set(updateData)
		.where(eq(games.id, gameId));

	return {
		gameId,
		message: "Game updated successfully",
	};
}
