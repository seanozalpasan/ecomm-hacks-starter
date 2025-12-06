import {
	type BasicsInput,
	basicsInputSchema,
} from "@/schemas/onboarding/basics";

interface BasicsResult {
	data: BasicsInput;
	message: string;
}

export async function saveBasics(input: BasicsInput): Promise<BasicsResult> {
	const data = basicsInputSchema.parse(input);

	// Placeholder for domain persistence (e.g., DB call)
	return {
		data,
		message: "Basics information saved successfully",
	};
}
