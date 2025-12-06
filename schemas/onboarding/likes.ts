import { z } from "zod";

export const likesInputSchema = z.object({
	favoriteColor: z
		.string()
		.min(1, "Favorite color is required")
		.max(500, "Answer is too long"),
	favoriteHobby: z
		.string()
		.min(1, "Favorite hobby is required")
		.max(500, "Answer is too long"),
	favoriteGift: z
		.string()
		.min(1, "Favorite gift is required")
		.max(500, "Answer is too long"),
});

export type LikesInput = z.infer<typeof likesInputSchema>;
