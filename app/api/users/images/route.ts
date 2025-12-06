import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { clerkIds } = await request.json();

		if (!Array.isArray(clerkIds)) {
			return NextResponse.json(
				{ error: "clerkIds must be an array" },
				{ status: 400 },
			);
		}

		const client = await clerkClient();

		// Fetch user data for all clerk IDs
		const userPromises = clerkIds.map(async (clerkId) => {
			try {
				const user = await client.users.getUser(clerkId);
				return {
					clerkId,
					imageUrl: user.imageUrl || null,
				};
			} catch (error) {
				console.error(`Failed to fetch user ${clerkId}:`, error);
				return {
					clerkId,
					imageUrl: null,
				};
			}
		});

		const users = await Promise.all(userPromises);

		return NextResponse.json({ users }, { status: 200 });
	} catch (error) {
		console.error("Error fetching user images:", error);
		return NextResponse.json(
			{ error: "Failed to fetch user images" },
			{ status: 500 },
		);
	}
}
