import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendGameInvite } from "@/services/games/send-invite";
import { requireOnboarding } from "@/lib/utils/api-auth";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ gameId: string }> },
) {
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

		const { gameId } = await params;
		const body = await request.json();

		// Validate the email
		const emailSchema = z.object({
			email: z.string().email("Invalid email address"),
		});

		const { email } = emailSchema.parse(body);

		const result = await sendGameInvite({ gameId, email }, userId);

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

		if (error instanceof Error) {
			// Check for specific error messages
			if (error.message.includes("not found")) {
				return NextResponse.json(
					{
						success: false,
						error: error.message,
					},
					{ status: 404 },
				);
			}

			if (
				error.message.includes("Only the game author") ||
				error.message.includes("cannot invite yourself") ||
				error.message.includes("already been invited")
			) {
				return NextResponse.json(
					{
						success: false,
						error: error.message,
					},
					{ status: 400 },
				);
			}
		}

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Internal server error",
			},
			{ status: 500 },
		);
	}
}
