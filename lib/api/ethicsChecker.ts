// ── Ethics Checker ──────────────────────────────────────────────────────────
// Builds 3 ethics rows: Cruelty Free, Vegan, Eco-Friendly.
// Merges signals from OBF labels, Makeup API, Cohere, and hardcoded brand lists.

import type { EthicsRow } from './product-scan';

// ── Hardcoded brand lists (publicly verified as of 2024) ────────────────────

const CRUELTY_FREE_BRANDS = new Set([
  'nyx', 'elf', 'e.l.f.', 'fenty beauty', 'urban decay', 'too faced',
  'tarte', 'bare minerals', 'bareminerals', 'the ordinary',
  'cerave', 'neutrogena', 'loreal', "l'oreal", 'maybelline', 'rimmel',
  'wet n wild', 'milani', 'physicians formula', 'pacifica', 'burts bees',
  "burt's bees", "paula's choice", 'dermalogica', 'covergirl', 'essence',
  'catrice', 'makeup revolution', 'charlotte tilbury', 'mac', 'nars',
  'benefit', 'hourglass', 'lush',
]);

const VEGAN_BRANDS = new Set([
  'pacifica', 'elf', 'e.l.f.', 'wet n wild', 'lush', 'cover fx', 'milk makeup',
]);

// ── Helpers ─────────────────────────────────────────────────────────────────

function normaliseBrand(brand: string): string {
  return brand
    .toLowerCase()
    .replace(/\s*(paris|new york|usa|london|cosmetics|professional)\s*/gi, '')
    .trim();
}

interface MakeupApiEthics {
  isVegan: boolean;
  isCrueltyFree: boolean;
}

interface CohereEthics {
  isCrueltyFree: boolean | null;
  isVegan: boolean | null;
}

// ── Main export ─────────────────────────────────────────────────────────────

/**
 * Build exactly 3 ethics rows: Cruelty Free, Vegan, Eco-Friendly.
 */
export function buildEthicsRows(
  obfLabels: string,
  brand: string,
  makeupApiData: MakeupApiEthics | null,
  cohereData: CohereEthics | null,
): EthicsRow[] {
  const lower = (obfLabels ?? '').toLowerCase();
  const normBrand = normaliseBrand(brand);

  // ── Cruelty Free ────────────────────────────────────────────────────
  let crueltyFree = 'Unknown';
  if (
    lower.includes('cruelty-free') ||
    lower.includes('cruelty free') ||
    lower.includes('leaping bunny') ||
    lower.includes('peta certified')
  ) {
    crueltyFree = 'Certified';
  } else if (makeupApiData?.isCrueltyFree) {
    crueltyFree = 'Certified';
  } else if (cohereData?.isCrueltyFree === true) {
    crueltyFree = 'Certified';
  } else if (CRUELTY_FREE_BRANDS.has(normBrand)) {
    crueltyFree = 'Certified';
  } else if (cohereData?.isCrueltyFree === false) {
    crueltyFree = 'Not Certified';
  }

  // ── Vegan ───────────────────────────────────────────────────────────
  let vegan = 'Unknown';
  if (lower.includes('vegan')) {
    vegan = '100%';
  } else if (makeupApiData?.isVegan) {
    vegan = '100%';
  } else if (cohereData?.isVegan === true) {
    vegan = '100%';
  } else if (VEGAN_BRANDS.has(normBrand)) {
    vegan = '100%';
  }

  // ── Eco-Friendly ────────────────────────────────────────────────────
  let eco = 'Unknown';
  if (
    lower.includes('organic') ||
    lower.includes('eco') ||
    lower.includes('recyclable') ||
    lower.includes('sustainable') ||
    lower.includes('refillable') ||
    lower.includes('biobased')
  ) {
    eco = 'Certified';
  }

  return [
    { icon: 'pets',      label: 'Cruelty Free', value: crueltyFree },
    { icon: 'eco',       label: 'Vegan',        value: vegan },
    { icon: 'autorenew', label: 'Eco-Friendly', value: eco },
  ];
}
