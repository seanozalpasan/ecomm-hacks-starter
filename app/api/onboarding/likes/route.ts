import { type NextRequest, NextResponse } from "next/server";
import { likesInputSchema } from "@/schemas/onboarding/likes";
import { saveLikes } from "@/services/onboarding/likes";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const validatedData = likesInputSchema.parse(body);
		const result = await saveLikes(validatedData);

		return NextResponse.json(
			{
				success: true,
				data: result.data,
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

		return NextResponse.json(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 500 },
		);
	}
}
