import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { generateGiftSuggestions } from "@/services/gifts/suggestions";

export async function POST(request: NextRequest) {
	const requestId = crypto.randomUUID();

	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { query } = body ?? {};

		if (!query) {
			return NextResponse.json({ error: "Query is required" }, { status: 400 });
		}

		const result = await generateGiftSuggestions({ query, userId });

		return NextResponse.json(
			{
				...result,
				requestId,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error(`[${requestId}] Error in gift suggestions route:`, {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return NextResponse.json(
			{ error: "Internal server error", requestId },
			{ status: 500 },
		);
	}
}
