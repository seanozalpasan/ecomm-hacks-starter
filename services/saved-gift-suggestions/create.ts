import { db } from "@/lib/db/db";
import { savedGiftSuggestions } from "@/lib/db/schema";
import type { ProductResult } from "@/lib/api/searchGifts";

export interface SaveGiftSuggestionInput {
	gameID: string;
	giverID: string;
	recipientID: string;
	product: ProductResult;
}

export interface SaveGiftSuggestionsResult {
	count: number;
	savedIds: string[];
}

/**
 * Save a single gift suggestion
 * @param input - The gift suggestion data
 * @returns The saved gift suggestion with its ID
 */
export async function saveGiftSuggestion(input: SaveGiftSuggestionInput) {
	const [saved] = await db
		.insert(savedGiftSuggestions)
		.values({
			gameID: input.gameID,
			giverID: input.giverID,
			recipientID: input.recipientID,
			title: input.product.title,
			price: input.product.price,
			priceUsd: input.product.priceUsd?.toString() ?? null,
			description: input.product.description,
			url: input.product.url,
			imageUrl: input.product.imageUrl ?? null,
			images: input.product.images ?? null,
			sourceQuery: input.product.sourceQuery,
			category: input.product.category ?? null,
			deliveryDate: input.product.deliveryDate ?? null,
			daysToShip: input.product.daysToShip ?? null,
		})
		.returning({ id: savedGiftSuggestions.id });

	return saved;
}

/**
 * Save multiple gift suggestions in a single batch for optimal performance
 * @param inputs - Array of gift suggestion data
 * @returns The count and IDs of saved suggestions
 */
export async function saveGiftSuggestionsBatch(
	inputs: SaveGiftSuggestionInput[],
): Promise<SaveGiftSuggestionsResult> {
	if (inputs.length === 0) {
		return { count: 0, savedIds: [] };
	}

	const values = inputs.map((input) => ({
		gameID: input.gameID,
		giverID: input.giverID,
		recipientID: input.recipientID,
		title: input.product.title,
		price: input.product.price,
		priceUsd: input.product.priceUsd?.toString() ?? null,
		description: input.product.description,
		url: input.product.url,
		imageUrl: input.product.imageUrl ?? null,
		images: input.product.images ?? null,
		sourceQuery: input.product.sourceQuery,
		category: input.product.category ?? null,
		deliveryDate: input.product.deliveryDate ?? null,
		daysToShip: input.product.daysToShip ?? null,
	}));

	const saved = await db
		.insert(savedGiftSuggestions)
		.values(values)
		.returning({ id: savedGiftSuggestions.id });

	return {
		count: saved.length,
		savedIds: saved.map((s) => s.id),
	};
}
