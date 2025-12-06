import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { gameParticipants, games, users } from "@/lib/db/schema";

export async function GET(_request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get the user's database ID from their Clerk ID
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

		// Get all games where the user is a participant OR the author
		const userGameParticipants = await db
			.select({
				gameID: gameParticipants.gameID,
			})
			.from(gameParticipants)
			.where(eq(gameParticipants.userID, user.id));

		// Get games where user is the author
		const authoredGames = await db
			.select({
				id: games.id,
			})
			.from(games)
			.where(eq(games.authorID, user.id));

		// Combine participant game IDs and authored game IDs
		const participantGameIds = userGameParticipants.map((gp) => gp.gameID);
		const authoredGameIds = authoredGames.map((g) => g.id);
		const allGameIds = [
			...new Set([...participantGameIds, ...authoredGameIds]),
		];

		if (allGameIds.length === 0) {
			return NextResponse.json(
				{
					success: true,
					data: [],
				},
				{ status: 200 },
			);
		}

		const gameIds = allGameIds;

		// Get game details with participant counts and author info
		// Filter to only ACTIVE and DRAFT games (exclude CANCELLED and COMPLETED)
		const userGames = await db
			.select({
				id: games.id,
				deadline: games.deadline,
				status: games.status,
				authorID: games.authorID,
			})
			.from(games)
			.where(
				and(
					inArray(games.id, gameIds),
					inArray(games.status, ["ACTIVE", "DRAFT"]),
				),
			);

		// Get author names for games
		const authorIds = [...new Set(userGames.map((g) => g.authorID))];
		const authors = await db
			.select({
				id: users.id,
				name: users.name,
			})
			.from(users)
			.where(inArray(users.id, authorIds));

		const authorMap = new Map(authors.map((a) => [a.id, a.name]));

		// Get participant counts for each game
		const participantCounts = await db
			.select({
				gameID: gameParticipants.gameID,
				count: sql<number>`count(${gameParticipants.userID})`.as("count"),
			})
			.from(gameParticipants)
			.where(inArray(gameParticipants.gameID, gameIds))
			.groupBy(gameParticipants.gameID);

		// Create a map of gameID to participant count
		const countMap = new Map(
			participantCounts.map((pc) => [pc.gameID, Number(pc.count)]),
		);

		// For games authored by the user, ensure they're counted if not already a participant
		// This handles the case where the author hasn't accepted an invite yet
		for (const game of userGames) {
			if (!countMap.has(game.id)) {
				// Check if user is the author
				const isAuthor = authoredGameIds.includes(game.id);
				// If author and no participants yet, set count to 1 (the author)
				// Otherwise, set to 0
				countMap.set(game.id, isAuthor ? 1 : 0);
			}
		}

		// Format the response
		const formattedGames = userGames.map((game) => {
			// Format deadline as "Due 17th December"
			const deadlineDate = new Date(game.deadline);
			const day = deadlineDate.getDate();
			const month = deadlineDate.toLocaleDateString("en-US", {
				month: "long",
			});

			// Add ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
			const getOrdinalSuffix = (n: number): string => {
				const s = ["th", "st", "nd", "rd"];
				const v = n % 100;
				return n + (s[(v - 20) % 10] || s[v] || s[0]);
			};

			const dueDate = `Due ${getOrdinalSuffix(day)} ${month}`;

			// Generate game name from author name + "Secret Santa"
			const authorName = authorMap.get(game.authorID) || "Secret Santa";
			const name = `${authorName}'s Secret Santa`;

			// Map database status to UI status
			const statusMap: Record<string, "Active" | "In Progress"> = {
				ACTIVE: "Active",
				DRAFT: "In Progress",
			};

			return {
				id: game.id,
				name,
				dueDate,
				players: countMap.get(game.id) ?? 0,
				status: statusMap[game.status] ?? "In Progress",
			};
		});

		return NextResponse.json(
			{
				success: true,
				data: formattedGames,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error fetching games:", error);

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Internal server error",
			},
			{ status: 500 },
		);
	}
}
