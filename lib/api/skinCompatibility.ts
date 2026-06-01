// ── Skin Compatibility Checker ──────────────────────────────────────────────
// Builds 4 skin-fit rows based on actual ingredient analysis and user profile.

import type { SkinFitRow } from './product-scan';

// ── Ingredient keyword sets ─────────────────────────────────────────────────

const HYDRATING_AGENTS = [
  'glycerin', 'glycerol', 'hyaluronic acid', 'sodium hyaluronate',
  'squalane', 'ceramide', 'shea butter', 'argan oil', 'jojoba',
  'aloe vera', 'panthenol',
];

const SENSITIVE_IRRITANTS = [
  'parfum', 'fragrance', 'lavender', 'peppermint', 'tea tree',
  'menthol', 'eucalyptus', 'citrus', 'lemon', 'orange peel',
  'limonene', 'linalool', 'geraniol', 'cinnamal',
];

const OILY_HELPERS = [
  'niacinamide', 'salicylic acid', 'kaolin', 'zinc', 'silica',
  'dimethicone',
];

const OILY_OFFENDERS = [
  'coconut oil', 'cocos nucifera', 'cocoa butter',
  'theobroma cacao', 'isopropyl myristate', 'isopropyl palmitate',
];

const COMEDOGENIC = [
  'coconut oil', 'cocos nucifera', 'cocoa butter', 'theobroma cacao',
  'isopropyl myristate', 'isopropyl palmitate', 'wheat germ oil',
  'linseed oil', 'acetylated lanolin', 'lanolin alcohol',
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseIngredientList(ingredientsText: string): string[] {
  return ingredientsText
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length > 0);
}

