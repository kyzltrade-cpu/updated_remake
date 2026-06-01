import type { DnaResult } from './dna';
import type {
  ProductScanResult,
  ToneRow,
  SkinFitRow,
  IngredientRow,
  EthicsRow,
} from './product-scan';

import ingredientsDb from '@/assets/data/ingredients_db.json';
import fitRulesData from '@/assets/data/fit_rules.json';
import brandFormulas from '@/assets/data/brand_formulas.json';

import { lookupMakeupAPI, extractFromMakeupAPI } from './makeupApiLookup';
import {
  hasCohereKey,
  enrichProductWithCohere,
  type CohereEnrichmentRequest,
} from './cohereEnrichment';
import {
  parseShadeFromName,
  deriveShadeHex,
  calculateDeltaE,
  deltaEToMatchPct,
  buildToneRows,
} from './shadeParser';
import { buildSkinFitRows } from './skinCompatibility';
import { buildEthicsRows } from './ethicsChecker';

// ── Types for the static data ───────────────────────────────────────────────

interface IngredientEntry {
  name: string;
  aliases: string[];
  func: string;
  allergen_flags: string[];
  safe_default: boolean;
  notes: string;
}

interface FitRuleEntry {
  score: number;
  reason: string;
}

type FitRulesMap = Record<string, Record<string, FitRuleEntry>>;

// ── Types for the OBF product data ──────────────────────────────────────────

interface OBFProduct {
  product_name?: string;
  brands?: string;
  categories?: string;
  categories_tags?: string[];
  ingredients_text?: string;
  labels?: string;
  labels_tags?: string[];
  quantity?: string;
  periods_after_opening?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const DB: IngredientEntry[] = ingredientsDb as IngredientEntry[];
const FIT_RULES: FitRulesMap = fitRulesData as FitRulesMap;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Normalise a raw ingredient token for lookup. */
function normalise(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[()]/g, '')
    .trim();
}

/** Parse the product category from OBF categories string. */
function parseCategory(categories: string | undefined): string {
  if (!categories) return 'Beauty Product';
  const c = categories.toLowerCase();
  if (c.includes('foundation'))                     return 'Foundation';
  if (c.includes('concealer'))                      return 'Concealer';
  if (c.includes('lipstick') || c.includes('lip colour')) return 'Lipstick';
  if (c.includes('lip gloss') || c.includes('gloss'))     return 'Lip Gloss';
  if (c.includes('blush') || c.includes('blusher'))       return 'Blush';
  if (c.includes('eyeshadow') || c.includes('eye shadow')) return 'Eyeshadow';
  if (c.includes('mascara'))                        return 'Mascara';
  if (c.includes('moisturis') || c.includes('serum') || c.includes('toner') || c.includes('sunscreen') || c.includes('spf'))
    return 'Skincare';
  return 'Beauty Product';
}


/** Detect finish from product name + ingredients text. */
function detectFinish(productName: string | undefined, ingredientsText: string | undefined): string {
  const combined = `${productName ?? ''} ${ingredientsText ?? ''}`.toLowerCase();
  if (combined.includes('matte') || combined.includes('mat '))       return 'matte';
  if (combined.includes('dewy') || combined.includes('glow') || combined.includes('radiant') || combined.includes('luminous'))
    return 'dewy';
  if (combined.includes('satin'))                                     return 'satin';
  if (combined.includes('shimmer') || combined.includes('glitter'))   return 'shimmer';
  if (combined.includes('natural'))                                   return 'satin'; // natural ≈ satin
  return 'unknown';
}

/** Detect coverage from product name. */
function detectCoverage(productName: string | undefined): string {
  if (!productName) return '—';
  const lower = productName.toLowerCase();
  if (lower.includes('full'))                           return 'Full';
  if (lower.includes('medium'))                         return 'Medium';
  if (lower.includes('light') || lower.includes('sheer')) return 'Light';
  if (lower.includes('buildable'))                      return 'Buildable';
  return '—';
}

/** Extract SPF level from text. */
function extractSpf(text: string | undefined): number | null {
  if (!text) return null;
  const match = text.match(/(?:SPF\s*(\d+)|(\d+)\s*SPF)/i);
  return match ? parseInt(match[1] ?? match[2], 10) : null;
}

