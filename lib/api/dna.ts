import type { PriorityCategory } from '@/lib/onboarding-store';
import { hasGeminiKey, uriToBase64, geminiVision } from './gemini';

export type FaceShape = 'Oval' | 'Round' | 'Heart' | 'Square' | 'Oblong';
export type ColorSeason = 'Warm Spring' | 'Light Spring' | 'Warm Autumn' | 'Deep Autumn' | 'Cool Summer' | 'Light Summer' | 'Deep Winter' | 'Cool Winter';
export type LashProfile = 'Long & Sparse' | 'Short & Full' | 'Long & Full' | 'Short & Sparse' | 'Curly' | 'Straight & Dense';
export type BrowShape = 'Soft Arch' | 'High Arch' | 'Flat' | 'S-Curve' | 'Tapered';
export type EnergyType = 'Sharp' | 'Soft' | 'Balanced';

export const ARCHETYPES = {
  Oval: {
    Blending: 'The Editorial Eye',
    Symmetry: 'The Classic Glamour',
    'Colour Harmony': 'The Color Curator',
    Coverage: 'The Glazed Canvas',
    'Brow Shaping': 'The Soft Romantic',
  },
  Round: {
    Blending: 'The Soft Romantic',
    Symmetry: 'The Power Contour',
    'Colour Harmony': 'The Color Curator',
    Coverage: 'The Radiant Minimalist',
    'Brow Shaping': 'The Power Contour',
  },
  Heart: {
    Blending: 'The Soft Romantic',
    Symmetry: 'The Radiant Minimalist',
    'Colour Harmony': 'The Editorial Eye',
    Coverage: 'The Glazed Canvas',
    'Brow Shaping': 'The Dark Feminine',
  },
  Square: {
    Blending: 'The Power Contour',
    Symmetry: 'The Classic Glamour',
    'Colour Harmony': 'The Dark Feminine',
    Coverage: 'The Glazed Canvas',
    'Brow Shaping': 'The Power Contour',
  },
  Oblong: {
    Blending: 'The Glazed Canvas',
    Symmetry: 'The Soft Romantic',
    'Colour Harmony': 'The Color Curator',
    Coverage: 'The Radiant Minimalist',
    'Brow Shaping': 'The Classic Glamour',
  },
} as const;

export const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
  'The Glazed Canvas': 'Skin-first. Luminous glass-skin perfection. Natural light is your filter.',
  'The Soft Romantic': 'Warmth and femininity. Rose tones, blurred edges, peachy candlelit glow.',
  'The Editorial Eye': 'Sharp, graphic, fashion-forward. High contrast, bold colour. Your face is the canvas.',
  'The Power Contour': 'Structure is your signature. Chiselled, defined, placed with intention.',
  'The Dark Feminine': 'Sultry depth. Deep tones, smoky shadows. Quiet looks, maximum power.',
  'The Radiant Minimalist': 'Fresh face, one perfect statement piece. Precision over layering.',
  'The Color Curator': 'Makeup as colour theory. Unexpected combinations that work perfectly.',
  'The Classic Glamour': 'Timeless over trendy. Red lip, defined brow, skin-matching base.',
};

export const SEASON_DESCRIPTIONS: Record<ColorSeason, string> = {
  'Warm Spring': 'Golden, peachy, clear. Your palette glows in coral, warm gold, and ivory.',
  'Light Spring': 'Fresh and bright. Soft peach, warm beige, and light golden tones are yours.',
  'Warm Autumn': 'Earthy, rich, golden. Your palette lives in amber, terracotta, and deep olive.',
  'Deep Autumn': 'Intense and warm. Burnt orange, chocolate, and bronze define your look.',
  'Cool Summer': 'Muted and elegant. Dusty rose, soft lavender, and cool taupe are your signature.',
  'Light Summer': 'Soft and delicate. Cool pink, powder blue, and pale gold work beautifully.',
  'Deep Winter': 'Bold and high-contrast. Deep jewel tones — burgundy, navy, emerald — are your power.',
  'Cool Winter': 'Crisp and precise. Icy hues and true cool tones create your sharp signature.',
};

export interface DnaResult {
  faceShape: FaceShape;
  skinToneHex: string;
  colorSeason: ColorSeason;
  browShape: BrowShape;
  browSymmetryPct: number;
  lashProfile: LashProfile;
  energy: EnergyType;
  archetype: string;
  archetypeDescription: string;
}

export interface DnaAnalysisRequest {
  imageUri: string;
  priorityCategory: PriorityCategory;
}

const VALID_FACE_SHAPES = new Set<FaceShape>(['Oval', 'Round', 'Heart', 'Square', 'Oblong']);
const VALID_SEASONS = new Set<ColorSeason>([
  'Warm Spring', 'Light Spring', 'Warm Autumn', 'Deep Autumn',
  'Cool Summer', 'Light Summer', 'Deep Winter', 'Cool Winter',
]);
const VALID_BROW_SHAPES = new Set<BrowShape>(['Soft Arch', 'High Arch', 'Flat', 'S-Curve', 'Tapered']);
const VALID_LASH_PROFILES = new Set<LashProfile>([
  'Long & Sparse', 'Short & Full', 'Long & Full', 'Short & Sparse', 'Curly', 'Straight & Dense',
]);
const VALID_ENERGIES = new Set<EnergyType>(['Sharp', 'Soft', 'Balanced']);

