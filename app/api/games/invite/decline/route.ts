import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/db";
import { gameInvites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const declineInviteSchema = z.object({
	inviteId: z.string().uuid("Invalid invite ID"),
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { inviteId } = declineInviteSchema.parse(body);

		// Get the invite
		const invite = await db
			.select({
				id: gameInvites.id,
				status: gameInvites.status,
			})
			.from(gameInvites)
			.where(eq(gameInvites.id, inviteId))
			.limit(1);

		if (!invite.length) {
			return NextResponse.json(
				{
					success: false,
					error: "Invite not found",
				},
				{ status: 404 },
			);
		}

		if (invite[0].status !== "PENDING") {
			return NextResponse.json(
				{
					success: false,
					error: "This invite has already been responded to",
				},
				{ status: 400 },
			);
		}

		// Update the invite status to DECLINED
		await db
			.update(gameInvites)
			.set({ status: "DECLINED" })
			.where(eq(gameInvites.id, inviteId));

		return NextResponse.json(
			{
				success: true,
				message: "Invitation declined",
			},
			{ status: 200 },
		);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{
					success: false,
					error: "Validation failed",
					details: error.issues,
				},
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error ? error.message : "Internal server error",
			},
			{ status: 500 },
		);
	}
}
