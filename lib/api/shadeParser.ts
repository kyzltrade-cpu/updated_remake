// ── Shade Parser ────────────────────────────────────────────────────────────
// Pure TypeScript, no API calls. Derives shade data from product name strings
// and computes CIE76 colour difference (delta-E) from scratch.

import type { DnaResult } from './dna';
import type { ToneRow } from './product-scan';

// ── Shade Name Extraction ───────────────────────────────────────────────────

interface ParsedShade {
  shadeName: string | null;
  undertone: string | null;
  depth: string | null;
}

const COLOUR_WORDS = new Set([
  'ivory', 'porcelain', 'alabaster', 'fair', 'light', 'nude', 'beige',
  'sand', 'buff', 'natural', 'honey', 'caramel', 'golden', 'tan',
  'bronze', 'copper', 'warm', 'almond', 'hazel', 'medium', 'espresso',
  'mahogany', 'cocoa', 'deep', 'rich', 'ebony', 'dark', 'brown',
  'rose', 'pink', 'peach', 'cream', 'shell', 'toffee', 'cinnamon',
  'chestnut', 'walnut', 'sienna', 'truffle', 'bisque', 'champagne',
  'fawn', 'ecru', 'amber',
]);

/**
 * Extract shade name, undertone, and depth from a product name string.
 */
export function parseShadeFromName(productName: string): ParsedShade {
  if (!productName || productName.trim().length === 0) {
    return { shadeName: null, undertone: null, depth: null };
  }

  const shadeName = extractShadeName(productName);
  const undertone = detectUndertone(shadeName, productName);
  const depth = detectDepth(shadeName, productName);

  return { shadeName, undertone, depth };
}

