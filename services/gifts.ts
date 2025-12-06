import { GoogleGenAI } from "@google/genai";
import { eq } from "drizzle-orm";
import { giftSuggestionsPrompt } from "@/lib/constants/prompts/giftSuggestions";
import { winstonProfileData } from "@/lib/constants/winstonProfileData";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";

type Suggestion = {
  searchQuery: string;
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

function buildPrompt(query: string, recipient: RecipientProfile, priceLimit?: string | null) {
  const priceLimitText = priceLimit ? `\n- Price Limit: $${priceLimit}` : "";

  return `${giftSuggestionsPrompt}

Recipient Information:
- Name: ${recipient.name}
- Likes: ${recipient.likes.join(", ")}
- Dislikes: ${recipient.dislikes.join(", ")}
- Preferences:
  - Music: ${recipient.preferences.music.join(", ")}
  - Books: ${recipient.preferences.books.join(", ")}
  - Movies: ${recipient.preferences.movies.join(", ")}
- Additional Info: ${recipient.additionalInfo}${priceLimitText}

User Query: "${query}"

CRITICAL REQUIREMENT: Create a BALANCED and DIVERSE set of gift suggestions:
1. ONE suggestion should directly relate to the user's query "${query}"
2. The remaining suggestions should draw from the recipient's other interests and preferences
3. Each suggestion should be in a DIFFERENT category to provide variety
4. Aim for diversity across categories (e.g., tech, outdoors, books, fashion, hobbies, experiences)

Please provide EXACTLY 3 specific search query suggestions that balance the user's query "${query}" with the recipient's broader interests and preferences.${priceLimit ? ` All suggestions should respect the price limit of $${priceLimit}.` : ""}

IMPORTANT: The queries should be optimized for finding a specific product page, not blog posts, articles, or Q&A forums.
Bad: "Best gifts for coders"
Bad: "Why skiing is my favorite thing"
Bad: "Top 10 gifts for skiers"
Bad: "Gift guide for outdoors lovers"
Bad: "What is the difference between I love skiing and I love to ski"
Bad: "How to choose ski equipment"
Good: "Keychron K2 Mechanical Keyboard buy online"
Good: "O'Reilly Clean Code book hardcover"
Good: "Bose QuietComfort 45 headphones"
Good: "Shirts with a cat on it"
Good: "Smartwool Merino wool ski socks buy"
Good: "Good gifts for software engineers"
Good: "Burton Custom Snowboard 2024 shop"

REQUIRED: Include purchase-intent keywords like "buy", "shop", "price", "purchase", or specific brand/model names to ensure we find actual product pages, NOT articles, blog posts, or Q&A forums.

Focus on specific product names and brands when possible, while keeping the user's query "${query}" at the center of your suggestions.`;
}

export async function generateGiftSuggestions({
  query,
  userId,
  gameId,
  priceLimit,
}: {
  query: string;
  userId: string;
  gameId: string;
  priceLimit?: string | null;
}) {
  if (!query) {
    throw new Error("Query is required");
  }

  if (!gameId) {
    throw new Error("Game ID is required");
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

  const fullPrompt = buildPrompt(query, recipient, priceLimit);

  const aiResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: fullPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            searchQuery: { type: "STRING" },
            description: { type: "STRING" },
            category: { type: "STRING" },
          },
          required: ["searchQuery", "description", "category"],
        },
      },
    },
  });

  const suggestionsText = aiResponse.text || "[]";
  let suggestions: Suggestion[] = [];

  try {
    suggestions = JSON.parse(suggestionsText) as Suggestion[];
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    // Fallback to empty array or single error item
    suggestions = [
      {
        searchQuery: "Error parsing suggestions",
        description: "Please try again",
        category: "error",
      },
    ];
  }

  return {
    query,
    recipient,
    suggestions,
    raw: suggestionsText,
  };
}