/** Parse OBF PAO values into canonical months format (e.g. "12M"). */
function parsePaoToMonths(rawPao: string | undefined): string | null {
  const value = (rawPao ?? '').trim();
  if (!value) return null;

  const normalised = value.toLowerCase();
  const match = normalised.match(/(\d{1,2})\s*(m|mois|month|months)?/i);
  if (!match) return null;

  const months = Number.parseInt(match[1], 10);
  return Number.isFinite(months) ? `${months}M` : null;
}

/** Check if ingredients contain flashback-causing agents. */
function checkFlashback(ingredientsText: string | undefined): boolean {
  if (!ingredientsText) return false;
  const lower = ingredientsText.toLowerCase();
  return lower.includes('titanium dioxide') || lower.includes('ci 77891') ||
         lower.includes('zinc oxide');
}

/** Parse and match ingredients against the database. */
function processIngredients(
  ingredientsText: string | undefined,
  userAllergies: string[],
): { rows: IngredientRow[]; allergyFlag: string | null } {
  if (!ingredientsText || ingredientsText.trim().length === 0) {
    return { rows: [], allergyFlag: null };
  }

  const rawList = ingredientsText
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const rows: IngredientRow[] = [];
  let allergyFlag: string | null = null;

  const userAllergySet = new Set(userAllergies.map(a => a.toLowerCase()));

  for (const rawName of rawList) {
    if (rows.length >= 10) break;

    const normalised = normalise(rawName);
    const entry = DB.find(e =>
      e.aliases.some(alias => normalised.includes(alias) || alias.includes(normalised)),
    );

    if (entry) {
      // Check if this ingredient flags any of the user's allergens
      const isUserAllergen = entry.allergen_flags.some(flag =>
        userAllergySet.has(flag.toLowerCase()),
      );
      const safe = !isUserAllergen;
      if (!safe && !allergyFlag) {
        allergyFlag = entry.name;
      }
      rows.push({ name: entry.name, func: entry.func, safe });
    } else {
      // Unknown ingredient — assume safe
      // Capitalize first letter of the raw name for display
      const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1).trim();
      rows.push({ name: displayName, func: 'Ingredient', safe: true });
    }
  }

  return { rows, allergyFlag };
}

/** Parse ethics labels from OBF labels field. */
function parseEthics(labels: string | undefined): EthicsRow[] {
  const lower = (labels ?? '').toLowerCase();

  const crueltyFree = lower.includes('cruelty-free') || lower.includes('cruelty free') || lower.includes('leaping bunny')
    ? 'Certified' : 'Unknown';
  const vegan = lower.includes('vegan') ? '100%' : 'Unknown';
  const eco = lower.includes('organic') || lower.includes('eco') || lower.includes('recyclable')
    ? 'Certified' : 'Unknown';

  return [
    { icon: 'pets',      label: 'Cruelty Free', value: crueltyFree },
    { icon: 'eco',       label: 'Vegan',        value: vegan },
    { icon: 'autorenew', label: 'Eco-Friendly', value: eco },
  ];
}

/** Build skin compatibility rows based on user skin type and product data. */
function buildSkinFit(
  skinType: string | undefined,
  hasFragrance: boolean,
  finish: string,
): SkinFitRow[] {
  const st = (skinType ?? '').toLowerCase();

  const drySkinOk = finish === 'dewy' || finish === 'satin';
  const oilySkinOk = finish === 'matte' || finish === 'satin';

  return [
    {
      icon: 'opacity',
      label: 'Dry Skin',
      desc: drySkinOk
        ? 'Hydrating formula supports moisture barrier.'
        : 'May feel drying — pair with a moisturiser underneath.',
      ok: st === 'dry' ? drySkinOk : true,
    },
    {
      icon: 'wb-sunny',
      label: 'Sensitive Skin',
      desc: hasFragrance
        ? 'Fragrance present — patch test recommended.'
        : 'No known irritants detected in formula.',
      ok: !hasFragrance,
    },
    {
      icon: 'loop',
      label: 'Oily / Combo',
      desc: oilySkinOk
        ? 'Lightweight, non-comedogenic base controls shine.'
        : 'May add extra glow — blot T-zone as needed.',
      ok: st === 'oily' || st === 'combination' ? oilySkinOk : true,
    },
    {
      icon: 'verified',
      label: 'Acne Safe',
      desc: hasFragrance
        ? 'Fragrance may aggravate breakout-prone skin.'
        : 'Non-comedogenic, low pore-clog risk.',
      ok: !hasFragrance,
    },
  ];
}

interface BrandFormula {
  finish: string;
  coverage: string;
  wearTime: string;
  oxidises: boolean;
}