function extractShadeName(productName: string): string | null {
  // MAC shade codes: NC30, NW40, etc.
  const macMatch = productName.match(/\b(N[CW]\d{1,3})\b/i);
  if (macMatch) return macMatch[1].toUpperCase();

  // Fenty-style codes: 220N, 185W, 300C
  const fentyMatch = productName.match(/\b(\d{2,3}[NWCO])\b/i);
  if (fentyMatch) return fentyMatch[1].toUpperCase();

  // Generic numeric codes: 120, W2, C6, D8
  const numericMatch = productName.match(/\b([A-Z]?\d{1,3}[A-Z]?)\b/i);
  if (numericMatch && numericMatch[0].length >= 2) return numericMatch[0].toUpperCase();

  // Look for colour-descriptive words after a separator (dash, comma, colon)
  const separatorMatch = productName.match(/[-–—,:](.+)$/);
  if (separatorMatch) {
    const afterSep = separatorMatch[1].trim();
    const words = afterSep.split(/\s+/);
    const colourWords = words.filter(w => COLOUR_WORDS.has(w.toLowerCase()));
    if (colourWords.length > 0) {
      return words
        .slice(0, 3)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }

  // Scan the entire name for colour words (take the last 1-3)
  const nameWords = productName.split(/\s+/);
  for (let i = nameWords.length - 1; i >= 0; i--) {
    if (COLOUR_WORDS.has(nameWords[i].toLowerCase())) {
      const end = Math.min(i + 3, nameWords.length);
      const start = i;
      return nameWords
        .slice(start, end)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }

  return null;
}

// ── Undertone Detection ─────────────────────────────────────────────────────

function detectUndertone(
  shadeName: string | null,
  productName: string,
): string | null {
  const combined = `${shadeName ?? ''} ${productName}`.toLowerCase();

  // MAC shade codes
  if (/\bnc\d/i.test(combined)) return 'Warm';
  if (/\bnw\d/i.test(combined)) return 'Cool';

  // Fenty shade codes ending in letter
  const fentyCode = combined.match(/\b\d{2,3}([nwco])\b/i);
  if (fentyCode) {
    const letter = fentyCode[1].toUpperCase();
    if (letter === 'W') return 'Warm';
    if (letter === 'N') return 'Neutral';
    if (letter === 'C') return 'Cool';
    if (letter === 'O') return 'Olive';
  }

  // Keyword-based detection
  if (/\b(warm|golden|peach|peachy|bronze|copper|honey|caramel|almond|amber)\b/.test(combined))
    return 'Warm';
  if (/\b(cool|pink|rose|red|berry|mauve)\b/.test(combined))
    return 'Cool';
  if (/\b(neutral|beige|nude|natural|buff)\b/.test(combined))
    return 'Neutral';
  if (/\b(olive|green)\b/.test(combined))
    return 'Olive';

  return null;
}

// ── Depth Detection ─────────────────────────────────────────────────────────

function detectDepth(
  shadeName: string | null,
  productName: string,
): string | null {
  const combined = `${shadeName ?? ''} ${productName}`.toLowerCase();

  // Numeric range detection
  const numMatch = combined.match(/\b(\d{3})\b/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (num >= 100 && num <= 190) return 'Fair';
    if (num >= 200 && num <= 290) return 'Light';
    if (num >= 300 && num <= 390) return 'Medium';
    if (num >= 400 && num <= 490) return 'Tan';
    if (num >= 500) return 'Deep';
  }

  // Keyword-based
  if (/\b(fair|porcelain|ivory|alabaster|lightest)\b/.test(combined)) return 'Fair';
  if (/\b(light|nude|shell|cream)\b/.test(combined)) return 'Light';
  if (/\b(medium|sand|natural|buff)\b/.test(combined)) return 'Medium';
  if (/\b(tan|caramel|honey|golden|hazel)\b/.test(combined)) return 'Tan';
  if (/\b(deep|espresso|mahogany|rich|dark|ebony|cocoa)\b/.test(combined))
    return 'Deep';

  return null;
}

// ── Shade Hex Lookup ────────────────────────────────────────────────────────

const SHADE_HEX_MATRIX: Record<string, Record<string, string>> = {
  Fair:   { Warm: '#F5D5B8', Cool: '#F0CCCC', Neutral: '#F2D5C4', Olive: '#EDD5B0' },
  Light:  { Warm: '#E8B896', Cool: '#E0AABB', Neutral: '#DEB99A', Olive: '#D9B888' },
  Medium: { Warm: '#C9956A', Cool: '#B8899C', Neutral: '#C49A7A', Olive: '#B89A6A' },
  Tan:    { Warm: '#A0704A', Cool: '#9A6878', Neutral: '#A07858', Olive: '#907848' },
  Deep:   { Warm: '#6B4030', Cool: '#5A3848', Neutral: '#6B4838', Olive: '#504030' },
};

const DEFAULT_HEX = '#C9956A';

/**
 * Return the hex for the undertone × depth combination.
 * Falls back to a neutral default if either is null.
 */
export function deriveShadeHex(
  undertone: string | null,
  depth: string | null,
): string {
  if (!depth || !undertone) return DEFAULT_HEX;
  return SHADE_HEX_MATRIX[depth]?.[undertone] ?? DEFAULT_HEX;
}

// ── CIE76 Delta-E (from scratch) ───────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function linearise(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  const lr = linearise(r);
  const lg = linearise(g);
  const lb = linearise(b);

  const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.0721750 * lb;
  const z = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb;

  return [x * 100, y * 100, z * 100];
}

function labF(t: number): number {
  return t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116;
}

function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  // D65 illuminant reference values
  const xn = x / 95.047;
  const yn = y / 100.000;
  const zn = z / 108.883;

  const fx = labF(xn);
  const fy = labF(yn);
  const fz = labF(zn);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);

  return [L, a, bVal];
}

/**
 * Compute CIE76 delta-E between two hex colours.
 */
export function calculateDeltaE(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);

  const [x1, y1, z1] = rgbToXyz(r1, g1, b1);
  const [x2, y2, z2] = rgbToXyz(r2, g2, b2);

  const [L1, a1, b1Lab] = xyzToLab(x1, y1, z1);
  const [L2, a2, b2Lab] = xyzToLab(x2, y2, z2);

  return Math.sqrt(
    (L1 - L2) ** 2 + (a1 - a2) ** 2 + (b1Lab - b2Lab) ** 2,
  );
}

// ── Delta-E → Match Percentage ──────────────────────────────────────────────

