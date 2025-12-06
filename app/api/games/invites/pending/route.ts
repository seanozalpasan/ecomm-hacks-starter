import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { getPendingInvites } from "@/services/games/get-pending-invites";
import { requireOnboarding } from "@/lib/utils/api-auth";

export async function GET(request: NextRequest) {
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

		const invites = await getPendingInvites(userId);

		return NextResponse.json(
			{
				success: true,
				data: invites,
			},
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Internal server error",
			},
			{ status: 500 },
		);
	}
}

