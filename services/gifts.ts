import { GoogleGenAI } from "@google/genai";
import { eq } from "drizzle-orm";
import { giftSuggestionsPrompt } from "@/lib/constants/prompts/giftSuggestions";
import { winstonProfileData } from "@/lib/constants/winstonProfileData";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

type Suggestion = {
	name: string;
	description: string;
	category: string;
};

type RecipientProfile = {
	name: string;
	likes: string[];
	dislikes: string[];
	preferences: {
		music: string[];
		books: string[];
		movies: string[];
	};
	additionalInfo: string;
};

const ai = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY,
});

function buildPrompt(query: string, recipient: RecipientProfile) {
	return `${giftSuggestionsPrompt}

Recipient Information:
- Name: ${recipient.name}
- Likes: ${recipient.likes.join(", ")}
- Dislikes: ${recipient.dislikes.join(", ")}
- Preferences:
  - Music: ${recipient.preferences.music.join(", ")}
  - Books: ${recipient.preferences.books.join(", ")}
  - Movies: ${recipient.preferences.movies.join(", ")}
- Additional Info: ${recipient.additionalInfo}

User Query: ${query}

Please provide 3-5 specific gift suggestions that match the recipient's interests and preferences. Format your response as a JSON array of objects, where each object has:
- name: the gift name
- description: a brief description of why this gift is suitable
- category: the category (e.g., "books", "electronics", "experiences", etc.)

Example format:
[
  {
    "name": "Gift Name",
    "description": "Why this gift is perfect",
    "category": "category"
  }
]`;
}

function parseSuggestions(raw: string): Suggestion[] {
	const jsonMatch = raw.match(/\[[\s\S]*\]/);
	if (!jsonMatch) {
		return [
			{
				name: "AI Response",
				description: raw,
				category: "general",
			},
		];
	}

	try {
		return JSON.parse(jsonMatch[0]) as Suggestion[];
	} catch {
		return [
			{
				name: "AI Response",
				description: raw,
				category: "general",
			},
		];
	}
}

export async function generateGiftSuggestions({
	query,
	userId,
}: {
	query: string;
	userId: string;
}) {
	if (!query) {
		throw new Error("Query is required");
	}

	// Prefer real user data when available; fall back to placeholder profile.
	const [user] = userId
		? await db.select().from(users).where(eq(users.clerkID, userId)).limit(1)
		: [];

	const recipient: RecipientProfile = user
		? {
				name: user.name,
				likes: user.giftPreferences?.filter(Boolean) ?? [],
				dislikes: [],
				preferences: {
					music: [],
					books: [],
					movies: [],
				},
				additionalInfo: `Location: ${user.location}`,
			}
		: winstonProfileData;

	const fullPrompt = buildPrompt(query, recipient);

	const aiResponse = await ai.models.generateContent({
		model: "gemini-2.5-flash",
		contents: fullPrompt,
	});

	const suggestionsText = aiResponse.text || "";
	const suggestions = parseSuggestions(suggestionsText);

	return {
		query,
		recipient,
		suggestions,
		raw: suggestionsText,
	};
}
