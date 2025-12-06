import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { getUserGames } from "@/services/games/get-user-games";

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const games = await getUserGames(userId);

		return NextResponse.json(
			{
				success: true,
				data: games,
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