const DE_ANCHORS: [number, number][] = [
  [0, 100],
  [3, 90],
  [6, 80],
  [10, 68],
  [15, 55],
  [20, 45],
  [30, 30],
];

/**
 * Convert a CIE76 delta-E value to a 0-100 match percentage.
 * Uses linear interpolation between anchor points.
 */
export function deltaEToMatchPct(deltaE: number): number {
  if (deltaE <= 0) return 100;
  if (deltaE >= 30) return 20;

  for (let i = 0; i < DE_ANCHORS.length - 1; i++) {
    const [de1, pct1] = DE_ANCHORS[i];
    const [de2, pct2] = DE_ANCHORS[i + 1];
    if (deltaE >= de1 && deltaE <= de2) {
      const t = (deltaE - de1) / (de2 - de1);
      return Math.round(pct1 + t * (pct2 - pct1));
    }
  }

  return 20;
}

// ── Tone Rows ───────────────────────────────────────────────────────────────

const UNDERTONE_ADJACENCY: Record<string, string[]> = {
  Warm:    ['Neutral', 'Olive'],
  Cool:    ['Neutral'],
  Neutral: ['Warm', 'Cool'],
  Olive:   ['Warm', 'Neutral'],
};

const DEPTH_ORDER = ['Fair', 'Light', 'Medium', 'Tan', 'Deep'];

function depthDistance(a: string, b: string): number {
  const ia = DEPTH_ORDER.indexOf(a);
  const ib = DEPTH_ORDER.indexOf(b);
  if (ia === -1 || ib === -1) return 3;
  return Math.abs(ia - ib);
}

/**
 * Determine the user's depth from their skinToneHex luminance.
 */
function depthFromHex(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  // Relative luminance (simple weighted average)
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  if (lum >= 210) return 'Fair';
  if (lum >= 180) return 'Light';
  if (lum >= 140) return 'Medium';
  if (lum >= 100) return 'Tan';
  return 'Deep';
}

/**
 * Build exactly 4 tone rows: Undertone, Depth, Saturation, Oxidation.
 */
export function buildToneRows(
  undertone: string | null,
  depth: string | null,
  userDna: DnaResult | null,
  oxidises: boolean | null,
): ToneRow[] {
  // ── Undertone row
  const utValue = undertone ?? 'Unknown';
  let utPct = 60; // unknown default
  if (undertone && userDna) {
    // Derive user undertone from colorSeason
    const userUt = userDna.colorSeason.toLowerCase().includes('warm')
      ? 'Warm'
      : userDna.colorSeason.toLowerCase().includes('cool')
        ? 'Cool'
        : 'Neutral';
    if (undertone === userUt) {
      utPct = 95;
    } else if (UNDERTONE_ADJACENCY[undertone]?.includes(userUt)) {
      utPct = 72;
    } else {
      utPct = 45;
    }
  }

  // ── Depth row
  const dpValue = depth ?? 'Unknown';
  let dpPct = 60;
  if (depth && userDna) {
    const userDepth = depthFromHex(userDna.skinToneHex);
    const dist = depthDistance(depth, userDepth);
    if (dist === 0) dpPct = 90;
    else if (dist === 1) dpPct = 75;
    else dpPct = 55;
  }

  // ── Saturation row
  let satValue = '—';
  let satPct = 60;
  if (depth === 'Fair' || depth === 'Light') {
    satValue = 'Low–Medium';
    satPct = 70;
  } else if (depth === 'Medium') {
    satValue = 'Balanced';
    satPct = 80;
  } else if (depth === 'Tan' || depth === 'Deep') {
    satValue = 'Rich';
    satPct = 85;
  }

  // ── Oxidation row
  let oxValue = '—';
  let oxPct = 60;
  if (oxidises === true) {
    oxValue = 'Moderate shift';
    oxPct = 65;
  } else if (oxidises === false) {
    oxValue = 'Low shift';
    oxPct = 90;
  }

  return [
    { label: 'Undertone',  value: utValue,  pct: utPct },
    { label: 'Depth',      value: dpValue,  pct: dpPct },
    { label: 'Saturation', value: satValue, pct: satPct },
    { label: 'Oxidation',  value: oxValue,  pct: oxPct },
  ];
}
