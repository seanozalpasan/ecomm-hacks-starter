import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createGameSchema } from "@/schemas/games/create";
import { createGame } from "@/services/games/create";

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const validatedData = createGameSchema.parse(body);
		const result = await createGame(validatedData, userId);

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

		// Check if it's a validation error (like self-invite or no invites)
		const errorMessage =
			error instanceof Error ? error.message : "Internal server error";
		const isValidationError =
			errorMessage.includes("cannot invite yourself") ||
			errorMessage.includes("must invite at least one");

		return NextResponse.json(
			{
				success: false,
				error: errorMessage,
			},
			{ status: isValidationError ? 400 : 500 },
		);
	}
}
