import { z } from "zod";

export const inviteResponseSchema = z.object({
	inviteId: z.string().uuid("Invalid invite ID"),
	action: z.enum(["accept", "decline"]),
});

export type InviteResponseInput = z.infer<typeof inviteResponseSchema>;
