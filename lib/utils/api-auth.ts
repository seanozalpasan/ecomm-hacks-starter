import { NextResponse } from "next/server";
import { hasCompletedOnboarding } from "@/services/onboarding";

/**
 * Checks if a user has completed onboarding.
 * Returns an error response if the user hasn't completed onboarding.
 *
 * @param userId - The Clerk user ID to check
 * @returns NextResponse with 403 error if not onboarded, null if onboarded
 */
export async function requireOnboarding(
	userId: string,
): Promise<NextResponse | null> {
	const completed = await hasCompletedOnboarding(userId);

	if (!completed) {
		return NextResponse.json(
			{
				error: "Onboarding required",
				message: "You must complete onboarding before performing this action",
			},
			{ status: 403 },
		);
	}

	return null;
}
