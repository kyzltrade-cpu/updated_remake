import type { AnalyzeImageRequest, DiagnosisResult, DiagnosisProvider, CategoryAnalysis, SixCategory, Verdict, CoachingResult } from './types';
import { isSafeImageUri } from '@/lib/validation';
import { hasOpenRouterKey, uriToBase64, openRouterVision, openRouterVisionDual } from './openrouter';

const CATEGORY_WEIGHTS: Record<SixCategory, number> = {
  Blending: 25,
  Symmetry: 20,
  'Colour Harmony': 20,
  Coverage: 15,
  Cleanliness: 10,
  'Brow Framing': 10,
};

const FALLBACK_TIPS: Record<SixCategory, { tip: string; tipShort: string }> = {
  Blending: {
    tip: 'Analysis of blending boundaries is unavailable. Ensure your eyes are in focus and evenly lit for precise evaluation.',
    tipShort: 'Blending analysis currently unavailable.',
  },
  Symmetry: {
    tip: 'Facial structural symmetry could not be fully mapped under current angles. Keep your face centered within the camera guide.',
    tipShort: 'Symmetry analysis currently unavailable.',
  },
  'Colour Harmony': {
    tip: 'Colour undertone contrast could not be verified. Avoid yellow background lighting or heavy shadows for an accurate reading.',
    tipShort: 'Colour analysis currently unavailable.',
  },
  Coverage: {
    tip: 'Product application thickness could not be determined. Check that the lens is clear and snap under direct natural light.',
    tipShort: 'Coverage analysis currently unavailable.',
  },
  Cleanliness: {
    tip: 'Detail inspection of fallout or residue is unavailable. For accurate results, avoid using front-camera flash.',
    tipShort: 'Cleanliness analysis currently unavailable.',
  },
  'Brow Framing': {
    tip: 'Brow shape outline could not be calculated. Ensure both eyebrows are completely uncovered by hair or glasses.',
    tipShort: 'Brow analysis currently unavailable.',
  },
};

const TUTORIAL_QUERIES: Record<SixCategory, string> = {
  Blending: '{level} eyeshadow blending tutorial step by step',
  Symmetry: 'how to do symmetrical makeup {level} tutorial',
  'Colour Harmony': '{level} colour theory makeup undertones tutorial',
  Coverage: '{level} foundation and concealer application tutorial',
  Cleanliness: 'clean precise makeup application tutorial {level}',
  'Brow Framing': '{level} eyebrow shaping tutorial',
};

function buildQuery(category: SixCategory, skillLevel: string): string {
  return TUTORIAL_QUERIES[category].replace('{level}', skillLevel.toLowerCase());
}

function jitter(base: number, range: number): number {
  return Math.min(99, Math.max(38, base + Math.round((Math.random() - 0.5) * 2 * range)));
}

function weightedScore(categories: CategoryAnalysis[]): number {
  const totalWeight = categories.reduce((s, c) => s + c.weight, 0);
  const weighted = categories.reduce((s, c) => s + c.score * c.weight, 0);
  return Math.round(weighted / totalWeight);
}

// Reverts to raw LLM scores with a confidence-preserving soft floor of 50 and organic jitter
function scaleScore(raw: number): number {
  const floor = 50;
  const scaled = Math.max(floor, raw);
  const jitterVal = Math.floor(Math.random() * 3); // 0, 1, or 2 points
  return Math.min(100, scaled + jitterVal);
}

