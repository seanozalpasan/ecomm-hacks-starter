import Exa from "exa-js";
import { cleanDescription } from "./descriptionEnhancer";

const exa = new Exa(process.env.EXA_API_KEY || "");

export interface ProductResult {
  title: string;
  price: string;
  description: string;
  url: string;
  imageUrl: string;
  sourceQuery: string; // To track which "bucket" this came from
  category: string; // The category from Gemini
  priceUsd?: number;
  deliveryDate?: string;
  daysToShip?: number;
  images?: string[];
}

interface ProductSearchOptions {
  imageLinks?: number;
}

let firecrawlClient: any = null;
const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

if (firecrawlApiKey) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const FirecrawlModule = require("@mendable/firecrawl-js");
    const Firecrawl = FirecrawlModule.default || FirecrawlModule;
    firecrawlClient = new Firecrawl({ apiKey: firecrawlApiKey });
  } catch (error) {
    console.error("Firecrawl SDK not available. Install @mendable/firecrawl-js to enable scraping.", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

type ShippingInfo = {
  deliveryDate?: string;
  daysToShip?: number;
};

type PriceInfo = {
  value: number;
  display: string;
};

const USD_PRICE_REGEX = /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/;
const USD_CODE_REGEX = /USD\s*(\d+(?:\.\d{2})?)/i;
const DAYS_REGEX = /(\d+(?:\s*-\s*\d+)?)\s*(?:business\s*)?days?/i;
const ARRIVES_REGEX =
  /(arrives|delivery|deliver(?:y)?|delivered|arriving|expected by)[^\n]{0,20}?\b(on|by|in)\s*([A-Za-z]{3,9}\s+\d{1,2}|\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2})/i;

function extractPriceFromText(text: string | undefined | null): PriceInfo | null {
  if (!text) return null;

  const usdMatch = text.match(USD_PRICE_REGEX);
  if (usdMatch?.[1]) {
    const numeric = Number(usdMatch[1].replace(/,/g, ""));
    if (!Number.isNaN(numeric)) {
      return { value: numeric, display: `$${numeric.toFixed(2)}` };
    }
  }

  const codeMatch = text.match(USD_CODE_REGEX);
  if (codeMatch?.[1]) {
    const numeric = Number(codeMatch[1]);
    if (!Number.isNaN(numeric)) {
      return { value: numeric, display: `$${numeric.toFixed(2)}` };
    }
  }

  return null;
}

function extractShippingInfo(text: string | undefined | null): ShippingInfo {
  if (!text) return {};

  const daysMatch = text.match(DAYS_REGEX);
  let daysToShip: number | undefined;
  if (daysMatch?.[1]) {
    const range = daysMatch[1];
    if (range.includes("-")) {
      const [lo, hi] = range.split("-").map((n) => Number(n.trim()));
      const avg = (lo + hi) / 2;
      daysToShip = Number.isFinite(avg) ? Math.round(avg) : undefined;
    } else {
      const single = Number(range);
      daysToShip = Number.isFinite(single) ? single : undefined;
    }
  }

  const arrivalMatch = text.match(ARRIVES_REGEX);
  const deliveryDate = arrivalMatch?.[3];

  return { deliveryDate, daysToShip };
}

/**
 * Filters and scores images to identify likely product images
 * Returns images sorted by likelihood of being a product image
 */
function filterProductImages(imageUrls: string[]): string[] {
  const scored = imageUrls
    .filter(Boolean)
    .map((url) => {
      const lowerUrl = url.toLowerCase();
      let score = 0;

      // Exclude common non-product image patterns
      const excludePatterns = [
        /logo/i,
        /icon/i,
        /favicon/i,
        /sprite/i,
        /avatar/i,
        /badge/i,
        /banner/i,
        /header/i,
        /footer/i,
        /nav/i,
        /menu/i,
        /btn/i,
        /button/i,
        /arrow/i,
        /cart/i,
        /checkout/i,
        /payment/i,
        /social/i,
        /share/i,
        /flag/i,
        /currency/i,
        /placeholder/i,
        /thumb/i,
        /\d+x\d+\.(jpg|png|webp)/i, // Very small dimensions in filename
        /\b(16|20|24|32|48|64)x\1\b/i, // Common icon sizes
      ];

      // Strongly exclude if matches any pattern
      if (excludePatterns.some((pattern) => pattern.test(lowerUrl))) {
        return { url, score: -1000 };
      }

      // Positive indicators for product images
      if (
        /product/i.test(lowerUrl) ||
        /item/i.test(lowerUrl) ||
        /goods/i.test(lowerUrl) ||
        /merchandise/i.test(lowerUrl)
      ) {
        score += 100;
      }

      // CDN paths often indicate real product images
      if (/cdn/i.test(lowerUrl) && !/logo/i.test(lowerUrl)) {
        score += 50;
      }

      // Images in media/assets folders
      if (/\/(media|assets|images|photos|gallery)\//i.test(lowerUrl)) {
        score += 40;
      }

      // Prefer larger image dimensions if encoded in URL
      const dimensionMatch = lowerUrl.match(/(\d{3,4})x(\d{3,4})/);
      if (dimensionMatch) {
        const width = parseInt(dimensionMatch[1], 10);
        const height = parseInt(dimensionMatch[2], 10);
        // Prefer images that are at least 200x200 and roughly square or landscape
        if (width >= 200 && height >= 200) {
          score += 30;
          // Bonus for square-ish images (common for product photos)
          const ratio = Math.max(width, height) / Math.min(width, height);
          if (ratio < 1.5) {
            score += 20;
          }
        }
      }

      // Prefer JPEG/PNG over SVG for product images
      if (/\.(jpe?g|png|webp)$/i.test(lowerUrl)) {
        score += 20;
      }

      // SVGs are often icons/logos
      if (/\.svg$/i.test(lowerUrl)) {
        score -= 30;
      }

      // GIFs are less common for product images
      if (/\.gif$/i.test(lowerUrl)) {
        score -= 10;
      }

      // Images with 'zoom' or 'large' often indicate main product images
      if (/zoom|large|main|primary|hero/i.test(lowerUrl)) {
        score += 25;
      }

      return { url, score };
    })
    .filter((item) => item.score > -1000)
    .sort((a, b) => b.score - a.score);

  return scored.map((item) => item.url);
}

function collectImages(
  product: ProductResult,
  data: any,
  fallbackImages?: string[],
): string[] {
  const allImages: string[] = [];
  const add = (url?: string | string[]) => {
    if (!url) return;
    if (Array.isArray(url)) {
      allImages.push(...url.filter((u) => typeof u === "string"));
    } else if (typeof url === "string") {
      allImages.push(url);
    }
  };

  // Collect from all sources
  add(product.imageUrl);
  add(fallbackImages);
  add(product.images);
  add(data?.metadata?.ogImage);
  add(data?.metadata?.image);
  add(data?.metadata?.images);
  add(data?.images);
  add(data?.extras?.imageLinks);

  // Remove duplicates
  const unique = Array.from(new Set(allImages.filter(Boolean)));

  // Filter and sort by likelihood of being a product image
  return filterProductImages(unique);
}

async function scrapeProductDetails(product: ProductResult): Promise<ProductResult> {
  if (!firecrawlClient) return product;

  try {
    // Per Firecrawl docs: https://docs.firecrawl.dev/sdks/node
    // The SDK uses scrapeUrl method, and returns data nested in a data property
    const response = await firecrawlClient.scrapeUrl(product.url, {
      formats: ["markdown", "html"],
      onlyMainContent: true, // Focus on main content to avoid nav/footer noise
    });

    const scrapeResult = response?.data || response;
    const markdown: string = scrapeResult?.markdown || "";
    const html: string = scrapeResult?.html || "";

    // Extract metadata if available
    const metadata = scrapeResult?.metadata || {};

    // Try to find price in markdown first, then fallback to metadata
    const priceFromText = extractPriceFromText(markdown) || extractPriceFromText(html);
    const priceFromMeta = extractPriceFromText(metadata?.price);
    const priceInfo = priceFromText || priceFromMeta;

    const shippingInfo = extractShippingInfo(markdown + " " + html);

    // Extract image URLs from HTML content
    const htmlImageUrls: string[] = [];
    const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = imgTagRegex.exec(html)) !== null) {
      if (match[1]) {
        // Convert relative URLs to absolute
        try {
          const imgUrl = new URL(match[1], product.url).href;
          htmlImageUrls.push(imgUrl);
        } catch {
          // Invalid URL, skip
        }
      }
    }

    // Collect all available images from the scrape
    const images = collectImages(product, { metadata, images: htmlImageUrls });

    // Always overwrite with scraped data when available
    return {
      ...product,
      price: priceInfo?.display || product.price,
      priceUsd: priceInfo?.value,
      deliveryDate: shippingInfo.deliveryDate,
      daysToShip: shippingInfo.daysToShip,
      images: images.length > 0 ? images : product.images,
      imageUrl: images[0] || product.imageUrl,
    };
  } catch (error) {
    console.error("Firecrawl scrape failed", {
      url: product.url,
      error: error instanceof Error ? error.message : String(error),
    });
    return product;
  }
}

export async function enrichProductsWithFirecrawl(
  products: ProductResult[],
  options?: { priceLimit?: number },
): Promise<ProductResult[]> {
  const maxItems = products.slice(0, 6);

  if (!firecrawlClient) {
    return options?.priceLimit
      ? maxItems.filter((product) => {
          const parsed = extractPriceFromText(product.price);
          return parsed?.value ? parsed.value <= options.priceLimit! : true;
        })
      : maxItems;
  }

  const enriched: ProductResult[] = [];

  for (const product of maxItems) {
    const detailed = await scrapeProductDetails(product);

    const parsed = detailed.priceUsd ?? extractPriceFromText(detailed.price)?.value;
    if (options?.priceLimit && parsed && parsed > options.priceLimit) {
      continue;
    }

    enriched.push(detailed);
  }

  return enriched;
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

        const rawDescription =
          item.summary?.description ||
          item.text?.substring(0, 150) ||
          q.description;

        return {
          title: productName,
          price: item.summary?.price || "Check Price",
          description: cleanDescription(rawDescription),
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
