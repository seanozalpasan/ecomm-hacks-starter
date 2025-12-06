import { z } from "zod";

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
