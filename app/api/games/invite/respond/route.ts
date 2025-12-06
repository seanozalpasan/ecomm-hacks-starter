import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { inviteResponseSchema } from "@/schemas/games/invite-response";
import { respondToInvite } from "@/services/games/invite-response";
import { requireOnboarding } from "@/lib/utils/api-auth";

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Check if user has completed onboarding
		const onboardingError = await requireOnboarding(userId);
		if (onboardingError) {
			return onboardingError;
		}

		const body = await request.json();
		const validatedData = inviteResponseSchema.parse(body);
		const result = await respondToInvite(validatedData, userId);

		return NextResponse.json(
			{
				success: true,
				data: result,
				message: result.message,
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