const DIAGNOSIS_PROMPT = (priority: string, skill: string, hasReference: boolean) => `
You are an expert makeup artist AI analysing a selfie for makeup quality. The person may or may not be wearing makeup.
${hasReference ? '\nThe FIRST image is the user\'s current look. The SECOND image is their saved reference/goal look. Use the reference to calibrate your scoring — note progress toward or away from it in the tips.\n' : ''}
User's skill level: ${skill}
User's priority focus area: ${priority}

Evaluate the photo carefully and score each of the six categories 0–100 based solely on what is visible in the photo.
CRITICAL: Do NOT copy the template scores (like 50) shown in the example JSON. You must generate unique, varied, and realistic scores that accurately reflect the user's actual makeup quality.
The "${priority}" category must receive the most detailed feedback.

For each category, determine if the user is wearing makeup/product relevant to that category. For example:
- "Coverage": is the user wearing any foundation/concealer/base makeup?
- "Blending": is the user wearing any eyeshadow, contour, or blush that requires blending?
- "Brow Framing": is the user wearing any brow makeup?
If no makeup/product is detected for a category (i.e., bare skin, bare eyes, natural brows with no product), set "detected" to false. If makeup/product is detected, set "detected" to true.
If a category is not detected (detected is false), score it 75 and explain in the tip that no makeup was detected for this category (be constructive!).

Return ONLY this JSON (no markdown, no extra text):
{
  "categories": [
    { "name": "Blending", "score": 50, "detected": true, "tip": "2-3 specific sentences referencing what you see in the photo. Tailored to ${skill} level.", "tipShort": "One clear action sentence." },
    { "name": "Symmetry", "score": 50, "detected": true, "tip": "...", "tipShort": "..." },
    { "name": "Colour Harmony", "score": 50, "detected": true, "tip": "...", "tipShort": "..." },
    { "name": "Coverage", "score": 50, "detected": true, "tip": "...", "tipShort": "..." },
    { "name": "Cleanliness", "score": 50, "detected": true, "tip": "...", "tipShort": "..." },
    { "name": "Brow Framing", "score": 50, "detected": true, "tip": "...", "tipShort": "..." }
  ]
}

Scoring guide: 90-100 = professional, 75-89 = good, 60-74 = average, 40-59 = needs work, below 40 = major issues.
`.trim();

interface NimDiagnosisResponse {
  categories: Array<{
    name: string;
    score: number;
    tip: string;
    tipShort: string;
    detected?: boolean;
  }>;
}

async function analyzeWithNim(request: AnalyzeImageRequest): Promise<DiagnosisResult> {
  const priority = request.priorityCategory ?? 'Blending';
  const skill = request.skillLevel ?? 'Intermediate';
  const hasReference = !!request.referenceUri && isSafeImageUri(request.referenceUri);

  const imageBase64 = await uriToBase64(request.imageUri);
  
  let result: NimDiagnosisResponse;
  let actualHasReference = hasReference;
  let refBase64: string | null = null;

  if (hasReference) {
    try {
      refBase64 = await uriToBase64(request.referenceUri!);
    } catch (e) {
      console.warn('[Diagnosis] Reference photo failed to load (possibly deleted from cache). Falling back to single-image scan:', e);
      actualHasReference = false;
    }
  }

  const prompt = DIAGNOSIS_PROMPT(priority, skill, actualHasReference);

  const MODEL_ID = 'qwen/qwen-2.5-vl-72b-instruct';

  if (actualHasReference && refBase64) {
    result = await openRouterVisionDual<NimDiagnosisResponse>(imageBase64, refBase64, prompt, MODEL_ID);
  } else {
    result = await openRouterVision<NimDiagnosisResponse>(imageBase64, prompt, MODEL_ID);
  }
  console.log('[Diagnosis] Successfully fetched real OpenRouter Vision payload!', JSON.stringify(result));

  const categories: CategoryAnalysis[] = (Object.keys(CATEGORY_WEIGHTS) as SixCategory[]).map(name => {
    const found = result.categories.find(c => c.name === name);
    const rawScore = found
      ? Math.min(100, Math.max(0, Math.round(found.score)))
      : jitter(78, 18);
    const score = scaleScore(rawScore);
    const isPriority = name === priority;

    return {
      name,
      weight: isPriority ? Math.round(CATEGORY_WEIGHTS[name] * 1.3) : CATEGORY_WEIGHTS[name],
      score,
      isPriority,
      tip: found?.tip ?? FALLBACK_TIPS[name].tip,
      tipShort: found?.tipShort ?? FALLBACK_TIPS[name].tipShort,
      tutorialQuery: buildQuery(name, skill),
      detected: found ? found.detected !== false : false,
    };
  });

  const allBare = categories.every(cat => cat.detected === false);
  const overallScore = allBare ? null : weightedScore(categories);
  const verdict: Verdict = allBare ? 'GO' : (overallScore! >= 72 ? 'GO' : 'FIX');
  return { overallScore, verdict, categories };
}

