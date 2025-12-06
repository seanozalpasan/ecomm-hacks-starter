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

const DAYS_REGEX = /(\d+(?:\s*-\s*\d+)?)\s*(?:business\s*)?days?/i;
const ARRIVES_REGEX =
  /(arrives|delivery|deliver(?:y)?|delivered|arriving|expected by)[^\n]{0,20}?\b(on|by|in)\s*([A-Za-z]{3,9}\s+\d{1,2}|\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2})/i;

/**
 * Enhanced price extraction that handles multiple formats and filters out unrealistic prices
 */
function extractPriceFromText(text: string | undefined | null): PriceInfo | null {
  if (!text) return null;

  // Price patterns in order of reliability
  const pricePatterns = [
    // Standard USD format with optional cents: $29.99, $1,234.56
    { regex: /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/g, format: 'standard' },

    // Price with "USD" prefix: USD 29.99, USD29.99
    { regex: /USD\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/gi, format: 'usd_prefix' },

    // Price range - take the first (lower) price: $20-$30 or $20 - $30
    { regex: /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*-\s*\$?\s*\d+/g, format: 'range' },

    // Whole dollar amounts: $29 (but not year-like 2024)
    { regex: /\$\s*(\d{1,3}(?:,\d{3})*)\b(?!\.\d)/g, format: 'whole' },
  ];

  const foundPrices: Array<{ value: number; display: string; confidence: number; position: number }> = [];

  for (const pattern of pricePatterns) {
    const matches = Array.from(text.matchAll(pattern.regex));

    for (const match of matches) {
      if (!match[1]) continue;

      const numeric = Number(match[1].replace(/,/g, ""));

      // Validate price is realistic (between $0.01 and $99,999)
      if (Number.isNaN(numeric) || numeric < 0.01 || numeric > 99999) {
        continue;
      }

      // Calculate confidence based on pattern type and context
      let confidence = 100;
      const matchPosition = match.index || 0;
      const contextBefore = text.substring(Math.max(0, matchPosition - 30), matchPosition).toLowerCase();
      const contextAfter = text.substring(matchPosition, Math.min(text.length, matchPosition + 30)).toLowerCase();

      // Boost confidence for price-related keywords nearby
      if (/(price|cost|sale|buy|purchase|retail|msrp)/i.test(contextBefore + contextAfter)) {
        confidence += 50;
      }

      // Reduce confidence for "was" or "save" (likely old/sale price context)
      if (/(was|originally|save|off|discount|compare)/i.test(contextBefore)) {
        confidence -= 30;
      }

      // Reduce confidence if near shipping/tax keywords (not the product price)
      if (/(shipping|tax|fee|total|subtotal|handling)/i.test(contextBefore + contextAfter)) {
        confidence -= 40;
      }

      // Prefer prices at the beginning of text (more likely to be primary price)
      const normalizedPosition = matchPosition / text.length;
      if (normalizedPosition < 0.3) {
        confidence += 20;
      }

      foundPrices.push({
        value: numeric,
        display: `$${numeric.toFixed(2)}`,
        confidence,
        position: matchPosition
      });
    }
  }

  if (foundPrices.length === 0) return null;

  // Sort by confidence (highest first), then by position (earliest first)
  foundPrices.sort((a, b) => {
    if (Math.abs(a.confidence - b.confidence) > 10) {
      return b.confidence - a.confidence;
    }
    return a.position - b.position;
  });

  // Return the highest confidence price
  const bestPrice = foundPrices[0];

  console.log(`Extracted price $${bestPrice.value} with confidence ${bestPrice.confidence} from text`);

  return {
    value: bestPrice.value,
    display: bestPrice.display
  };
}

/**
 * Extracts price from structured data (JSON-LD, Schema.org Product markup)
 * This is usually the most accurate source as it's meant for machine consumption
 */