const DNA_PROMPT = `
You are a professional beauty analyst. Carefully study this face photo.

Return ONLY this JSON (no markdown, no extra text):
{
  "faceShape": "Oval",
  "skinToneHex": "#C9956A",
  "colorSeason": "Warm Autumn",
  "browShape": "Soft Arch",
  "browSymmetryPct": 86,
  "lashProfile": "Long & Sparse",
  "energy": "Balanced"
}

Field rules — use EXACTLY one of these values:
- faceShape: Oval | Round | Heart | Square | Oblong
- skinToneHex: 6-digit hex matching the person's skin tone (sample cheek/forehead, include #)
- colorSeason: Warm Spring | Light Spring | Warm Autumn | Deep Autumn | Cool Summer | Light Summer | Deep Winter | Cool Winter
- browShape: Soft Arch | High Arch | Flat | S-Curve | Tapered
- browSymmetryPct: integer 70-100 (how closely brows match)
- lashProfile: Long & Sparse | Short & Full | Long & Full | Short & Sparse | Curly | Straight & Dense
- energy: Sharp | Soft | Balanced

Analysis notes:
- Face shape: compare forehead width, cheekbone width, jawline width, and face length ratios
- Color season: warm vs cool undertone first, then depth (light / medium / deep)
- Energy: Sharp = angular jaw/features, Soft = rounded features, Balanced = mix
- If a feature is not clearly visible, make a best-effort assessment
`.trim();

interface GeminiDnaResponse {
  faceShape: string;
  skinToneHex: string;
  colorSeason: string;
  browShape: string;
  browSymmetryPct: number;
  lashProfile: string;
  energy: string;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function mockDna(request: DnaAnalysisRequest): DnaResult {
  const faceShape = randomFrom<FaceShape>(['Oval', 'Round', 'Heart', 'Square', 'Oblong']);
  const colorSeason = randomFrom<ColorSeason>(['Warm Autumn', 'Cool Summer', 'Deep Winter', 'Light Spring']);
  const MOCK_HEXES: Record<ColorSeason, string> = {
    'Warm Spring': '#D4A574', 'Light Spring': '#E8C09A',
    'Warm Autumn': '#C8956A', 'Deep Autumn': '#9E6B4A',
    'Cool Summer': '#C9A99E', 'Light Summer': '#D9BDB8',
    'Deep Winter': '#7D4A3E', 'Cool Winter': '#A87E7A',
  };

  const archetype = (ARCHETYPES[faceShape] as Record<string, string>)[request.priorityCategory] ?? 'The Glazed Canvas';

  return {
    faceShape,
    skinToneHex: MOCK_HEXES[colorSeason],
    colorSeason,
    browShape: randomFrom<BrowShape>(['Soft Arch', 'High Arch', 'S-Curve', 'Flat', 'Tapered']),
    browSymmetryPct: 82 + Math.floor(Math.random() * 15),
    lashProfile: randomFrom<LashProfile>(['Long & Sparse', 'Short & Full', 'Long & Full', 'Curly']),
    energy: randomFrom<EnergyType>(['Soft', 'Sharp', 'Balanced']),
    archetype,
    archetypeDescription: ARCHETYPE_DESCRIPTIONS[archetype] ?? '',
  };
}

export async function analyzeDna(request: DnaAnalysisRequest): Promise<DnaResult> {
  if (hasGeminiKey()) {
    try {
      const imageBase64 = await uriToBase64(request.imageUri);
      const raw = await geminiVision<GeminiDnaResponse>(imageBase64, DNA_PROMPT);

      const faceShape = VALID_FACE_SHAPES.has(raw.faceShape as FaceShape)
        ? (raw.faceShape as FaceShape)
        : 'Oval';
      const colorSeason = VALID_SEASONS.has(raw.colorSeason as ColorSeason)
        ? (raw.colorSeason as ColorSeason)
        : 'Warm Autumn';
      const browShape = VALID_BROW_SHAPES.has(raw.browShape as BrowShape)
        ? (raw.browShape as BrowShape)
        : 'Soft Arch';
      const lashProfile = VALID_LASH_PROFILES.has(raw.lashProfile as LashProfile)
        ? (raw.lashProfile as LashProfile)
        : 'Long & Sparse';
      const energy = VALID_ENERGIES.has(raw.energy as EnergyType)
        ? (raw.energy as EnergyType)
        : 'Balanced';
      const skinToneHex = /^#[0-9A-Fa-f]{6}$/.test(raw.skinToneHex)
        ? raw.skinToneHex
        : '#C9956A';
      const browSymmetryPct = Math.min(100, Math.max(70, Math.round(raw.browSymmetryPct ?? 85)));

      const archetype = (ARCHETYPES[faceShape] as Record<string, string>)[request.priorityCategory]
        ?? 'The Glazed Canvas';

      return {
        faceShape,
        skinToneHex,
        colorSeason,
        browShape,
        browSymmetryPct,
        lashProfile,
        energy,
        archetype,
        archetypeDescription: ARCHETYPE_DESCRIPTIONS[archetype] ?? '',
      };
    } catch (e) {
      console.warn('[DNA] Gemini failed, using mock:', e);
    }
  }

  // Mock fallback
  await new Promise(r => setTimeout(r, 4500));
  return mockDna(request);
}
