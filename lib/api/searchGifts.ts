import type { GiftSearchInput } from "@/schemas/gifts";

export interface GiftSuggestion {
  searchQuery: string;
  description: string;
  category: string;
}

export interface ProductResult {
  title: string;
  price: string;
  description: string;
  url: string;
  imageUrl: string;
  sourceQuery: string;
  category: string;
}

export interface RecipientContext {
  name: string;
  likes: string[];
  dislikes: string[];
  preferences: {
    music: string[];
    books: string[];
    movies: string[];
  };
  additionalInfo: string;
}

export interface GiftSearchResponse {
  context: RecipientContext;
  suggestionBuckets: GiftSuggestion[];
  products: ProductResult[];
}

export async function searchGifts(
  input: GiftSearchInput,
): Promise<GiftSearchResponse> {
  const response = await fetch("/api/gifts/suggestions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Failed to search gifts",
    }));
    throw new Error(error.error || "Failed to search gifts");
  }

  return response.json();
}
