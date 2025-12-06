import Exa from "exa-js";

const exa = new Exa(process.env.EXA_API_KEY || "");

export interface ProductResult {
  title: string;
  price: string;
  description: string;
  url: string;
  imageUrl: string;
  sourceQuery: string; // To track which "bucket" this came from
  category: string; // The category from Gemini
}

interface ProductSearchOptions {
  imageLinks?: number;
}

/**
 * Searches Exa for products based on a list of specific queries.
 */
export async function findProductsFromQueries(
  queries: { searchQuery: string; category: string; description: string }[],
  options?: ProductSearchOptions,
): Promise<ProductResult[]> {
  const imageLinksRequested = options?.imageLinks ?? 3;

  // We limit concurrency to avoid hitting rate limits or timeouts
  const searchPromises = queries.map(async (q) => {
    try {
      const result = await exa.search(q.searchQuery, {
        type: "auto",
        numResults: 2, // Get top 2 results per query bucket
        excludeDomains: [
          "reddit.com",
          "quora.com",
          "pinterest.com",
          "youtube.com",
          "wikipedia.org",
          "twitter.com",
          "x.com",
          "facebook.com",
          "instagram.com",
        ],
        contents: {
          summary: {
            query: "Extract the main product details from this page.",
            schema: {
              type: "object",
              properties: {
                productName: {
                  type: "string",
                  description: "The specific name of the product",
                },
                price: {
                  type: "string",
                  description:
                    "The current price with currency symbol, e.g. $29.99",
                },
                description: {
                  type: "string",
                  description: "A brief 1-sentence description of the item",
                },
                mainImage: {
                  type: "string",
                  description: "The URL of the main product image",
                },
              },
              required: ["productName", "description"],
            },
          },
          text: {
            maxCharacters: 500,
          },
          // Request image links directly from Exa so we can show visuals in the UI
          extras: {
            imageLinks: imageLinksRequested,
          },
        },
      });

      // Map Exa results to our clean interface
      // @ts-ignore - Exa result types may vary
      return result.results.map((item: any) => {
        const productName =
          item.summary?.productName || item.title || "Unknown Product";

        // Filter out "Best Of" list articles
        const isList =
          /^(top|best|\d+)\s+(best|top|\d+)/i.test(productName) ||
          productName.toLowerCase().includes("best gifts") ||
          productName.toLowerCase().includes("top gifts");

        if (isList) {
          return null;
        }

        return {
          title: productName,
          price: item.summary?.price || "Check Price",
          description:
            item.summary?.description ||
            item.text?.substring(0, 150) ||
            q.description,
          url: item.url,
          imageUrl:
            item.summary?.mainImage ||
            item.extras?.imageLinks?.[0] ||
            item.image ||
            "",
          sourceQuery: q.searchQuery,
          category: q.category,
        };
      });
    } catch (error) {
      console.error(`Exa search failed for query: ${q.searchQuery}`, error);
      return [];
    }
  });

  const results = await Promise.all(searchPromises);
  return results.flat().filter((item): item is ProductResult => item !== null);
}
