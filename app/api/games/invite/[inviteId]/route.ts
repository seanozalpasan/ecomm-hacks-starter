import { type NextRequest, NextResponse } from "next/server";
import z from "zod";
import { getInviteDetails } from "@/services/games/get-invite";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ inviteId: string }> },
) {
	try {
		const { inviteId } = await params;

		if (z.uuid().safeParse(inviteId).error) {
			return NextResponse.json(
				{
					success: false,
					error: "Invalid invite ID",
				},
				{ status: 400 },
			);
		}

		const invite = await getInviteDetails(inviteId);

		if (!invite) {
			return NextResponse.json(
				{
					success: false,
					error: "Invite not found",
				},
				{ status: 404 },
			);
		}

		return NextResponse.json(
			{
				success: true,
				data: invite,
			},
			{ status: 200 },
		);
	} catch (error) {
		// If it's a database error related to invalid UUID format, return 404
		const errorMessage =
			error instanceof Error ? error.message : "Internal server error";

		// Check if it's a UUID-related database error
		if (
			errorMessage.includes("invalid input syntax for type uuid") ||
			errorMessage.includes("invalid UUID")
		) {
			return NextResponse.json(
				{
					success: false,
					error: "Invite not found",
				},
				{ status: 404 },
			);
		}

		return NextResponse.json(
			{
				success: false,
				error: errorMessage,
			},
			{ status: 500 },
		);
	}
}