function findFirst(haystack: string, needles: string[]): string | null {
  for (const needle of needles) {
    if (haystack.includes(needle)) return needle;
  }
  return null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Main export ─────────────────────────────────────────────────────────────

/**
 * Build exactly 4 skin-fit rows. The user's skin type row is sorted first.
 */
export function buildSkinFitRows(
  ingredientsText: string,
  userAllergies: string[],
  userSkinType: string,
  inferredSkinTypes: string[] = [],
): SkinFitRow[] {
  if (!ingredientsText || ingredientsText.trim().length === 0) {
    const inferred = new Set(inferredSkinTypes);
    if (inferred.size > 0) {
      return reorder(
        [
          {
            icon: 'opacity',
            label: 'Dry Skin',
            desc: 'Inferred from product category and brand profile.',
            ok: inferred.has('Dry'),
          },
          {
            icon: 'wb-sunny',
            label: 'Sensitive Skin',
            desc: 'Inferred from product labels and positioning.',
            ok: inferred.has('Sensitive'),
          },
          {
            icon: 'loop',
            label: 'Oily / Combo',
            desc: 'Inferred from product category and typical finish.',
            ok: inferred.has('Oily') || inferred.has('Combination'),
          },
          {
            icon: 'verified',
            label: 'Acne Safe',
            desc: 'No ingredient list available to verify comedogenic risk.',
            ok: inferred.has('Oily') || inferred.has('Combination') || inferred.has('Sensitive'),
          },
        ],
        userSkinType,
      );
    }

    return reorder(
      [
        { icon: 'opacity',  label: 'Dry Skin',      desc: 'Ingredient data unavailable for this product.', ok: true },
        { icon: 'wb-sunny', label: 'Sensitive Skin', desc: 'Ingredient data unavailable for this product.', ok: true },
        { icon: 'loop',     label: 'Oily / Combo',   desc: 'Ingredient data unavailable for this product.', ok: true },
        { icon: 'verified', label: 'Acne Safe',      desc: 'Ingredient data unavailable for this product.', ok: true },
      ],
      userSkinType,
    );
  }

  const lower = ingredientsText.toLowerCase();
  const parsedList = parseIngredientList(ingredientsText);
  const first10 = parsedList.slice(0, 10);
  const first15 = parsedList.slice(0, 15);

  const rows: SkinFitRow[] = [
    buildDrySkinRow(lower, first15),
    buildSensitiveRow(lower, userAllergies),
    buildOilyComboRow(lower, first10),
    buildAcneSafeRow(lower),
  ];

  return reorder(rows, userSkinType);
}

// ── Row builders ────────────────────────────────────────────────────────────

function buildDrySkinRow(lower: string, first15: string[]): SkinFitRow {
  const hydratingAgent = findFirst(lower, HYDRATING_AGENTS);
  const alcoholInTop15 = first15.some(i => i.includes('alcohol denat'));

  if (hydratingAgent) {
    return {
      icon: 'opacity',
      label: 'Dry Skin',
      desc: `${capitalize(hydratingAgent)} and hydrating agents keep skin moisturised.`,
      ok: true,
    };
  }

  if (alcoholInTop15) {
    return {
      icon: 'opacity',
      label: 'Dry Skin',
      desc: 'Alcohol denat is high in the formula — may feel drying without a hydrating base.',
      ok: false,
    };
  }

  // Safe default for dry skin — no negative signal
  return {
    icon: 'opacity',
    label: 'Dry Skin',
    desc: 'No drying agents detected in the formula.',
    ok: true,
  };
}

function buildSensitiveRow(
  lower: string,
  userAllergies: string[],
): SkinFitRow {
  const irritant = findFirst(lower, SENSITIVE_IRRITANTS);
  if (irritant) {
    return {
      icon: 'wb-sunny',
      label: 'Sensitive Skin',
      desc: `Contains ${capitalize(irritant)} which may irritate sensitive skin — patch test recommended.`,
      ok: false,
    };
  }

  const allergyLower = userAllergies.map(a => a.toLowerCase());
  const matchedAllergen = findFirst(lower, allergyLower);
  if (matchedAllergen) {
    return {
      icon: 'wb-sunny',
      label: 'Sensitive Skin',
      desc: `Contains ${capitalize(matchedAllergen)} from your sensitivity list.`,
      ok: false,
    };
  }

  return {
    icon: 'wb-sunny',
    label: 'Sensitive Skin',
    desc: 'No known irritants or personal allergens detected.',
    ok: true,
  };
}

function buildOilyComboRow(lower: string, first10: string[]): SkinFitRow {
  const helper = findFirst(lower, OILY_HELPERS);
  const offenderInTop10 = first10.some(i =>
    OILY_OFFENDERS.some(o => i.includes(o)),
  );

  if (offenderInTop10) {
    const offender = findFirst(first10.join(', '), OILY_OFFENDERS);
    return {
      icon: 'loop',
      label: 'Oily / Combo',
      desc: `Contains ${capitalize(offender ?? 'heavy oils')} high in the formula — may increase shine.`,
      ok: false,
    };
  }

  if (helper) {
    return {
      icon: 'loop',
      label: 'Oily / Combo',
      desc: `${capitalize(helper)} helps control oil and keeps skin balanced.`,
      ok: true,
    };
  }

  return {
    icon: 'loop',
    label: 'Oily / Combo',
    desc: 'No pore-clogging oils detected in the formula.',
    ok: true,
  };
}

function buildAcneSafeRow(lower: string): SkinFitRow {
  const comedogenic = findFirst(lower, COMEDOGENIC);
  if (comedogenic) {
    return {
      icon: 'verified',
      label: 'Acne Safe',
      desc: `Contains ${capitalize(comedogenic)} which may clog pores.`,
      ok: false,
    };
  }

  return {
    icon: 'verified',
    label: 'Acne Safe',
    desc: 'Non-comedogenic — low pore-clog risk.',
    ok: true,
  };
}

// ── Reorder to put user's skin type first ───────────────────────────────────

const SKIN_TYPE_LABEL_MAP: Record<string, string> = {
  dry: 'Dry Skin',
  sensitive: 'Sensitive Skin',
  oily: 'Oily / Combo',
  combination: 'Oily / Combo',
  acne: 'Acne Safe',
  'acne-prone': 'Acne Safe',
  normal: 'Dry Skin', // normal skin benefits from seeing dry-skin compatibility first
};

function reorder(rows: SkinFitRow[], userSkinType: string): SkinFitRow[] {
  const targetLabel = SKIN_TYPE_LABEL_MAP[userSkinType.toLowerCase()] ?? '';
  if (!targetLabel) return rows;

  const idx = rows.findIndex(r => r.label === targetLabel);
  if (idx <= 0) return rows; // already first or not found

  const result = [...rows];
  const [moved] = result.splice(idx, 1);
  result.unshift(moved);
  return result;
}
