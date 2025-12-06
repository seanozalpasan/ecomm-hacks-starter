import { z } from "zod";

export const giftSearchInputSchema = z.object({
	query: z.string().min(1, "Search query is required"),
	gameId: z.string().uuid("Game ID must be a valid UUID"),
	priceLimit: z.string().nullable().optional(),
});

export type GiftSearchInput = z.infer<typeof giftSearchInputSchema>;
