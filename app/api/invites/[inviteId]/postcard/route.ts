import { GoogleGenAI } from "@google/genai";
import { type NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY,
});

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ inviteId: string }> },
) {
	type CandidatePart = {
		text?: string;
		inlineData?: { data?: string; mimeType?: string };
		inline_data?: { data?: string; mime_type?: string };
	};
	type Candidate = {
		content?: {
			parts?: CandidatePart[];
		};
	};

	try {
		if (!process.env.GEMINI_API_KEY) {
			return NextResponse.json(
				{ error: "Missing GEMINI_API_KEY" },
				{ status: 500 },
			);
		}

		const { inviteId } = await params;

		// Fetch invite details to personalize the postcard
		const origin =
			request.headers.get("origin") ||
			`${request.nextUrl.protocol}//${request.nextUrl.host}`;
		const inviteResponse = await fetch(
			`${origin}/api/games/invite/${inviteId}`,
			{
				headers: {
					accept: "application/json",
				},
			},
		);

		if (!inviteResponse.ok) {
			const text = await inviteResponse.text();
			console.error("Failed to fetch invite details:", {
				status: inviteResponse.status,
				text: text.slice(0, 500),
			});
			return NextResponse.json(
				{
					error: "Failed to fetch invite details",
					status: inviteResponse.status,
					body: text.slice(0, 500),
				},
				{ status: 404 },
			);
		}

		const inviteText = await inviteResponse.text();
		type InviteApiResponse = {
			data: {
				id: string;
				email: string;
				status: string;
				game: {
					name: string | null;
					priceLimit: string | null;
					deadline: string;
					author: {
						name: string;
						clerkId: string;
					};
				};
			};
		};
		let inviteData: InviteApiResponse;
		try {
			inviteData = JSON.parse(inviteText) as InviteApiResponse;
		} catch {
			console.error("Invite response not JSON:", inviteText.slice(0, 500));
			throw new Error("Invite API returned non-JSON response");
		}

		const invite = inviteData.data;

		const gameName = invite.game.name || "Secret Santa";
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
		interface GenerateContentResponse {
			candidates?: Array<{
				content?: { parts?: CandidatePart[] };
				error?: { message?: string };
			}>;
			error?: { message?: string };
			text?: string;
			image?: string;
		}

		const response = (await ai.models.generateContent({
			model: "gemini-3-pro-image-preview", // image-capable (matches combine route)
			contents: [
				{
					role: "user",
					parts: [{ text: prompt }],
				},
			],
			config: {
				responseModalities: ["IMAGE"],
			},
		})) as GenerateContentResponse;

		if (response.error) {
			throw new Error(response.error.message || "Gemini error");
		}

		// Extract image data from response (mirrors combine route)
		let imageData: string | null = null;
		let mimeType = "image/png";

		const candidates: Candidate[] = response.candidates ?? [];
		if (candidates.length > 0) {
			const parts = (candidates[0]?.content?.parts || []) as CandidatePart[];
			for (const part of parts) {
				if (part.text) {
					console.log("AI text response:", part.text);
				}
				if (part.inlineData?.data) {
					imageData = part.inlineData.data || null;
					mimeType = part.inlineData.mimeType || mimeType;
					break;
				}
				if (part.inline_data?.data) {
					const inlineData = part.inline_data;
					imageData = inlineData.data || null;
					mimeType = inlineData.mime_type || mimeType;
					break;
				}
			}
		}

		if (!imageData) {
			console.error(
				"Unexpected response structure:",
				JSON.stringify(response, null, 2),
			);
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
