// ── Makeup API Lookup (Layer 2) ─────────────────────────────────────────────
// Free, no-auth REST API at http://makeup-api.herokuapp.com
// Queried by brand + fuzzy product-name match.

export interface MakeupAPIProduct {
  id: number;
  brand: string;
  name: string;
  price: string;
  product_type: string;
  tag_list: string[];
  description: string;
}

interface MakeupAPIExtraction {
  finish: string | null;
  coverage: string | null;
  isVegan: boolean;
  isCrueltyFree: boolean;
}

// ── Lookup ──────────────────────────────────────────────────────────────────

/**
 * Query the Makeup API by brand and find the best product-name match.
 * Returns null on no match, network error, or empty result.
 */
export async function lookupMakeupAPI(
  brand: string,
  productName: string,
): Promise<MakeupAPIProduct | null> {
  try {
    const normalisedBrand = brand
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/['']/g, '');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    try {
      const url = `http://makeup-api.herokuapp.com/api/v1/products.json?brand=${encodeURIComponent(normalisedBrand)}`;
      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) return null;

      const products = (await res.json()) as MakeupAPIProduct[];
      if (!Array.isArray(products) || products.length === 0) return null;

      return findBestMatch(productName, products);
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

// ── Fuzzy matching ──────────────────────────────────────────────────────────

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
}

function findBestMatch(
  queryName: string,
  products: MakeupAPIProduct[],
): MakeupAPIProduct | null {
  const queryWords = tokenise(queryName);
  if (queryWords.length === 0) return null;

  let bestProduct: MakeupAPIProduct | null = null;
  let bestScore = 0;

  for (const product of products) {
    if (!product.name) continue;
    const candidateWords = new Set(tokenise(product.name));
    let overlap = 0;
    for (const word of queryWords) {
      if (candidateWords.has(word)) overlap++;
    }
    if (overlap > bestScore) {
      bestScore = overlap;
      bestProduct = product;
    }
  }

  // Require at least 2 word matches to consider it a real match
  return bestScore >= 2 ? bestProduct : null;
}

// ── Extraction ──────────────────────────────────────────────────────────────

/**
 * Extract structured fields from a MakeupAPIProduct's tag_list and description.
 */
export function extractFromMakeupAPI(product: MakeupAPIProduct): MakeupAPIExtraction {
  const tags = (product.tag_list ?? []).map(t => t.toLowerCase());
  const desc = (product.description ?? '').toLowerCase();
  const combined = [...tags, desc].join(' ');
  const productType = (product.product_type ?? '').toLowerCase();

  return {
    finish: detectFinishFromMakeup(combined, productType),
    coverage: detectCoverageFromMakeup(combined),
    isVegan: tags.some(t => t.includes('vegan')),
    isCrueltyFree: tags.some(
      t =>
        t.includes('cruelty free') ||
        t.includes('cruelty-free') ||
        t.includes('certclean'),
    ),
  };
}

function detectFinishFromMakeup(
  combined: string,
  productType: string,
): string | null {
  if (combined.includes('matte')) return 'Matte';
  if (
    combined.includes('dewy') ||
    combined.includes('glow') ||
    combined.includes('luminous')
  )
    return 'Dewy';
  if (combined.includes('satin') || combined.includes('natural')) return 'Satin';
  if (combined.includes('shimmer') || combined.includes('glitter'))
    return 'Shimmer';

  // lip_gloss implies dewy/glossy finish
  if (productType === 'lip_gloss') return 'Dewy';

  return null;
}

function detectCoverageFromMakeup(combined: string): string | null {
  if (combined.includes('full coverage') || /\bfull\b/.test(combined))
    return 'Full';
  if (combined.includes('medium coverage') || /\bmedium\b/.test(combined))
    return 'Medium';
  if (
    combined.includes('light coverage') ||
    combined.includes('sheer') ||
    /\blight\b/.test(combined)
  )
    return 'Light';
  return null;
}
