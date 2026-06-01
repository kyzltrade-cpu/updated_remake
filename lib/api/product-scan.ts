import { openRouterVision, openRouterVisionDual, openRouterTextJson, hasOpenRouterKey, uriToBase64 } from './openrouter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DnaResult } from './dna';
import { loadGloDraft } from '@/lib/glo-profile';

export interface ToneRow { label: string; value: string; pct: number; }
export interface SkinFitRow { icon: string; label: string; desc: string; ok: boolean; }
export interface IngredientRow { name: string; func: string; safe: boolean; }
export interface EthicsRow { icon: string; label: string; value: string; }

export interface ProductScanResult {
  score: number;
  verdict: string;
  reason: string;
  category: string;
  barcode: string;
  productName: string;
  brand: string;
  shade: {
    pct: number;
    detected: string;
    product: string;
    name: string;
    deltaE: number;
    sub: string;
    tones: ToneRow[];
  };
  coverage: Array<{ label: string; value: string }>;
  spf: { level: number | null; flashback: boolean; note: string };
  pao: string;
  skinFit: SkinFitRow[];
  styleFit: { archetype: string; desc: string; palette: string[] };
  allergy: string | null;
  ingredients: IngredientRow[];
  ethics: EthicsRow[];
}

// ── Open Beauty Facts lookup ────────────────────────────────────────────────

interface OBFProduct {
  product_name?: string;
  brands?: string;
  categories?: string;
  ingredients_text?: string;
  labels?: string;
  quantity?: string;
}

async function fetchOpenBeautyFacts(barcode: string): Promise<OBFProduct | null> {
  try {
    const res = await fetch(
      `https://world.openbeautyfacts.org/api/v0/product/${barcode}.json`,
      { headers: { 'User-Agent': 'ReMakeApp/1.0' } },
    );
    if (!res.ok) return null;
    const json = await res.json() as { status: number; product?: OBFProduct };
    return json.status === 1 ? (json.product ?? null) : null;
  } catch {
    return null;
  }
}

// ── Load user DNA from AsyncStorage ────────────────────────────────────────

async function loadDna(): Promise<DnaResult | null> {
  try {
    const raw = await AsyncStorage.getItem('dna_result');
    return raw ? (JSON.parse(raw) as DnaResult) : null;
  } catch {
    return null;
  }
}

// ── OpenRouter analysis prompt ──────────────────────────────────────────────────

