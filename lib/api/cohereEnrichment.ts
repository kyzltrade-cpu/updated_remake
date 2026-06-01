// ── Cohere AI Enrichment (Layer 3) ──────────────────────────────────────────
// Called only when critical fields are still missing after OBF + Makeup API.
// Uses the Cohere v2/chat endpoint with command-r and structured JSON output.

const COHERE_API_KEY = process.env.EXPO_PUBLIC_COHERE_API_KEY ?? '';
const COHERE_URL = 'https://api.cohere.com/v2/chat';

export function hasCohereKey(): boolean {
  return COHERE_API_KEY.length > 10;
}

export interface CohereEnrichmentResult {
  finish: string | null;
  coverage: string | null;
  wearTime: string | null;
  undertone: string | null;   // "Warm" | "Cool" | "Neutral" | "Olive" | null
  depth: string | null;       // "Fair" | "Light" | "Medium" | "Tan" | "Deep" | null
  shadeName: string | null;
  isCrueltyFree: boolean | null;
  isVegan: boolean | null;
  spfLevel: number | null;
  pao: string | null;
  oxidises: boolean | null;
  skinTypes: string[];
}

export interface CohereEnrichmentRequest {
  productName: string;
  brand: string;
  categoryTags: string[];
  labelsTags: string[];
  ingredientsText: string;
  periodsAfterOpening: string;
  quantity: string;
}

/**
 * Ask Cohere to fill in missing product data fields.
 * Returns null if no key is set or on any failure.
 */
export async function enrichProductWithCohere(
  params: CohereEnrichmentRequest,
): Promise<CohereEnrichmentResult | null> {
  if (!hasCohereKey()) return null;

  try {
    const prompt = buildCoherePrompt(params);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(COHERE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${COHERE_API_KEY}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'command-r',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!res.ok) return null;

      const data = (await res.json()) as {
        message?: {
          content?: Array<{ type?: string; text?: string }>;
        };
      };

      const text = data?.message?.content?.[0]?.text ?? '';
      if (!text) return null;

      const parsed = JSON.parse(text) as CohereEnrichmentResult;
      return sanitiseCohereResult(parsed);
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildCoherePrompt(
  params: CohereEnrichmentRequest,
): string {
  const categories = formatTags(params.categoryTags);
  const labels = formatTags(params.labelsTags);
  const ingredientsLine = params.ingredientsText.trim().length > 0
    ? params.ingredientsText.trim()
    : 'Not provided — use your knowledge of this brand and product line';

  const productLines = [
    '- Name: ' + (params.productName || 'Unknown'),
    '- Brand: ' + (params.brand || 'Unknown'),
    '- Categories: ' + (categories || 'Unknown'),
  ];

  if (labels) {
    productLines.push('- Labels: ' + labels);
  }

  productLines.push(`- Ingredients: ${ingredientsLine}`);

  if (params.periodsAfterOpening.trim().length > 0) {
    productLines.push(`- Period After Opening: ${params.periodsAfterOpening.trim()}`);
  }

  if (params.quantity.trim().length > 0) {
    productLines.push(`- Size: ${params.quantity.trim()}`);
  }

  return `You are an expert cosmetics analyst with deep knowledge of global beauty brands and product formulations.

Analyse this beauty product and fill in the details below. Use the product name, brand, category, and label information to make informed inferences — even if ingredients are not available, you likely know this product or product line from your training data.

PRODUCT INFORMATION:
${productLines.join('\n')}

INSTRUCTIONS:
- For finish, coverage, wearTime, skinTypes: make your best inference from the product name, brand, and category. Only return null if you have genuinely no basis to infer (e.g. completely unknown brand + vague product name with no category signal).
- For isCrueltyFree and isVegan: use your knowledge of this brand's public certifications and policies as of your training data. Return null only if the brand is completely unknown to you.
- For undertone, depth, shadeName: only relevant for foundation/concealer/powder products. Return null for skincare, mascara, lipstick, blush, eyeshadow.
- For spfLevel: extract from product name if present (e.g. "SPF 20" → 20, "20 SPF" → 20), otherwise infer from category if typical (e.g. day creams sometimes have SPF).
- For pao: use the periods_after_opening value if provided, converted to months format (e.g. "12 mois" → "12M", "6 months" → "6M").
- For oxidises: only relevant for foundations. Return null for everything else.
- Never fabricate specific ingredient names. The ingredients field in your response should always be null — ingredient safety is handled separately.

Return ONLY a valid JSON object with no markdown, no preamble, no explanation:
{
  "finish": "Matte" | "Dewy" | "Satin" | "Shimmer" | "Gloss" | null,
  "coverage": "Sheer" | "Light" | "Medium" | "Full" | null,
  "wearTime": string like "8h" or "12–16h" or null,
  "undertone": "Warm" | "Cool" | "Neutral" | "Olive" | null,
  "depth": "Fair" | "Light" | "Medium" | "Tan" | "Deep" | null,
  "shadeName": string or null,
  "isCrueltyFree": true | false | null,
  "isVegan": true | false | null,
  "spfLevel": number or null,
  "pao": string like "12M" or "6M" or null,
  "oxidises": true | false | null,
  "skinTypes": array of zero or more from ["Dry", "Oily", "Combination", "Sensitive", "Normal"] that this product is suitable for — use label tags and product name as signal (e.g. "hypoallergenic" → include "Sensitive")
}`;
}

function formatTags(tags: string[]): string {
  return tags
    .map(tag => tag.replace(/^en:/, '').replace(/-/g, ' ').trim())
    .filter(Boolean)
    .join(', ');
}

const VALID_FINISHES = new Set(['Matte', 'Dewy', 'Satin', 'Shimmer', 'Gloss']);
const VALID_COVERAGES = new Set(['Sheer', 'Light', 'Medium', 'Full']);
const VALID_UNDERTONES = new Set(['Warm', 'Cool', 'Neutral', 'Olive']);
const VALID_DEPTHS = new Set(['Fair', 'Light', 'Medium', 'Tan', 'Deep']);
const VALID_SKIN_TYPES = new Set(['Dry', 'Oily', 'Combination', 'Sensitive', 'Normal']);

function sanitiseCohereResult(raw: CohereEnrichmentResult): CohereEnrichmentResult {
  return {
    finish: VALID_FINISHES.has(raw.finish as string) ? raw.finish : null,
    coverage: VALID_COVERAGES.has(raw.coverage as string) ? raw.coverage : null,
    wearTime: typeof raw.wearTime === 'string' ? raw.wearTime : null,
    undertone: VALID_UNDERTONES.has(raw.undertone as string) ? raw.undertone : null,
    depth: VALID_DEPTHS.has(raw.depth as string) ? raw.depth : null,
    shadeName: typeof raw.shadeName === 'string' ? raw.shadeName : null,
    isCrueltyFree: typeof raw.isCrueltyFree === 'boolean' ? raw.isCrueltyFree : null,
    isVegan: typeof raw.isVegan === 'boolean' ? raw.isVegan : null,
    spfLevel: typeof raw.spfLevel === 'number' ? raw.spfLevel : null,
    pao: typeof raw.pao === 'string' ? raw.pao : null,
    oxidises: typeof raw.oxidises === 'boolean' ? raw.oxidises : null,
    skinTypes: Array.isArray(raw.skinTypes)
      ? raw.skinTypes.filter((skinType): skinType is string => (
        typeof skinType === 'string' && VALID_SKIN_TYPES.has(skinType)
      ))
      : [],
  };
}
