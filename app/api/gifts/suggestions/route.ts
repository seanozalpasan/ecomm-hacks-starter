import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { winstonProfileData } from "@/lib/constants/winstonProfileData";
import { giftSuggestionsPrompt } from "@/lib/constants/prompts/giftSuggestions";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    console.log(
      `[${requestId}] POST /api/gifts/suggestions - Request received`,
    );

    const body = await request.json();
    const { query, userId } = body;

    console.log(`[${requestId}] Request body parsed`, {
      query: query?.substring(0, 100), // Log first 100 chars to avoid logging huge queries
      userId,
      hasQuery: !!query,
    });

    if (!query) {
      console.warn(`[${requestId}] Validation failed: Query is required`);
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // TODO: Fetch user data from database based on userId
    // For now, we'll use winstonProfileData as a placeholder
    const recipientData = winstonProfileData;

    console.log(`[${requestId}] Using recipient data`, {
      recipientName: recipientData.name,
      likesCount: recipientData.likes.length,
      dislikesCount: recipientData.dislikes.length,
    });

    // Construct the full prompt with recipient information and user query
    const fullPrompt = `${giftSuggestionsPrompt}

Recipient Information:
- Name: ${recipientData.name}
- Likes: ${recipientData.likes.join(", ")}
- Dislikes: ${recipientData.dislikes.join(", ")}
- Preferences:
  - Music: ${recipientData.preferences.music.join(", ")}
  - Books: ${recipientData.preferences.books.join(", ")}
  - Movies: ${recipientData.preferences.movies.join(", ")}
- Additional Info: ${recipientData.additionalInfo}

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

    // Generate gift suggestions using Gemini
    console.log(`[${requestId}] Calling AI API`, {
      model: "gemini-2.5-flash",
      promptLength: fullPrompt.length,
    });

    const aiStartTime = Date.now();
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });
    const aiDuration = Date.now() - aiStartTime;

    const suggestionsText = aiResponse.text || "";

    console.log(`[${requestId}] AI API response received`, {
      duration: `${aiDuration}ms`,
      responseLength: suggestionsText.length,
      hasResponse: !!suggestionsText,
    });

    // Try to parse JSON from the response
    let suggestions = [];
    try {
      // Extract JSON array from the response (handle markdown code blocks if present)
      const jsonMatch = suggestionsText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
        console.log(`[${requestId}] Successfully parsed JSON response`, {
          suggestionsCount: suggestions.length,
          hasJsonMatch: true,
        });
      } else {
        console.warn(
          `[${requestId}] No JSON array found in AI response, using fallback`,
        );
        // Fallback: return the raw text if JSON parsing fails
        suggestions = [
          {
            name: "AI Response",
            description: suggestionsText,
            category: "general",
          },
        ];
      }
    } catch (parseError) {
      console.error(`[${requestId}] Error parsing AI response:`, {
        error:
          parseError instanceof Error ? parseError.message : String(parseError),
        responsePreview: suggestionsText.substring(0, 200),
      });
      // Fallback: return the raw text
      suggestions = [
        {
          name: "AI Response",
          description: suggestionsText,
          category: "general",
        },
      ];
    }

    const response = {
      query,
      recipient: {
        name: recipientData.name,
        likes: recipientData.likes,
        dislikes: recipientData.dislikes,
        preferences: recipientData.preferences,
        additionalInfo: recipientData.additionalInfo,
      },
      suggestions,
    };

    const totalDuration = Date.now() - startTime;
    console.log(`[${requestId}] Request completed successfully`, {
      status: 200,
      suggestionsCount: suggestions.length,
      totalDuration: `${totalDuration}ms`,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[${requestId}] Error in gift suggestions route:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${totalDuration}ms`,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
