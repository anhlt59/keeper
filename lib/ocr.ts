/**
 * OCR extraction using OpenAI GPT-4o-mini Vision API.
 * Extracts structured invoice data from a base64-encoded image.
 */
import { prisma } from "@/lib/db";

export interface ExtractedAsset {
  name: string;
  suggestedCategory: string | null;
  quantity: number;
  unitPrice: number | null;
  warrantyMonths: number | null;
}

export interface OcrResult {
  extracted: {
    vendor: string | null;
    invoiceDate: string | null; // ISO date string
    invoiceNumber: string | null;
    totalAmount: number | null;
    currency: string | null;
    items: Array<{ description: string; quantity: number | null; unitPrice: number | null; amount: number | null }>;
    assets: ExtractedAsset[];
    categories: string[];
  };
  confidence: number;
  raw: string;
}

/**
 * Fetches active category names from DB for use in the OCR prompt.
 * Returns an empty array if DB is unreachable — the prompt falls back to the hardcoded list.
 */
export async function fetchCategoryNames(): Promise<string[]> {
  try {
    const categories = await prisma.category.findMany({
      where: { isDeleted: false },
      select: { name: true },
      orderBy: { name: "asc" },
    });
    return categories.map((c) => c.name);
  } catch {
    return [];
  }
}

export async function extractInvoiceData(
  imageBase64: string,
  categoryNames: string[] = [],
): Promise<OcrResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Please add it to your .env file to use OCR features."
    );
  }

  const categoryList = categoryNames.length > 0 ? categoryNames.join(", ") : "Other";
  const prompt = `You are an expert invoice data extraction system. Extract structured data from this invoice image.
IMPORTANT: Respond ONLY with a valid JSON object, no markdown, no explanation.
Response format:
{
  "vendor": "string or null",
  "invoiceDate": "YYYY-MM-DD or null",
  "invoiceNumber": "string or null",
  "totalAmount": number or null,
  "currency": "string or null (e.g. VND, USD)",
  "categories": ["array of distinct category names used across all assets, e.g. Electronics, IT Equipment"],
  "assets": [
    {
      "name": "short asset name derived from item description",
      "suggestedCategory": "one of: ${categoryList}",
      "quantity": number (default 1),
      "unitPrice": number or null,
      "warrantyMonths": number or null (if warranty info is visible)
    }
  ],
  "confidence": number between 0 and 1
}

Rules:
- Language: Vietnamese invoice fields are primary, but also support English
- invoiceDate: try to parse to YYYY-MM-DD format
- totalAmount: extract the final total, ignore subtotals
- currency: extract currency code if visible, default to "VND" if Vietnamese
- assets: derive from line items — each item that could be a physical or trackable asset. Use a short, clear name (e.g. "Dell Monitor 24 inch" not the full line description). Suggest a category from: ${categoryList}. Extract warranty if visible.
- confidence: rate your overall confidence based on how clearly all fields are visible
- If a field is illegible or not present, use null
- Numbers: return as actual numbers, not strings. If the number contains commas or dots as thousand separators, remove them.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: "low",
                },
              },
            ],
          },
        ],
        max_tokens: 1024,
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "";

    let parsed: OcrResult["extracted"] & { confidence?: number };
    try {
      parsed = JSON.parse(raw.trim());
    } catch {
      throw new Error("Failed to parse OCR response as JSON. The model returned invalid data.");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assets: ExtractedAsset[] = Array.isArray(parsed.assets)
      ? parsed.assets.map((a: any) => ({
          name: String(a.name ?? ""),
          suggestedCategory: a.suggestedCategory ? String(a.suggestedCategory) : null,
          quantity: typeof a.quantity === "number" ? a.quantity : 1,
          unitPrice: typeof a.unitPrice === "number" ? a.unitPrice : null,
          warrantyMonths: typeof a.warrantyMonths === "number" ? a.warrantyMonths : null,
        }))
      : [];

    // Extract and deduplicate categories from LLM response
    const categories: string[] = Array.isArray(parsed.categories)
      ? [...new Set(
          parsed.categories
            .filter((c: unknown) => typeof c === "string")
            .map(String),
        )]
      : [];

    return {
      extracted: {
        vendor: parsed.vendor ?? null,
        invoiceDate: parsed.invoiceDate ?? null,
        invoiceNumber: parsed.invoiceNumber ?? null,
        totalAmount: parsed.totalAmount ?? null,
        currency: parsed.currency ?? "VND",
        items: Array.isArray(parsed.items) ? parsed.items : [],
        assets,
        categories,
      },
      confidence: typeof parsed.confidence === "number"
        ? Math.min(1, Math.max(0, parsed.confidence))
        : 0.5,
      raw,
    };
  } catch (err) {
    clearTimeout(timeout);
    if ((err as Error).name === "AbortError") {
      throw new Error("OCR extraction timed out after 30 seconds.");
    }
    throw err;
  }
}
