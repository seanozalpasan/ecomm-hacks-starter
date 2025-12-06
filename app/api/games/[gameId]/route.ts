import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { getGameDetails } from "@/services/games/get-game";

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
				error:
					error instanceof Error ? error.message : "Internal server error",
			},
			{ status: 500 },
		);
	}
}
