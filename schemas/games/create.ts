import { z } from "zod";

export const gameBasicsSchema = z.object({
	name: z.string().min(1, "Game name is required").max(100, "Game name is too long"),
	priceLimit: z
		.number()
		.min(0, "Price limit must be at least 0")
		.max(10000, "Price limit is too high"),
	deadline: z
		.date()
		.refine(
			(value) => !Number.isNaN(value.getTime()),
			"Please select a valid deadline",
		)
		.refine(
			(value) => value > new Date(),
			"Deadline must be in the future",
		),
	categories: z.array(z.string()).optional().default([]),
});

export type GameBasicsInput = z.infer<typeof gameBasicsSchema>;

export const gameInviteSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
});

export type GameInviteInput = z.infer<typeof gameInviteSchema>;

export const createGameSchema = z.object({
	name: z.string().min(1, "Game name is required").max(100, "Game name is too long"),
	priceLimit: z.coerce.number().min(0).max(10000),
	deadline: z.coerce.date().refine((value) => value > new Date(), "Deadline must be in the future"),
	categories: z.array(z.string()).default([]),
	invites: z.array(z.string().email()).min(1, "At least one invite is required"),
});

export type CreateGameInput = z.infer<typeof createGameSchema>;
