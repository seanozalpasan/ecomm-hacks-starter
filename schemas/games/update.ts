import { z } from "zod";

export const updateGameSchema = z.object({
	priceLimit: z.coerce.number().min(0).max(10000).optional(),
	deadline: z.coerce
		.date()
		.refine((value) => value > new Date(), "Deadline must be in the future")
		.optional(),
	categories: z.array(z.string()).optional(),
	status: z.enum(["DRAFT", "ACTIVE", "CANCELLED", "COMPLETED"]).optional(),
});

export type UpdateGameInput = z.infer<typeof updateGameSchema>;
