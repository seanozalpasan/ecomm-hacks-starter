import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import {
	getSavedGiftsByGiver,
	getSavedGiftsByMatch,
	toProductResult,
} from "@/services/saved-gift-suggestions/query";
import { saveGiftSuggestion } from "@/services/saved-gift-suggestions/create";
import type { ProductResult } from "@/lib/api/searchGifts";

/**
 * POST /api/gifts/saved
 * Save a chosen gift for a recipient in a game
 */
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get the user's database ID from their Clerk ID
		const [user] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.clerkID, userId))
			.limit(1);

		if (!user) {
			return NextResponse.json(
				{ error: "User not found. Please complete onboarding first." },
				{ status: 404 },
			);
		}

		const body = await request.json();
		const { gameId, recipientId, product } = body as {
			gameId: string;
			recipientId: string;
			product: ProductResult;
		};

		if (!gameId || !recipientId || !product) {
			return NextResponse.json(
				{ error: "Missing required fields: gameId, recipientId, product" },
				{ status: 400 },
			);
		}

		// Save the gift suggestion
		const saved = await saveGiftSuggestion({
			gameID: gameId,
			giverID: user.id,
			recipientID: recipientId,
			product,
		});

		return NextResponse.json(
			{
				success: true,
				savedId: saved.id,
				message: "Gift saved successfully",
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Error saving gift:", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

/**
 * GET /api/gifts/saved
 * Query saved gift suggestions for the authenticated user
 * Query params:
 * - gameId (optional): Filter by game
 * - recipientId (optional): Filter by recipient (requires gameId)
 */
export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get the user's database ID from their Clerk ID
		const [user] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.clerkID, userId))
			.limit(1);

		if (!user) {
			return NextResponse.json(
				{ error: "User not found. Please complete onboarding first." },
				{ status: 404 },
			);
		}

		// Get query params
		const searchParams = request.nextUrl.searchParams;
		const gameId = searchParams.get("gameId");
		const recipientId = searchParams.get("recipientId");

		let savedGifts;

		if (gameId && recipientId) {
			// Get saved gifts for a specific match
			savedGifts = await getSavedGiftsByMatch(gameId, user.id, recipientId);
		} else if (gameId) {
			// Get saved gifts for a specific game
			savedGifts = await getSavedGiftsByGiver(user.id, gameId);
		} else {
			// Get all saved gifts for this user
			savedGifts = await getSavedGiftsByGiver(user.id);
		}

		// Convert to ProductResult format for consistency with the frontend
		const products = savedGifts.map((gift) => ({
			...toProductResult(gift),
			savedId: gift.id,
			savedAt: gift.savedAt,
			recipientName: "recipientName" in gift ? gift.recipientName : undefined,
		}));

		return NextResponse.json(
			{
				count: products.length,
				products,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error fetching saved gifts:", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

