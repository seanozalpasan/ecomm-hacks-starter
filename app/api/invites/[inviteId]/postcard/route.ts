import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY,
});

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ inviteId: string }> },
) {
	try {
		if (!process.env.GEMINI_API_KEY) {
			return NextResponse.json(
				{ error: "Missing GEMINI_API_KEY" },
				{ status: 500 },
			);
		}

		const { inviteId } = await params;

		// Fetch invite details to personalize the postcard
		const inviteResponse = await fetch(
			`${request.nextUrl.origin}/api/games/invite/${inviteId}`,
		);

		if (!inviteResponse.ok) {
			return NextResponse.json(
				{ error: "Failed to fetch invite details" },
				{ status: 404 },
			);
		}

		const inviteData = await inviteResponse.json();
		const invite = inviteData.data;

		const gameName = invite.game.name || "Secret Santa";
		const authorName = invite.game.author.name;
		const deadline = new Date(invite.game.deadline);
		const formattedDeadline = deadline.toLocaleDateString("en-US", {
			month: "long",
			day: "numeric",
		});

		// Create a personalized Christmas postcard prompt
		const prompt = `Create a beautiful, festive Christmas postcard image for a Secret Santa gift exchange invitation. The postcard should feature:

- A warm, inviting Christmas scene with traditional holiday elements (snow, decorated tree, cozy atmosphere)
- Elegant typography displaying "You're Invited!" in a festive style
- The text "${gameName}" should be prominently featured
- A welcoming, joyful holiday aesthetic suitable for a gift exchange invitation
- Professional, high-quality illustration style with rich colors
- The overall mood should be cheerful and inviting

The image should be suitable for a digital invitation card, with a 16:9 aspect ratio, warm color palette, and clear, readable text.`;

		// Generate image using Nano Banana / Gemini image-capable model
		const response = await ai.models.generateContent({
			model: "gemini-2.0-flash-exp", // image-capable
			contents: [
				{
					role: "user",
					parts: [{ text: prompt }],
				},
			],
			config: {
				responseModalities: ["IMAGE"],
			},
		});

		if ((response as any).error) {
			throw new Error((response as any).error.message || "Gemini error");
		}

		// Extract image data from response
		// The response structure for image generation may differ from text generation
		let imageData: string | null = null;
		let mimeType = "image/png";

		// Try to extract image from various possible response structures
		const candidates = (response as any).candidates || [];
		if (candidates.length > 0) {
			const parts = candidates[0]?.content?.parts || [];
			for (const part of parts) {
				// Check for inlineData (camelCase)
				if (part.inlineData?.data) {
					imageData = part.inlineData.data;
					mimeType = part.inlineData.mimeType || mimeType;
					break;
				}
				// Check for inline_data (snake_case)
				if (part.inline_data?.data) {
					imageData = part.inline_data.data;
					mimeType = part.inline_data.mime_type || mimeType;
					break;
				}
			}
		}

		// Fallback: check if response has direct image property
		if (!imageData && (response as any).image) {
			imageData = (response as any).image;
		}

		// Fallback: check response.text for base64 (some APIs return it as text)
		if (!imageData && (response as any).text) {
			imageData = (response as any).text;
		}

		if (!imageData) {
			console.error("Unexpected response structure:", JSON.stringify(response, null, 2));
			throw new Error("Failed to extract image data from response");
		}

		// Return the image as base64 data URL
		const base64Image = imageData.startsWith("data:")
			? imageData
			: `data:${mimeType};base64,${imageData}`;

		return NextResponse.json({
			image: base64Image,
		});
	} catch (error) {
		console.error("Error generating postcard:", error);
		return NextResponse.json(
			{
				error: "Failed to generate postcard",
				message:
					error instanceof Error
						? error.message
						: typeof error === "string"
							? error
							: "Unknown error",
			},
			{ status: 500 },
		);
	}
}

