import { type LikesInput, likesInputSchema } from "@/schemas/onboarding/likes";

interface LikesResult {
	data: LikesInput;
	message: string;
}

export async function saveLikes(input: LikesInput): Promise<LikesResult> {
	const data = likesInputSchema.parse(input);

	// Placeholder for domain persistence (e.g., DB call)
	return {
		data,
		message: "Likes information saved successfully",
	};
}
