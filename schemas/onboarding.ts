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

export const basicsInputSchema = z.object({
	birthday: z.coerce
		.date()
		.refine(
			(value) => !Number.isNaN(value.getTime()),
			"Please select a valid birthday",
		)
		.refine((value) => value <= new Date(), "Birthday cannot be in the future"),
	name: z.string().min(1, "Name is required").max(100, "Name is too long"),
	location: z
		.string()
		.min(1, "Location is required")
		.max(200, "Location is too long"),
});

export type BasicsInput = z.infer<typeof basicsInputSchema>;