function mockAnalyze(request: AnalyzeImageRequest): DiagnosisResult {
  const priority = request.priorityCategory ?? 'Blending';
  const skill = request.skillLevel ?? 'Intermediate';

  const categories: CategoryAnalysis[] = (Object.keys(CATEGORY_WEIGHTS) as SixCategory[]).map(name => {
    const isPriority = name === priority;
    return {
      name,
      weight: isPriority ? Math.round(CATEGORY_WEIGHTS[name] * 1.3) : CATEGORY_WEIGHTS[name],
      score: scaleScore(jitter(40, 40)),
      isPriority,
      tip: FALLBACK_TIPS[name].tip,
      tipShort: FALLBACK_TIPS[name].tipShort,
      tutorialQuery: buildQuery(name, skill),
      detected: true,
    };
  });

  const allBare = categories.every(cat => cat.detected === false);
  const overallScore = allBare ? null : weightedScore(categories);
  return { overallScore, verdict: allBare ? 'GO' : (overallScore! >= 72 ? 'GO' : 'FIX'), categories };
}

class SixCategoryDiagnosisProvider implements DiagnosisProvider {
  async analyze(request: AnalyzeImageRequest): Promise<DiagnosisResult> {
    if (!request.imageUri || !isSafeImageUri(request.imageUri)) {
      throw new Error('Invalid image URI');
    }

    // Propagate the actual OpenRouter Vision error upwards so the loader catches it and re-routes to error screen
    return await analyzeWithNim(request);
  }
}

let provider: DiagnosisProvider | null = null;

export function getDiagnosisProvider(): DiagnosisProvider {
  if (!provider) provider = new SixCategoryDiagnosisProvider();
  return provider;
}

export async function analyzeImage(request: AnalyzeImageRequest): Promise<DiagnosisResult> {
  return getDiagnosisProvider().analyze(request);
}

// ─── UNIFIED FACE SCAN SPEED & ACCURACY UPGRADE ───────────────────────────────

const UNIFIED_FULL_PROMPT = (priority: string, skill: string) => `
You are an expert makeup artist AI and beauty analyst. You are analyzing a selfie for cosmetic quality, skin structure, and facial geometry.

Return a single JSON object that contains the complete analysis across three distinct domains.

<task_makeup_scoring>
Evaluate the cosmetic quality of the makeup in the selfie. Score each of the six categories (Blending, Symmetry, Colour Harmony, Coverage, Cleanliness, Brow Framing) from 0-100.
If no makeup/product is detected for a category (i.e., bare skin, bare eyes, natural brows with no product), set "detected" to false. If makeup is detected, set "detected" to true.
If a category is not detected (detected is false), score it 75 and explain in the reasoning/tip that no makeup was detected for this category (be constructive!).
The "${priority}" category must receive the most detailed feedback.
</task_makeup_scoring>

<task_beauty_dna>
Analyze the physical facial structure:
- faceShape: Oval, Round, Heart, Square, Oblong
- colorSeason: Warm Autumn, Cool Summer, Deep Winter, Light Spring, etc.
- skinToneHex: Primary skin tone color hex (e.g., #C8956A)
- eyeShape: Siren Eye, Doe Eye, Almond Eye, Hooded Eye, Monolid Eye, Dove Eye
- browShape: Soft Arch, High Arch, S-Curve, Flat, Tapered
- browSymmetryPct: 70-100 symmetry rating
- lashProfile: Long & Sparse, Short & Full, Long & Full, Curly
- archetype: Creative name for their style blueprint (e.g., "The Soft Romantic")
- archetypeDescription: 2-sentence description of why they fit this archetype.
</task_beauty_dna>

<task_coaching>
Draft a highly personalized, warm 1-2 sentence coaching compliment from a personal beauty editor. It must match their scores and physical traits perfectly. Calibrate language to skill level (${skill}).
</task_coaching>

CRITICAL: You must return ONLY a raw JSON object matching the schema below. No markdown wrapping, no text before or after the JSON.

JSON Schema:
{
  "makeup_analysis": {
    "categories": [
      {
        "name": "Blending",
        "detected": boolean,
        "reasoning": "Detailed 2-sentence explanation of what is visible in the photo.",
        "score": number,
        "tip": "Constructive 1-sentence tip.",
        "tipShort": "Short action item."
      },
      { "name": "Symmetry", "detected": boolean, "reasoning": "...", "score": 50, "tip": "...", "tipShort": "..." },
      { "name": "Colour Harmony", "detected": boolean, "reasoning": "...", "score": 50, "tip": "...", "tipShort": "..." },
      { "name": "Coverage", "detected": boolean, "reasoning": "...", "score": 50, "tip": "...", "tipShort": "..." },
      { "name": "Cleanliness", "detected": boolean, "reasoning": "...", "score": 50, "tip": "...", "tipShort": "..." },
      { "name": "Brow Framing", "detected": boolean, "reasoning": "...", "score": 50, "tip": "...", "tipShort": "..." }
    ]
  },
  "beauty_dna": {
    "faceShape": "string",
    "colorSeason": "string",
    "skinToneHex": "string",
    "eyeShape": "string",
    "browShape": "string",
    "browSymmetryPct": number,
    "lashProfile": "string",
    "archetype": "string",
    "archetypeDescription": "string"
  },
  "coaching": {
    "compliment": "string"
  }
}
`.trim();

