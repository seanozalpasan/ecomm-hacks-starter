import { type NextRequest, NextResponse } from "next/server";
import { getInviteDetails } from "@/services/games/get-invite";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ inviteId: string }> },
) {
	try {
		const { inviteId } = await params;
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
