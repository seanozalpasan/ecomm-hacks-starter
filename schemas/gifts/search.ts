import { z } from "zod";

export const giftSearchInputSchema = z.object({
	query: z.string().min(1, "Please enter a search query"),
});

export type GiftSearchInput = z.infer<typeof giftSearchInputSchema>;