const UNIFIED_QUICK_PROMPT = (priority: string, skill: string) => `
You are an expert makeup artist AI. You are analyzing a selfie for cosmetic quality and providing personalized beauty coaching.

Return a single JSON object that contains the complete analysis across two distinct domains.

<task_makeup_scoring>
Evaluate the cosmetic quality of the makeup in the selfie. Score each of the six categories (Blending, Symmetry, Colour Harmony, Coverage, Cleanliness, Brow Framing) from 0-100.
If no makeup/product is detected for a category (i.e., bare skin, bare eyes, natural brows with no product), set "detected" to false. If makeup is detected, set "detected" to true.
If a category is not detected (detected is false), score it 75 and explain in the reasoning/tip that no makeup was detected for this category (be constructive!).
The "${priority}" category must receive the most detailed feedback.
</task_makeup_scoring>

<task_coaching>
Draft a highly personalized, warm 1-2 sentence coaching compliment from a personal beauty editor. It must match their scores and physical traits perfectly. Calibrate language to skill level (${skill}).
</task_coaching>

CRITICAL: You must return ONLY a raw JSON object matching the schema below. No markdown wrapping, no text before or after the JSON.

JSON Schema:
{
  "makeup_analysis": {
    "categories": [
      {
        "name": "Blending",
        "detected": boolean,
        "reasoning": "Detailed 2-sentence explanation of what is visible in the photo.",
        "score": number,
        "tip": "Constructive 1-sentence tip.",
        "tipShort": "Short action item."
      },
      { "name": "Symmetry", "detected": boolean, "reasoning": "...", "score": 50, "tip": "...", "tipShort": "..." },
      { "name": "Colour Harmony", "detected": boolean, "reasoning": "...", "score": 50, "tip": "...", "tipShort": "..." },
      { "name": "Coverage", "detected": boolean, "reasoning": "...", "score": 50, "tip": "...", "tipShort": "..." },
      { "name": "Cleanliness", "detected": boolean, "reasoning": "...", "score": 50, "tip": "...", "tipShort": "..." },
      { "name": "Brow Framing", "detected": boolean, "reasoning": "...", "score": 50, "tip": "...", "tipShort": "..." }
    ]
  },
  "coaching": {
    "compliment": "string"
  }
}
`.trim();

