import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/db";
import { gameInvites, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireOnboarding } from "@/lib/utils/api-auth";

const declineInviteSchema = z.object({
	inviteId: z.string().uuid("Invalid invite ID"),
});

export async function POST(request: NextRequest) {
	try {
		const { userId, sessionClaims } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Check if user has completed onboarding
		const onboardingError = await requireOnboarding(userId);
		if (onboardingError) {
			return onboardingError;
		}

		// Get user's email from database
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.clerkID, userId))
			.limit(1);

		if (!user) {
			return NextResponse.json(
				{ error: "User not found. Please complete onboarding first." },
				{ status: 404 },
			);
		}

		// Get user's email from Clerk session claims or use DB email as fallback
		const email: string =
			typeof sessionClaims === "object" && sessionClaims
				? ((sessionClaims as any).email ??
				  (sessionClaims as any).email_address ??
				  user.email)
				: user.email;

		const body = await request.json();
		const { inviteId } = declineInviteSchema.parse(body);

		// Get the invite
		const invite = await db
			.select({
				id: gameInvites.id,
				status: gameInvites.status,
				email: gameInvites.email,
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

		// Verify that the invite belongs to the authenticated user
		if (invite[0].email !== email) {
			return NextResponse.json(
				{
					success: false,
					error: "You are not authorized to decline this invite",
				},
				{ status: 403 },
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