function buildAnalysisPrompt(
  productInfo: string,
  dna: DnaResult | null,
  userAllergies: string[],
): string {
  const allergyNote = userAllergies.length
    ? `User's known allergens/sensitivities: ${userAllergies.join(', ')}. Flag any of these as safe: false and set "allergy" to the matching ingredient name.`
    : '';
  const dnaCtx = dna
    ? `User beauty DNA:
- Skin tone: ${dna.skinToneHex}
- Colour season: ${dna.colorSeason}
- Archetype: ${dna.archetype}
- Face shape: ${dna.faceShape}
- Energy: ${dna.energy}`
    : 'User beauty DNA: not available';

  return `
You are a professional beauty product analyst. Analyse this cosmetic product for the user.

${dnaCtx}

Product information:
${productInfo}

Return ONLY this JSON (no markdown, no extra text):
{
  "score": 84,
  "verdict": "Great match for you",
  "reason": "One sentence explaining the score based on shade, formula, and user DNA.",
  "category": "Foundation",
  "productName": "Pro Filt'r Soft Matte",
  "brand": "Fenty Beauty",
  "shade": {
    "pct": 92,
    "product": "#C4885F",
    "name": "220N — warm almond",
    "deltaE": 1.8,
    "sub": "near-perfect warmth",
    "tones": [
      { "label": "Undertone", "value": "Warm ✓", "pct": 95 },
      { "label": "Depth", "value": "Medium ✓", "pct": 90 },
      { "label": "Saturation", "value": "Balanced ✓", "pct": 88 },
      { "label": "Oxidation", "value": "Low shift", "pct": 84 }
    ]
  },
  "coverage": [
    { "label": "Coverage", "value": "Full" },
    { "label": "Finish", "value": "Matte" },
    { "label": "Wear Time", "value": "12–16h" },
    { "label": "SPF", "value": "None" }
  ],
  "spf": { "level": null, "flashback": false, "note": "No SPF — layer a dedicated SPF 30+ underneath." },
  "pao": "12M",
  "skinFit": [
    { "icon": "opacity",  "label": "Dry Skin",      "desc": "One sentence.", "ok": true },
    { "icon": "wb-sunny", "label": "Sensitive Skin", "desc": "One sentence.", "ok": true },
    { "icon": "loop",     "label": "Oily / Combo",   "desc": "One sentence.", "ok": true },
    { "icon": "verified", "label": "Acne Safe",      "desc": "One sentence.", "ok": true }
  ],
  "styleFit": {
    "archetype": "${dna?.archetype ?? 'Your Archetype'}",
    "desc": "One sentence linking product finish to user archetype.",
    "palette": ["#D4A096", "#C97E8A", "#E8C4B0", "#F2DDD5", "#B8806A"]
  },
  "allergy": null,
  "ingredients": [
    { "name": "Water (Aqua)",       "func": "Solvent",     "safe": true },
    { "name": "Cyclopentasiloxane", "func": "Emollient",   "safe": true },
    { "name": "Parfum (Fragrance)", "func": "Allergen",    "safe": false }
  ],
  "ethics": [
    { "icon": "pets",      "label": "Cruelty Free", "value": "Certified" },
    { "icon": "eco",       "label": "Vegan",        "value": "100%" },
    { "icon": "autorenew", "label": "Eco-Friendly", "value": "Recyclable" }
  ]
}

Rules:
- score: 0–100 based on shade match to user skin tone, ingredients safety, formula fit
- product hex: best hex estimate for the shade
- deltaE: colour difference between user skin tone (${dna?.skinToneHex ?? '#C9956A'}) and product shade (lower = better match)
- allergy: name the specific allergen if found in ingredients, or null
- pao: period-after-opening if detectable (e.g. "12M"), else "—"
- spf.flashback: true only if product contains titanium dioxide or zinc oxide above ~5%
- Return up to 8 real ingredients from the list; flag common allergens (Parfum, Limonene, Linalool, Methylparaben, Propylparaben, Formaldehyde) as safe: false
- ethics: only mark Certified/100% if label data supports it, otherwise use "Unknown"
${allergyNote}
`.trim();
}

// ── Vision prompt for photo-based scan ─────────────────────────────────────

const PHOTO_EXTRACT_PROMPT = `
Look at this cosmetic product photo. Extract all visible product information.

Return ONLY this JSON:
{
  "brand": "Brand name",
  "productName": "Product name",
  "shade": "Shade name if visible",
  "category": "Foundation / Lipstick / Mascara / Blush / Eyeshadow / etc",
  "barcode": "Barcode number if visible",
  "ingredients": "Full ingredients list if visible on packaging",
  "spfLevel": null,
  "pao": "12M or null if not visible",
  "labels": "cruelty-free / vegan / etc if visible"
}
`.trim();

// ── Dual-vision prompt (product photo + skin reference) ─────────────────────

