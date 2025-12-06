import { and, eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { savedGiftSuggestions, users } from "@/lib/db/schema";
import type { ProductResult } from "@/lib/api/searchGifts";

/**
 * Get all saved gift suggestions for a specific game
 * @param gameID - The game's database ID
 * @returns Array of saved gift suggestions with giver and recipient info
 */
export async function getSavedGiftsByGame(gameID: string) {
	const results = await db
		.select({
			id: savedGiftSuggestions.id,
			gameID: savedGiftSuggestions.gameID,
			giverID: savedGiftSuggestions.giverID,
			recipientID: savedGiftSuggestions.recipientID,
			title: savedGiftSuggestions.title,
			price: savedGiftSuggestions.price,
			priceUsd: savedGiftSuggestions.priceUsd,
			description: savedGiftSuggestions.description,
			url: savedGiftSuggestions.url,
			imageUrl: savedGiftSuggestions.imageUrl,
			images: savedGiftSuggestions.images,
			sourceQuery: savedGiftSuggestions.sourceQuery,
			category: savedGiftSuggestions.category,
			deliveryDate: savedGiftSuggestions.deliveryDate,
			daysToShip: savedGiftSuggestions.daysToShip,
			savedAt: savedGiftSuggestions.savedAt,
			giverName: users.name,
		})
		.from(savedGiftSuggestions)
		.leftJoin(users, eq(savedGiftSuggestions.giverID, users.id))
		.where(eq(savedGiftSuggestions.gameID, gameID))
		.orderBy(desc(savedGiftSuggestions.savedAt));

	return results;
}

/**
 * Get all saved gift suggestions where the user is the giver
 * @param giverID - The giver's user database ID
 * @param gameID - Optional game ID to filter by
 * @returns Array of saved gift suggestions
 */
export async function getSavedGiftsByGiver(
	giverID: string,
	gameID?: string,
) {
	const conditions = gameID
		? and(
				eq(savedGiftSuggestions.giverID, giverID),
				eq(savedGiftSuggestions.gameID, gameID),
			)
		: eq(savedGiftSuggestions.giverID, giverID);

	const results = await db
		.select({
			id: savedGiftSuggestions.id,
			gameID: savedGiftSuggestions.gameID,
			giverID: savedGiftSuggestions.giverID,
			recipientID: savedGiftSuggestions.recipientID,
			title: savedGiftSuggestions.title,
			price: savedGiftSuggestions.price,
			priceUsd: savedGiftSuggestions.priceUsd,
			description: savedGiftSuggestions.description,
			url: savedGiftSuggestions.url,
			imageUrl: savedGiftSuggestions.imageUrl,
			images: savedGiftSuggestions.images,
			sourceQuery: savedGiftSuggestions.sourceQuery,
			category: savedGiftSuggestions.category,
			deliveryDate: savedGiftSuggestions.deliveryDate,
			daysToShip: savedGiftSuggestions.daysToShip,
			savedAt: savedGiftSuggestions.savedAt,
			recipientName: users.name,
		})
		.from(savedGiftSuggestions)
		.leftJoin(users, eq(savedGiftSuggestions.recipientID, users.id))
		.where(conditions)
		.orderBy(desc(savedGiftSuggestions.savedAt));

	return results;
}

/**
 * Get all saved gift suggestions for a specific giver-recipient pair in a game
 * @param gameID - The game's database ID
 * @param giverID - The giver's user database ID
 * @param recipientID - The recipient's user database ID
 * @returns Array of saved gift suggestions
 */
export async function getSavedGiftsByMatch(
	gameID: string,
	giverID: string,
	recipientID: string,
) {
	const results = await db
		.select()
		.from(savedGiftSuggestions)
		.where(
			and(
				eq(savedGiftSuggestions.gameID, gameID),
				eq(savedGiftSuggestions.giverID, giverID),
				eq(savedGiftSuggestions.recipientID, recipientID),
			),
		)
		.orderBy(desc(savedGiftSuggestions.savedAt));

	return results;
}

/**
 * Get a single saved gift suggestion by ID
 * @param id - The saved gift suggestion ID
 * @returns The saved gift suggestion or null if not found
 */
export async function getSavedGiftById(id: string) {
	const [result] = await db
		.select()
		.from(savedGiftSuggestions)
		.where(eq(savedGiftSuggestions.id, id))
		.limit(1);

	return result ?? null;
}

/**
 * Convert a saved gift suggestion to ProductResult format
 * @param saved - The saved gift suggestion from the database
 * @returns ProductResult object
 */
export function toProductResult(
	saved: typeof savedGiftSuggestions.$inferSelect,
): ProductResult {
	return {
		title: saved.title,
		price: saved.price,
		priceUsd: saved.priceUsd ? Number(saved.priceUsd) : undefined,
		description: saved.description,
		url: saved.url,
		imageUrl: saved.imageUrl ?? "",
		images: saved.images ?? undefined,
		sourceQuery: saved.sourceQuery,
		category: saved.category ?? "",
		deliveryDate: saved.deliveryDate ?? undefined,
		daysToShip: saved.daysToShip ?? undefined,
	};
}

/**
 * Delete a saved gift suggestion
 * @param id - The saved gift suggestion ID
 * @returns The deleted gift suggestion or null if not found
 */
export async function deleteSavedGift(id: string) {
	const [deleted] = await db
		.delete(savedGiftSuggestions)
		.where(eq(savedGiftSuggestions.id, id))
		.returning();

	return deleted ?? null;
}

/**
 * Delete all saved gift suggestions for a specific match
 * @param gameID - The game's database ID
 * @param giverID - The giver's user database ID
 * @param recipientID - The recipient's user database ID
 * @returns The count of deleted suggestions
 */
export async function deleteSavedGiftsByMatch(
	gameID: string,
	giverID: string,
	recipientID: string,
) {
	const deleted = await db
		.delete(savedGiftSuggestions)
		.where(
			and(
				eq(savedGiftSuggestions.gameID, gameID),
				eq(savedGiftSuggestions.giverID, giverID),
				eq(savedGiftSuggestions.recipientID, recipientID),
			),
		)
		.returning({ id: savedGiftSuggestions.id });

	return deleted.length;
}