function findBrandFormula(brand: string, productName: string): BrandFormula | null {
  const normBrand = brand.toLowerCase().replace(/['’]/g, '').trim();
  const db = brandFormulas as Record<string, Record<string, BrandFormula>>;
  
  // Find brand key
  const brandKey = Object.keys(db).find(k => {
    const normK = k.replace(/['’]/g, '');
    return normBrand.includes(normK) || normK.includes(normBrand);
  });
  
  if (!brandKey) return null;
  
  const productLines = db[brandKey];
  const normProduct = productName.toLowerCase();
  
  // Find product line
  const bestLine = Object.keys(productLines).find(line => {
    return normProduct.includes(line);
  });
  
  return bestLine ? productLines[bestLine] : null;
}

// ── Main export ─────────────────────────────────────────────────────────────

export async function buildFreeResult(
  obfProduct: OBFProduct | null,
  barcode: string,
  dna: DnaResult | null,
  userAllergies: string[],
  userSkinType: string,
): Promise<ProductScanResult> {
  try {
    const productNotFound = obfProduct === null;

    // ── Basic fields ──────────────────────────────────────────────────
    const productName = obfProduct?.product_name?.trim() || 'Unknown Product';
    const brand = obfProduct?.brands?.trim() || 'Unknown Brand';
    const category = parseCategory(obfProduct?.categories);
    const categoryKey = category.toLowerCase() as string;

    // ── Layer 2: Makeup API Lookup ───────────────────────────────────
    let makeupApiPromise = Promise.resolve<any>(null);
    if (obfProduct && brand !== 'Unknown Brand') {
      makeupApiPromise = lookupMakeupAPI(brand, productName)
        .then(res => {
          if (res) {
            return {
              raw: res,
              extracted: extractFromMakeupAPI(res),
            };
          }
          return null;
        })
        .catch(() => null);
    }

    // Parallel shade parsing (pure TypeScript, zero APIs)
    const localShade = parseShadeFromName(productName);

    // Wait for Layer 2 lookup
    const makeupData = await makeupApiPromise;

    // Query static database (Step 8)
    const formulaData = findBrandFormula(brand, productName);

    // ── Layer 3: Cohere AI Enrichment (Conditional) ──────────────────
    const finishAfterLayer1And2 =
      formulaData?.finish ||
      makeupData?.extracted?.finish;
    const coverageAfterLayer1And2 =
      formulaData?.coverage ||
      makeupData?.extracted?.coverage;

    const labelsCombined = `${obfProduct?.labels ?? ''} ${(obfProduct?.labels_tags ?? []).join(' ')}`.toLowerCase();
    const crueltyFreeFromObf =
      labelsCombined.includes('cruelty-free') ||
      labelsCombined.includes('cruelty free') ||
      labelsCombined.includes('leaping bunny') ||
      labelsCombined.includes('peta certified');
    const crueltyFromMakeupApi = makeupData?.extracted?.isCrueltyFree;
    const isCrueltyKnown = crueltyFreeFromObf || typeof crueltyFromMakeupApi === 'boolean';
    const ingredientsLength = (obfProduct?.ingredients_text ?? '').trim().length;

    const needsCohere =
      !finishAfterLayer1And2 ||
      !coverageAfterLayer1And2 ||
      !isCrueltyKnown ||
      ingredientsLength < 20;

    let cohereData: any = null;
    const cohereRequest: CohereEnrichmentRequest = {
      productName: obfProduct?.product_name ?? '',
      brand: obfProduct?.brands ?? '',
      categoryTags: obfProduct?.categories_tags ?? [],
      labelsTags: obfProduct?.labels_tags ?? [],
      ingredientsText: obfProduct?.ingredients_text ?? '',
      periodsAfterOpening: obfProduct?.periods_after_opening ?? '',
      quantity: obfProduct?.quantity ?? '',
    };

    if (needsCohere && hasCohereKey() && obfProduct) {
      cohereData = await enrichProductWithCohere(cohereRequest);
    }

    // ── Merge Data via Priority Chains ───────────────────────────────
    const finishVal =
      formulaData?.finish ||
      makeupData?.extracted?.finish ||
      cohereData?.finish ||
      (detectFinish(productName, obfProduct?.ingredients_text) !== 'unknown'
        ? detectFinish(productName, obfProduct?.ingredients_text).charAt(0).toUpperCase() +
          detectFinish(productName, obfProduct?.ingredients_text).slice(1)
        : null) ||
      '—';

    const coverageVal =
      formulaData?.coverage ||
      makeupData?.extracted?.coverage ||
      cohereData?.coverage ||
      (detectCoverage(productName) !== '—' ? detectCoverage(productName) : null) ||
      '—';

    const wearTimeVal = formulaData?.wearTime || cohereData?.wearTime || '—';

    const spfVal =
      cohereData?.spfLevel ??
      extractSpf(productName) ??
      extractSpf(obfProduct?.ingredients_text) ??
      null;

    const paoDirect = parsePaoToMonths(obfProduct?.periods_after_opening);
    const paoVal =
      paoDirect ||
      cohereData?.pao ||
      '—';

    const oxidisesVal = formulaData?.oxidises ?? cohereData?.oxidises ?? false;

    // ── Shade ─────────────────────────────────────────────────────────
    const detectedHex = dna?.skinToneHex ?? '#C9956A';
    const shadeNameVal = localShade.shadeName || cohereData?.shadeName || 'Shade not detected';
    const undertoneVal = localShade.undertone || cohereData?.undertone || null;
    const depthVal = localShade.depth || cohereData?.depth || null;

    const productHex = deriveShadeHex(undertoneVal, depthVal);
    const deltaEVal = undertoneVal && depthVal ? calculateDeltaE(detectedHex, productHex) : 0;
    const pctVal = undertoneVal && depthVal ? deltaEToMatchPct(deltaEVal) : 75;

    let shadeSub = 'Shade data unavailable — scan with photo for full analysis';
    if (undertoneVal && depthVal) {
      if (pctVal >= 90) {
        shadeSub = 'Perfect match for your skin tone!';
      } else if (pctVal >= 75) {
        shadeSub = 'Good match — check undertone.';
      } else {
        shadeSub = 'Tone mismatch — might look too light/dark or ash/orange.';
      }
    }

    const shade = {
      pct: pctVal,
      detected: detectedHex,
      product: productHex,
      name: shadeNameVal,
      deltaE: deltaEVal,
      sub: shadeSub,
      tones: buildToneRows(undertoneVal, depthVal, dna, oxidisesVal),
    };

    // ── Ingredients ───────────────────────────────────────────────────
    const { rows: ingredients, allergyFlag } = processIngredients(
      obfProduct?.ingredients_text,
      userAllergies,
    );

    const allergy = allergyFlag;

    // ── Coverage ──────────────────────────────────────────────────────
    const coverage: Array<{ label: string; value: string }> = [
      { label: 'Coverage', value: coverageVal },
      { label: 'Finish', value: finishVal },
      { label: 'Wear Time', value: wearTimeVal },
      { label: 'SPF', value: spfVal ? `SPF ${spfVal}` : 'None' },
    ];

    // ── SPF ───────────────────────────────────────────────────────────
    const flashback = checkFlashback(obfProduct?.ingredients_text);
    const spfNote = spfVal
      ? spfVal >= 30
        ? `SPF ${spfVal} provides solid daily protection.`
        : `SPF ${spfVal} — consider layering a dedicated SPF 30+ for full protection.`
      : 'No built-in sun protection — apply a dedicated SPF 30+ underneath.';

    const spf = { level: spfVal, flashback, note: spfNote };

    // ── PAO ───────────────────────────────────────────────────────────
    const pao = paoVal;

    // ── Skin Fit ──────────────────────────────────────────────────────
    const skinFit = buildSkinFitRows(
      obfProduct?.ingredients_text ?? '',
      userAllergies,
      userSkinType,
      cohereData?.skinTypes ?? [],
    );

    // ── Style Fit ─────────────────────────────────────────────────────
    const archetype = dna?.archetype ?? 'Your Style';
    const styleFinish = finishVal === '—' ? 'unknown' : finishVal.toLowerCase();
    const fitFinishRules = FIT_RULES[styleFinish] ?? FIT_RULES['unknown'];
    const fitEntry: FitRuleEntry | undefined =
      fitFinishRules?.[categoryKey] ?? fitFinishRules?.['other'];
    const styleDesc = fitEntry?.reason ?? 'This product complements your personal style.';

    const styleFit = {
      archetype,
      desc: styleDesc,
      palette: ['#D4A096', '#C97E8A', '#E8C4B0', '#F2DDD5', '#B8806A'],
    };

    // ── Ethics ────────────────────────────────────────────────────────
    const ethics = buildEthicsRows(
      obfProduct?.labels ?? '',
      brand,
      makeupData?.extracted ?? null,
      cohereData,
    );

    // ── Score & Verdict Calculation (40% shade + 40% safety + 20% ethics)
    const safetyScore = allergy ? 0 : (skinFit.filter(r => r.ok).length / 4) * 100;

    let cfScore = 50;
    if (ethics[0].value === 'Certified') cfScore = 100;
    else if (ethics[0].value === 'Not Certified') cfScore = 0;

    let vScore = 50;
    if (ethics[1].value === '100%') vScore = 100;

    let eScore = 50;
    if (ethics[2].value === 'Certified') eScore = 100;

    const ethicsScore = (cfScore + vScore + eScore) / 3;

    let score = Math.round(pctVal * 0.4 + safetyScore * 0.4 + ethicsScore * 0.2);
    if (productNotFound) {
      score = 50;
    }
    if (allergy) {
      score = Math.max(0, score - 30);
    }
    score = clamp(score, 0, 100);

    let verdict: string;
    if (score >= 85) verdict = 'Great match for you';
    else if (score >= 70) verdict = 'Looks good for you';
    else if (score >= 55) verdict = 'Some considerations';
    else verdict = 'Check before buying';

    let reason: string;
    if (productNotFound) {
      reason = 'Product not found in our database — limited analysis available.';
    } else if (allergy) {
      reason = `Contains ${allergy} which is on your sensitivity list.`;
    } else {
      const badSkin = skinFit.find(r => !r.ok);
      if (badSkin) {
        reason = `Formula looks decent, but check compatibility for ${badSkin.label}.`;
      } else {
        reason = 'No allergens detected and formula is highly compatible with your skin type.';
      }
    }

    // ── Assemble ──────────────────────────────────────────────────────
    return {
      score,
      verdict,
      reason,
      category,
      barcode,
      productName,
      brand,
      shade,
      coverage,
      spf,
      pao,
      skinFit,
      styleFit,
      allergy,
      ingredients,
      ethics,
    };
  } catch (err) {
    console.warn('[FreeProductAnalysis] Error building result:', err);
    // Safe fallback that will always render correctly
    return safeFallback(barcode, dna);
  }
}

// ── Emergency fallback ──────────────────────────────────────────────────────

function safeFallback(barcode: string, dna: DnaResult | null): ProductScanResult {
  return {
    score: 50,
    verdict: 'Limited data available',
    reason: 'We could not fully analyse this product — try scanning with a clearer barcode.',
    category: 'Beauty Product',
    barcode,
    productName: 'Unknown Product',
    brand: 'Unknown Brand',
    shade: {
      pct: 0,
      detected: dna?.skinToneHex ?? '#C9956A',
      product: '#C9956A',
      name: 'Shade not detected',
      deltaE: 0,
      sub: 'Shade data unavailable',
      tones: [
        { label: 'Undertone',  value: '—', pct: 0 },
        { label: 'Depth',      value: '—', pct: 0 },
        { label: 'Saturation', value: '—', pct: 0 },
        { label: 'Oxidation',  value: '—', pct: 0 },
      ],
    },
    coverage: [
      { label: 'Coverage',  value: '—' },
      { label: 'Finish',    value: '—' },
      { label: 'Wear Time', value: '—' },
      { label: 'SPF',       value: 'None' },
    ],
    spf: { level: null, flashback: false, note: 'No SPF data available.' },
    pao: '—',
    skinFit: [
      { icon: 'opacity',  label: 'Dry Skin',      desc: 'Insufficient data for assessment.', ok: true },
      { icon: 'wb-sunny', label: 'Sensitive Skin', desc: 'Insufficient data for assessment.', ok: true },
      { icon: 'loop',     label: 'Oily / Combo',   desc: 'Insufficient data for assessment.', ok: true },
      { icon: 'verified', label: 'Acne Safe',      desc: 'Insufficient data for assessment.', ok: true },
    ],
    styleFit: {
      archetype: dna?.archetype ?? 'Your Style',
      desc: 'Scan a product with full data for personalised style matching.',
      palette: ['#D4A096', '#C97E8A', '#E8C4B0', '#F2DDD5', '#B8806A'],
    },
    allergy: null,
    ingredients: [],
    ethics: [
      { icon: 'pets',      label: 'Cruelty Free', value: 'Unknown' },
      { icon: 'eco',       label: 'Vegan',        value: 'Unknown' },
      { icon: 'autorenew', label: 'Eco-Friendly', value: 'Unknown' },
    ],
  };
}