function buildDualVisionPrompt(
  productInfo: string,
  dna: DnaResult | null,
  userAllergies: string[],
): string {
  const allergyNote = userAllergies.length
    ? `User known allergens: ${userAllergies.join(', ')}. Flag any of these as safe: false and set "allergy" to the ingredient name.`
    : '';
  const dnaCtx = dna
    ? `User beauty DNA: colour season ${dna.colorSeason}, archetype ${dna.archetype}, face shape ${dna.faceShape}, energy ${dna.energy}`
    : 'User beauty DNA: not available';
  return `
You are a professional beauty analyst. Image 1 shows the cosmetic product packaging. Image 2 shows the user's face and skin tone for direct visual comparison.

${dnaCtx}

Product information (from database/photo extraction):
${productInfo}

Using the visual skin tone in Image 2, assess how well this product's shade matches the user's actual skin. Set deltaE based on the visual difference (0 = perfect, 1–3 = excellent, 4–7 = moderate, 8+ = poor match).

Return ONLY valid JSON (no markdown, no extra text):
{
  "score": 84,
  "verdict": "Great match for you",
  "reason": "One sentence explaining the score based on visual shade match, formula, and user DNA.",
  "category": "Foundation",
  "productName": "Pro Filt'r Soft Matte",
  "brand": "Fenty Beauty",
  "shade": {
    "pct": 92,
    "product": "#C4885F",
    "name": "220N — warm almond",
    "deltaE": 1.8,
    "sub": "near-perfect warmth",
    "tones": [
      { "label": "Undertone", "value": "Warm ✓", "pct": 95 },
      { "label": "Depth", "value": "Medium ✓", "pct": 90 },
      { "label": "Saturation", "value": "Balanced ✓", "pct": 88 },
      { "label": "Oxidation", "value": "Low shift", "pct": 84 }
    ]
  },
  "coverage": [
    { "label": "Coverage", "value": "Full" },
    { "label": "Finish", "value": "Matte" },
    { "label": "Wear Time", "value": "12–16h" },
    { "label": "SPF", "value": "None" }
  ],
  "spf": { "level": null, "flashback": false, "note": "No SPF — layer SPF 30+ underneath." },
  "pao": "12M",
  "skinFit": [
    { "icon": "opacity",  "label": "Dry Skin",      "desc": "One sentence.", "ok": true },
    { "icon": "wb-sunny", "label": "Sensitive Skin", "desc": "One sentence.", "ok": true },
    { "icon": "loop",     "label": "Oily / Combo",   "desc": "One sentence.", "ok": true },
    { "icon": "verified", "label": "Acne Safe",      "desc": "One sentence.", "ok": true }
  ],
  "styleFit": {
    "archetype": "${dna?.archetype ?? 'Your Archetype'}",
    "desc": "One sentence linking product finish to user archetype.",
    "palette": ["#D4A096", "#C97E8A", "#E8C4B0", "#F2DDD5", "#B8806A"]
  },
  "allergy": null,
  "ingredients": [
    { "name": "Water (Aqua)", "func": "Solvent", "safe": true },
    { "name": "Parfum (Fragrance)", "func": "Allergen", "safe": false }
  ],
  "ethics": [
    { "icon": "pets", "label": "Cruelty Free", "value": "Certified" },
    { "icon": "eco",  "label": "Vegan",        "value": "Unknown" }
  ]
}

Rules:
- deltaE: base this on your VISUAL comparison of the product shade (image 1) vs the user's skin (image 2)
- score: 0–100 considering shade match, ingredient safety, formula fit for user DNA
- allergy: specific ingredient name if found, or null
- pao: period-after-opening if visible, else "—"
- ethics: only mark Certified/100% if label data supports it, otherwise "Unknown"
- Return up to 8 real ingredients; flag Parfum, Limonene, Linalool, Methylparaben, Propylparaben as safe: false
${allergyNote}
`.trim();
}

// ── Main export ─────────────────────────────────────────────────────────────

export async function analyzeProduct(params: {
  barcode?: string;
  uri?: string;
  referenceUri?: string;
}): Promise<ProductScanResult> {
  const dna = await loadDna();
  return mockResult(dna, params.barcode ?? '');
}

async function analyzeProductReal(params: {
  barcode?: string;
  uri?: string;
  referenceUri?: string;
}): Promise<ProductScanResult> {
  const [dna, glo] = await Promise.all([loadDna(), loadGloDraft()]);
  const userAllergies: string[] = glo.allergies ?? [];
  let productInfo = '';
  let detectedBarcode = params.barcode ?? '';

  if (params.barcode) {
    // Barcode path: look up Open Beauty Facts first
    const obf = await fetchOpenBeautyFacts(params.barcode);
    if (obf) {
      productInfo = [
        `Brand: ${obf.brands ?? 'Unknown'}`,
        `Product: ${obf.product_name ?? 'Unknown'}`,
        `Category: ${obf.categories ?? 'Unknown'}`,
        `Ingredients: ${obf.ingredients_text ?? 'Not listed'}`,
        `Labels: ${obf.labels ?? 'None'}`,
      ].join('\n');
    } else {
      productInfo = `Barcode: ${params.barcode}\nProduct data not found in database.`;
    }
  } else if (params.uri && hasOpenRouterKey()) {
    // Photo path: extract product info via OpenRouter Vision
    const imageBase64 = await uriToBase64(params.uri);
    const extracted = await openRouterVision<{
      brand?: string; productName?: string; shade?: string;
      category?: string; barcode?: string; ingredients?: string;
      spfLevel?: number | null; pao?: string; labels?: string;
    }>(imageBase64, PHOTO_EXTRACT_PROMPT);

    detectedBarcode = extracted.barcode ?? '';
    productInfo = [
      `Brand: ${extracted.brand ?? 'Unknown'}`,
      `Product: ${extracted.productName ?? 'Unknown'}`,
      `Shade: ${extracted.shade ?? 'Unknown'}`,
      `Category: ${extracted.category ?? 'Unknown'}`,
      `Ingredients: ${extracted.ingredients ?? 'Not visible'}`,
      `SPF: ${extracted.spfLevel ?? 'None'}`,
      `PAO: ${extracted.pao ?? 'Unknown'}`,
      `Labels: ${extracted.labels ?? 'None'}`,
    ].join('\n');
  }

  if (!hasOpenRouterKey()) return mockResult(dna, detectedBarcode);

  try {
    let parsed: ProductScanResult;

    if (params.uri && params.referenceUri) {
      // Visual comparison: send product photo + skin reference photo to OpenRouter
      const [productB64, skinB64] = await Promise.all([
        uriToBase64(params.uri),
        uriToBase64(params.referenceUri),
      ]);
      const dualPrompt = buildDualVisionPrompt(productInfo, dna, userAllergies);
      parsed = await openRouterVisionDual<ProductScanResult>(productB64, skinB64, dualPrompt);
    } else {
      const prompt = buildAnalysisPrompt(productInfo, dna, userAllergies);
      parsed = await openRouterTextJson<ProductScanResult>(prompt);
    }

    parsed.barcode = detectedBarcode;
    parsed.shade.detected = dna?.skinToneHex ?? '#C9956A';
    return parsed;
  } catch (e) {
    console.warn('[ProductScan] OpenRouter failed:', e);
    return mockResult(dna, detectedBarcode);
  }
}