export interface UnifiedScanResult {
  diagnosis: DiagnosisResult;
  dna: any | null;
  coaching: CoachingResult;
}

export async function runUnifiedFaceScan(request: AnalyzeImageRequest, hasExistingDna: boolean): Promise<UnifiedScanResult> {
  if (!request.imageUri || !isSafeImageUri(request.imageUri)) {
    throw new Error('Invalid image URI');
  }

  const priority = request.priorityCategory ?? 'Blending';
  const skill = request.skillLevel ?? 'Intermediate';
  const imageBase64 = await uriToBase64(request.imageUri);

  const prompt = hasExistingDna 
    ? UNIFIED_QUICK_PROMPT(priority, skill)
    : UNIFIED_FULL_PROMPT(priority, skill);

  // We use Qwen 3 VL 8B as our unified speed & accuracy model for HK-compatible lightning-fast face scanning!
  const MODEL_ID = 'qwen/qwen3-vl-8b-instruct';

  console.log(`[Unified Scan] Triggering single-request face scan via ${MODEL_ID} (hasExistingDna: ${hasExistingDna})...`);
  
  const result = await openRouterVision<any>(imageBase64, prompt, MODEL_ID);
  console.log('[Unified Scan] Successfully received unified response:', JSON.stringify(result));

  // Extract and compute makeup scores
  const makeupData = result.makeup_analysis || { categories: [] };
  const categories: CategoryAnalysis[] = (Object.keys(CATEGORY_WEIGHTS) as SixCategory[]).map(name => {
    const found = makeupData.categories?.find((c: any) => c.name === name);
    const rawScore = found
      ? Math.min(100, Math.max(0, Math.round(found.score)))
      : jitter(78, 18);
    const score = scaleScore(rawScore);
    const isPriority = name === priority;

    return {
      name,
      weight: isPriority ? Math.round(CATEGORY_WEIGHTS[name] * 1.3) : CATEGORY_WEIGHTS[name],
      score,
      isPriority,
      tip: found?.tip ?? FALLBACK_TIPS[name].tip,
      tipShort: found?.tipShort ?? FALLBACK_TIPS[name].tipShort,
      tutorialQuery: buildQuery(name, skill),
      detected: found ? found.detected !== false : false,
    };
  });

  const allBare = categories.every(cat => cat.detected === false);
  const overallScore = allBare ? null : weightedScore(categories);
  const verdict: Verdict = allBare ? 'GO' : (overallScore! >= 72 ? 'GO' : 'FIX');

  const diagnosis: DiagnosisResult = {
    overallScore,
    verdict,
    categories
  };

  // Extract Beauty DNA if computed, otherwise null
  let dna = null;
  if (!hasExistingDna && result.beauty_dna) {
    const rawDna = result.beauty_dna;
    dna = {
      faceShape: rawDna.faceShape || 'Oval',
      colorSeason: rawDna.colorSeason || 'Warm Autumn',
      skinToneHex: rawDna.skinToneHex || '#C9956A',
      eyeShape: rawDna.eyeShape || 'Almond Eye',
      browShape: rawDna.browShape || 'Soft Arch',
      browSymmetryPct: Math.min(100, Math.max(70, Math.round(rawDna.browSymmetryPct ?? 85))),
      lashProfile: rawDna.lashProfile || 'Long & Sparse',
      archetype: rawDna.archetype || 'The Soft Romantic',
      archetypeDescription: rawDna.archetypeDescription || '',
      lipProfile: 'Warm Satin', // Fallbacks matching dna.ts defaults
      blushProfile: 'Peach Flush',
      foundationShade: '',
    };
  }

  // Extract coaching compliment
  const compliment = result.coaching?.compliment ?? (
    allBare 
      ? 'Gorgeous bare skin canvas! Focus on keeping your natural skin barrier protected and your brows framed to look effortlessly glowing.'
      : 'Good effort — the improvements below will make a noticeable difference today.'
  );

  const coaching: CoachingResult = {
    compliment: compliment.trim(),
    verdict
  };

  return {
    diagnosis,
    dna,
    coaching
  };
}
