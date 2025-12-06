import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateGameSchema } from "@/schemas/games/update";
import { getGameDetails } from "@/services/games/get-game";
import { updateGame } from "@/services/games/update";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ gameId: string }> },
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { gameId } = await params;
		const game = await getGameDetails(gameId);

		if (!game) {
			return NextResponse.json(
				{
					success: false,
					error: "Game not found",
				},
				{ status: 404 },
			);
		}

		return NextResponse.json(
			{
				success: true,
				data: game,
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

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ gameId: string }> },
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { gameId } = await params;
		const body = await request.json();
		const validatedData = updateGameSchema.parse(body);
		const result = await updateGame(gameId, validatedData, userId);

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

		// Handle specific business logic errors
		if (error instanceof Error) {
			if (
				error.message.includes("not found") ||
				error.message.includes("User not found")
			) {
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
				error.message.includes("can only be edited")
			) {
				return NextResponse.json(
					{
						success: false,
						error: error.message,
					},
					{ status: 403 },
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
