import type { GiftSearchInput } from "@/schemas/gifts";

export interface GiftSuggestion {
  searchQuery: string;
  description: string;
  category: string;
}

export interface GiftSearchResponse {
  giftSuggestions: GiftSuggestion[];
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
