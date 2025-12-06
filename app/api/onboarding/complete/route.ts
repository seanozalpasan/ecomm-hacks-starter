import { auth, currentUser } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { basicsInputSchema, likesInputSchema } from "@/schemas/onboarding";
import {
	type CompleteOnboardingInput,
	completeOnboarding,
} from "@/services/onboarding";

const payloadSchema = z.object({
	basics: z.object({
		birthday: z.string(),
		name: z.string(),
		location: z.string(),
	}),
	likes: z.object({
		favoriteColor: z.string(),
		favoriteHobby: z.string(),
		favoriteGift: z.string(),
	}),
	interests: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get user email from Clerk
		const user = await currentUser();
		const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

		if (!email) {
			return NextResponse.json(
				{ error: "Email not found in user profile" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const parsed = payloadSchema.parse(body);

		// Validate using existing schemas for consistency
		basicsInputSchema.parse({
			...parsed.basics,
			birthday: new Date(parsed.basics.birthday),
		});
		likesInputSchema.parse(parsed.likes);

		const input: CompleteOnboardingInput = {
			clerkId: userId,
			email,
			basics: parsed.basics,
			likes: parsed.likes,
			interests: parsed.interests,
		};

		const result = await completeOnboarding(input);

		return NextResponse.json(
			{
				success: true,
				...result,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error in onboarding complete route:", error);

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

		const errorMessage =
			error instanceof Error ? error.message : "Internal server error";

		return NextResponse.json(
			{
				success: false,
				error: errorMessage,
			},
			{ status: 500 },
		);
	}
}
