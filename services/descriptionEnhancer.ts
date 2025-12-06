import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Clean raw text by removing common web artifacts
 */
function cleanRawText(text: string): string {
	if (!text) return "";

	return (
		text
			// Remove common skip navigation links
			.replace(/\[?Skip\s+(?:to|To)\s+(?:Main\s+)?Content\]?/gi, "")
			.replace(/\[?Skip\s+to\s+(?:Header|Footer)\]?/gi, "")

			// Remove standalone URLs and URL fragments
			.replace(/\(https?:\/\/[^\s)]+\)/g, "")
			.replace(/https?:\/\/[^\s]+/g, "")

			// Remove markdown link syntax remnants
			.replace(/\]\([^)]*\)/g, "")
			.replace(/\[([^\]]+)\]\s*$/g, "$1")

			// Remove common UI text
			.replace(/You are currently on the [^.]+\./gi, "")
			.replace(/Select a location to view location-specific content/gi, "")

			// Remove excessive whitespace
			.replace(/\s+/g, " ")
			.trim()
	);
}

/**
 * Enhance product descriptions using Gemini
 */
export async function enhanceProductDescriptions(
	products: Array<{
		title: string;
		description: string;
		category: string;
		price: string;
		url: string;
	}>,
): Promise<Array<{ description: string }>> {
	if (products.length === 0) return [];

	try {
		// Pre-clean descriptions with regex
		const cleanedProducts = products.map((p) => ({
			...p,
			description: cleanRawText(p.description),
		}));

		const prompt = `You are a product description specialist. Clean and enhance these product descriptions for an e-commerce gift recommendation system.

For each product, create a concise, natural 1-2 sentence description that:
- Focuses on key features and benefits
- Removes any navigation text, URLs, or web artifacts
- Sounds natural and helpful for gift shopping
- Is 20-40 words maximum
- Does NOT include price information

Products:
${cleanedProducts
	.map(
		(p, i) =>
			`${i + 1}. ${p.title} (${p.category})
Raw: ${p.description}`,
	)
	.join("\n\n")}

Return ONLY a JSON array of objects with "description" field, one for each product in order.`;

		const response = await ai.models.generateContent({
			model: "gemini-3-pro-preview",
			contents: prompt,
			config: {
				responseMimeType: "application/json",
				responseSchema: {
					type: "ARRAY",
					items: {
						type: "OBJECT",
						properties: {
							description: {
								type: "STRING",
								description: "Clean, concise product description",
							},
						},
						required: ["description"],
					},
				},
			},
		});

		const enhanced = JSON.parse(response.text || "[]") as Array<{
			description: string;
		}>;

		// Fallback to cleaned descriptions if AI fails
		if (enhanced.length !== products.length) {
			console.warn(
				`Gemini returned ${enhanced.length} descriptions for ${products.length} products. Using cleaned originals.`,
			);
			return cleanedProducts.map((p) => ({ description: p.description }));
		}

		return enhanced;
	} catch (error) {
		console.error("Failed to enhance descriptions with Gemini:", error);
		// Fallback to regex-cleaned descriptions
		return products.map((p) => ({
			description: cleanRawText(p.description),
		}));
	}
}

/**
 * Quick clean for a single description (no AI, just regex)
 */
export function cleanDescription(description: string): string {
	return cleanRawText(description);
}