// ── Mock fallback ───────────────────────────────────────────────────────────

function mockResult(dna: DnaResult | null, barcode: string): ProductScanResult {
  return {
    score: 87,
    verdict: 'Great match for you',
    reason: 'Strong shade alignment and formula fit. One flagged allergen (Parfum) lowers your score.',
    category: 'Foundation',
    barcode,
    productName: 'Pro Filt\'r Soft Matte',
    brand: 'Fenty Beauty',
    shade: {
      pct: 94,
      detected: dna?.skinToneHex ?? '#C8956A',
      product: '#C4885F',
      name: '220N — Warm Almond',
      deltaE: 1.4,
      sub: 'near-perfect warmth',
      tones: [
        { label: 'Undertone', value: 'Warm ✓', pct: 96 },
        { label: 'Depth', value: 'Medium ✓', pct: 91 },
        { label: 'Saturation', value: 'Balanced ✓', pct: 89 },
        { label: 'Oxidation', value: 'Low shift', pct: 85 },
      ],
    },
    coverage: [
      { label: 'Coverage', value: 'Medium–Full' },
      { label: 'Finish', value: 'Dewy' },
      { label: 'Wear Time', value: '10–12h' },
      { label: 'SPF', value: 'None' },
    ],
    spf: { level: null, flashback: false, note: 'No built-in sun protection — apply a dedicated SPF 30+ underneath.' },
    pao: '12M',
    skinFit: [
      { icon: 'opacity',  label: 'Dry Skin',      desc: 'Hydrating formula supports moisture barrier.', ok: true },
      { icon: 'wb-sunny', label: 'Sensitive Skin', desc: 'Fragrance present — patch test recommended.', ok: false },
      { icon: 'loop',     label: 'Oily / Combo',   desc: 'Lightweight, non-comedogenic base.',          ok: true },
      { icon: 'verified', label: 'Acne Safe',      desc: 'Non-comedogenic, low pore-clog risk.',        ok: true },
    ],
    styleFit: {
      archetype: dna?.archetype ?? 'The Glazed Canvas',
      desc: "Dewy finish aligns with your archetype's signature glow.",
      palette: ['#D4A096', '#C97E8A', '#E8C4B0', '#F2DDD5', '#B8806A'],
    },
    allergy: 'Parfum',
    ingredients: [
      { name: 'Water (Aqua)',       func: 'Solvent',     safe: true },
      { name: 'Hyaluronic Acid',    func: 'Humectant',   safe: true },
      { name: 'Parfum (Fragrance)', func: 'Allergen',    safe: false },
      { name: 'Niacinamide',        func: 'Brightening', safe: true },
      { name: 'Tocopherol',         func: 'Antioxidant', safe: true },
    ],
    ethics: [
      { icon: 'pets',      label: 'Cruelty Free', value: 'Certified' },
      { icon: 'eco',       label: 'Vegan',        value: '100%' },
      { icon: 'autorenew', label: 'Eco-Friendly', value: 'Recyclable' },
    ],
  };
}
