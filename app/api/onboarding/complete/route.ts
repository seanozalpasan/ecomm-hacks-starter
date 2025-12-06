import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { basicsInputSchema } from "@/schemas/onboarding/basics";
import { likesInputSchema } from "@/schemas/onboarding/likes";
import {
	type CompleteOnboardingInput,
	completeOnboarding,
} from "@/services/onboarding/complete";

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
});

export async function POST(request: NextRequest) {
	try {
		const { userId, sessionClaims } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const parsed = payloadSchema.parse(body);

		// Validate using existing schemas for consistency
		basicsInputSchema.parse({
			...parsed.basics,
			birthday: new Date(parsed.basics.birthday),
		});
		likesInputSchema.parse(parsed.likes);

		const email =
			typeof sessionClaims === "object" && sessionClaims
				? // @ts-expect-error sessionClaims may not have email depending on Clerk config
					(sessionClaims.email ??
					// @ts-expect-error
					sessionClaims.email_address ??
					"")
				: "";

		const input: CompleteOnboardingInput = {
			clerkId: userId,
			email,
			basics: parsed.basics,
			likes: parsed.likes,
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