function extractStructuredPrice(html: string | undefined | null): PriceInfo | null {
  if (!html) return null;

  try {
    // Look for JSON-LD structured data
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    const jsonLdMatches = Array.from(html.matchAll(jsonLdRegex));

    for (const match of jsonLdMatches) {
      try {
        const data = JSON.parse(match[1]);

        // Handle both single objects and arrays
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          // Look for Product schema
          if (item['@type'] === 'Product' || item['@type']?.includes('Product')) {
            // Check offers.price or offers.lowPrice
            const offers = item.offers;
            if (offers) {
              const price = offers.price || offers.lowPrice;
              if (price) {
                const numeric = typeof price === 'string' ? parseFloat(price) : price;
                if (!Number.isNaN(numeric) && numeric > 0) {
                  console.log(`Found structured price from JSON-LD: $${numeric}`);
                  return { value: numeric, display: `$${numeric.toFixed(2)}` };
                }
              }
            }

            // Sometimes price is directly on the product
            if (item.price) {
              const numeric = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
              if (!Number.isNaN(numeric) && numeric > 0) {
                console.log(`Found structured price from JSON-LD product: $${numeric}`);
                return { value: numeric, display: `$${numeric.toFixed(2)}` };
              }
            }
          }
        }
      } catch (parseError) {
        // Invalid JSON, skip this block
        continue;
      }
    }

    // Look for microdata price attributes
    const microdataRegex = /itemprop=["']price["'][^>]*content=["']([^"']+)["']/gi;
    const microdataMatches = Array.from(html.matchAll(microdataRegex));

    for (const match of microdataMatches) {
      const priceStr = match[1];
      const numeric = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
      if (!Number.isNaN(numeric) && numeric > 0 && numeric < 99999) {
        console.log(`Found structured price from microdata: $${numeric}`);
        return { value: numeric, display: `$${numeric.toFixed(2)}` };
      }
    }

    // Look for data attributes commonly used for prices
    const dataAttrRegex = /data-price=["']([^"']+)["']/gi;
    const dataMatches = Array.from(html.matchAll(dataAttrRegex));

    for (const match of dataMatches) {
      const priceStr = match[1];
      const numeric = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
      if (!Number.isNaN(numeric) && numeric > 0 && numeric < 99999) {
        console.log(`Found structured price from data attribute: $${numeric}`);
        return { value: numeric, display: `$${numeric.toFixed(2)}` };
      }
    }

  } catch (error) {
    console.error("Error extracting structured price:", error);
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

/**
 * Validates if a URL is likely a product page and not an article/blog/guide
 * Returns true if URL should be EXCLUDED
 */
function isNonProductUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();

  // Positive indicators - if present, it's likely a product page
  const productIndicators = [
    /\/product[s]?\//i,
    /\/item[s]?\//i,
    /\/p\d+/i, // Product IDs like p26322
    /\/sku\//i,
    /\/buy\//i,
    /\/shop\//i,
    /\-p\d+$/i, // Ends with -p{digits}
    /\d{6,}\.html/i, // Product ID in filename
  ];

  // If URL contains strong product indicators, keep it
  if (productIndicators.some(pattern => pattern.test(lowerUrl))) {
    return false;
  }

  // Patterns that indicate non-product pages
  const excludePatterns = [
    /\/blog\//i,
    /\/article\//i,
    /\/news\//i,
    /\/post\//i,
    /\/story\//i,
    /\/guide\//i,
    /\/reviews?\//i,
    /\/how-to/i,
    /\/best-/i,
    /\/top-\d+/i,
    /\/\d+-best/i,
    /\/gift-guide/i,
    /\/gift-ideas/i,
    /\/shouts-murmurs/i,
    /\/humor/i,
    /\/opinion/i,
    /\/magazine/i,
    /\/tag\//i,
    /\/archive/i,
    /\/about/i,
    /\/contact/i,
    /\/press/i,
    /\/questions?\//i, // Q&A forums like HiNative
    /\/answers?\//i,
    /\/ask\//i,
    /\/forum\//i,
    /\/discussion\//i,
    /\/thread\//i,
    /\/community\//i,
  ];

  // Check URL path patterns
  if (excludePatterns.some(pattern => pattern.test(lowerUrl))) {
    return true;
  }

  // Check for article-like URL structures (year/month/day in path)
  if (/\/\d{4}\/\d{2}\/\d{2}\//i.test(lowerUrl)) {
    return true;
  }

  // Check for article-style sentences in URL (multiple common words with hyphens)
  // Articles often have phrases like "why-skiing-is-my-favorite-thing-ever"
  const commonArticleWords = ['why', 'how', 'what', 'when', 'where', 'the', 'is', 'my', 'your', 'best', 'top', 'favorite', 'thing', 'ever', 'always', 'never'];
  const pathParts = url.split('/');
  const lastPart = pathParts[pathParts.length - 1] || '';
  const urlWords = lastPart.toLowerCase().split('-');
  const articleWordCount = urlWords.filter(word => commonArticleWords.includes(word)).length;

  // If URL contains 3+ common article words, it's likely an article
  if (articleWordCount >= 3) {
    return true;
  }

  return false;
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

    // Try to extract structured data (JSON-LD, Schema.org) which is the most reliable
    const structuredPrice = extractStructuredPrice(html);

    // Validate page content to detect Q&A forums or non-product pages
    const pageContent = (markdown + " " + html + " " + metadata?.title || "").toLowerCase();
    const nonProductIndicators = [
      "what is the difference between",
      "answer:",
      "asked by",
      "question:",
      "view all answers",
      "best answer",
      "answered",
      "related questions",
      "similar questions",
      "upvote",
      "downvote",
    ];

    const hasNonProductIndicators = nonProductIndicators.some(indicator =>
      pageContent.includes(indicator)
    );

    if (hasNonProductIndicators) {
      console.log(`Filtered out non-product page during scrape: ${product.url}`);
      // Return null or mark for exclusion
      throw new Error("Non-product page detected");
    }

    // Extract prices from multiple sources with priority
    // Priority: 1) Structured data (JSON-LD/microdata), 2) Metadata, 3) HTML, 4) Markdown
    const priceFromMeta = extractPriceFromText(metadata?.price);
    const priceFromHtml = extractPriceFromText(html);
    const priceFromMarkdown = extractPriceFromText(markdown);

    // Prioritize structured data (most reliable), then metadata, then HTML, then markdown
    const priceInfo = structuredPrice || priceFromMeta || priceFromHtml || priceFromMarkdown;

    console.log(`Price extraction for ${product.url}:`, {
      structured: structuredPrice?.display,
      metadata: priceFromMeta?.display,
      html: priceFromHtml?.display,
      markdown: priceFromMarkdown?.display,
      selected: priceInfo?.display
    });

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
    const errorMessage = error instanceof Error ? error.message : String(error);

    // If we detected a non-product page, return null to filter it out
    if (errorMessage === "Non-product page detected") {
      console.log(`Excluding non-product page: ${product.url}`);
      // We'll handle this in the enrichment function
      throw error;
    }

    console.error("Firecrawl scrape failed", {
      url: product.url,
      error: errorMessage,
    });
    return product;
  }
}

export async function enrichProductsWithFirecrawl(
  products: ProductResult[],
  options?: { priceLimit?: number },
): Promise<ProductResult[]> {
  const maxItems = products.slice(0, 3);

  if (!firecrawlClient) {
    return options?.priceLimit
      ? maxItems.filter((product) => {
          const parsed = extractPriceFromText(product.price);
          return parsed?.value ? parsed.value <= options.priceLimit! : true;
        })
      : maxItems;
  }

  const startTime = Date.now();
  console.log(`Starting parallel scraping of ${maxItems.length} products...`);

  // Process all products in parallel using Promise.allSettled
  const scrapePromises = maxItems.map(async (product) => {
    try {
      const detailed = await scrapeProductDetails(product);

      const parsed = detailed.priceUsd ?? extractPriceFromText(detailed.price)?.value;

      // Filter out products without a price (likely uncrawlable)
      if (!parsed) {
        console.log(`Skipping product without extractable price: ${product.url}`);
        return null;
      }

      // Check price limit if specified
      if (options?.priceLimit && parsed > options.priceLimit) {
        console.log(`Skipping product over price limit ($${parsed}): ${product.url}`);
        return null;
      }

      return detailed;
    } catch (error) {
      // If non-product page detected during scraping, skip it
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage === "Non-product page detected") {
        console.log(`Skipping non-product result: ${product.url}`);
        return null;
      }
      // For other errors, skip the product (don't include uncrawlable pages)
      console.error(`Failed to scrape product ${product.url}, excluding from results:`, errorMessage);
      return null;
    }
  });

  // Wait for all scrapes to complete in parallel
  const results = await Promise.allSettled(scrapePromises);

  // Filter out failed promises and null results
  const enriched = results
    .filter((result): result is PromiseFulfilledResult<ProductResult> =>
      result.status === 'fulfilled' && result.value !== null
    )
    .map(result => result.value);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✓ Parallel scraping completed in ${duration}s: ${enriched.length} of ${maxItems.length} products successfully enriched`);

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
        numResults: 1, // Get 1 result per query bucket to limit total products
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
          "newyorker.com",
          "medium.com",
          "substack.com",
          "nytimes.com",
          "forbes.com",
          "wired.com",
          "theverge.com",
          "cnet.com",
          "techcrunch.com",
          "mashable.com",
          "buzzfeed.com",
          "huffpost.com",
          "vox.com",
          "slate.com",
          "theatlantic.com",
          "washingtonpost.com",
          "wsj.com",
          "bloomberg.com",
          "cnbc.com",
          "bbc.com",
          "cnn.com",
          "theguardian.com",
          "npr.org",
          "hinative.com",
          "stackexchange.com",
          "stackoverflow.com",
          "answers.com",
          "askmefi.com",
          "yahoo.com",
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
        // First check: Filter out non-product URLs
        if (isNonProductUrl(item.url)) {
          console.log(`Filtered out non-product URL: ${item.url}`);
          return null;
        }

        const productName =
          item.summary?.productName || item.title || "Unknown Product";

        // Filter out "Best Of" list articles and Q&A pages by title
        const lowerProductName = productName.toLowerCase();
        const isNonProduct =
          /^(top|best|\d+)\s+(best|top|\d+)/i.test(productName) ||
          lowerProductName.includes("best gifts") ||
          lowerProductName.includes("top gifts") ||
          lowerProductName.includes("gift guide") ||
          lowerProductName.includes("why ") ||
          lowerProductName.includes("how to") ||
          lowerProductName.startsWith("what is the difference") ||
          lowerProductName.startsWith("what's the difference") ||
          lowerProductName.includes("difference between") ||
          lowerProductName.includes("?") || // Questions often have ?
          /^(how|why|what|when|where|who)\s/i.test(productName);

        if (isNonProduct) {
          console.log(`Filtered out list/article/Q&A by title: ${productName}`);
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

