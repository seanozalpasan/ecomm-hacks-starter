import { z } from "zod";

export const giftSearchInputSchema = z.object({
	query: z.string().min(1, "Search query is required"),
});

export type GiftSearchInput = z.infer<typeof giftSearchInputSchema>;
