import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { users, savedGiftSuggestions } from "@/lib/db/schema";
import {
	getSavedGiftById,
	deleteSavedGift,
} from "@/services/saved-gift-suggestions/query";

type RouteContext = {
	params: Promise<{ savedId: string }>;
};

/**
 * GET /api/gifts/saved/[savedId]
 * Get a single saved gift suggestion by ID
 */
export async function GET(_request: NextRequest, context: RouteContext) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { savedId } = await context.params;

		if (!savedId) {
			return NextResponse.json(
				{ error: "Saved gift ID is required" },
				{ status: 400 },
			);
		}

		const savedGift = await getSavedGiftById(savedId);

		if (!savedGift) {
			return NextResponse.json(
				{ error: "Saved gift not found" },
				{ status: 404 },
			);
		}

		// Get the user's database ID to verify ownership
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

		// Verify the user owns this saved gift
		if (savedGift.giverID !== user.id) {
			return NextResponse.json(
				{ error: "You do not have permission to view this saved gift" },
				{ status: 403 },
			);
		}

		return NextResponse.json(savedGift, { status: 200 });
	} catch (error) {
		console.error("Error fetching saved gift:", {
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
 * DELETE /api/gifts/saved/[savedId]
 * Delete a saved gift suggestion
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { savedId } = await context.params;

		if (!savedId) {
			return NextResponse.json(
				{ error: "Saved gift ID is required" },
				{ status: 400 },
			);
		}

		// Get the user's database ID
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

		// Verify the user owns this saved gift before deleting
		const [existingGift] = await db
			.select()
			.from(savedGiftSuggestions)
			.where(
				and(
					eq(savedGiftSuggestions.id, savedId),
					eq(savedGiftSuggestions.giverID, user.id),
				),
			)
			.limit(1);

		if (!existingGift) {
			return NextResponse.json(
				{
					error:
						"Saved gift not found or you do not have permission to delete it",
				},
				{ status: 404 },
			);
		}

		// Delete the saved gift
		const deleted = await deleteSavedGift(savedId);

		if (!deleted) {
			return NextResponse.json(
				{ error: "Failed to delete saved gift" },
				{ status: 500 },
			);
		}

		return NextResponse.json(
			{
				success: true,
				message: "Saved gift deleted successfully",
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error deleting saved gift:", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

