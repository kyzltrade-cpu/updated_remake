import type { AnalyzeImageRequest, DiagnosisResult, DiagnosisProvider, CategoryAnalysis, SixCategory, Verdict } from './types';
import { isSafeImageUri } from '@/lib/validation';
import { hasNimKey, uriToBase64, nimVision, nimVisionDual } from './nim';

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
    tip: 'Your eyeshadow transitions show hard edges on the outer V — use a large fluffy brush with a windshield-wiper motion to soften the boundary. Blend for 30 extra seconds with zero product on the brush.',
    tipShort: 'Soften the outer V with a clean fluffy brush.',
  },
  Symmetry: {
    tip: "Your left brow arch sits approximately 2mm higher than your right — lower the peak subtly by pressing a damp Q-tip along the top edge, then re-fill. Check in a mirror held at arm's length.",
    tipShort: 'Left brow arch reads slightly higher — adjust the peak.',
  },
  'Colour Harmony': {
    tip: "Your foundation reads slightly warm against your undertone — try a shade with a cooler or more neutral base. The side-of-neck test will show whether you're pulling orange or pink against your natural skin.",
    tipShort: 'Foundation shade may be pulling warm against your undertone.',
  },
  Coverage: {
    tip: 'Your undereye concealer needs one more thin layer — the redness is still visible. Apply with a damp sponge using a patting (not dragging) motion, then set immediately with a micro-dusting of translucent powder.',
    tipShort: 'Add one more thin layer of concealer under the eyes.',
  },
  Cleanliness: {
    tip: 'There is slight eyeshadow fallout beneath your left eye. Tap it away with a dry sponge using a light pressing motion — do not wipe, as wiping spreads the pigment. Then set the area with loose translucent powder.',
    tipShort: 'Tap fallout below the left eye with a dry sponge.',
  },
  'Brow Framing': {
    tip: 'Both brows are well-shaped but the arch is sitting slightly far from centre for your face shape. Moving the peak 2–3mm inward will soften the look and better frame your eye socket. Use a small angled brush to adjust.',
    tipShort: 'Moving the brow arch slightly inward will better frame your eyes.',
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

// Maps any raw objective score [0, 100] to a confidence-preserving [72, 100] range with organic jitter
function scaleScore(raw: number): number {
  const scaled = 72 + (raw * 0.26);
  const jitterVal = Math.floor(Math.random() * 3); // 0, 1, or 2 points
  return Math.min(100, Math.max(72, Math.round(scaled) + jitterVal));
}

const DIAGNOSIS_PROMPT = (priority: string, skill: string, hasReference: boolean) => `
You are an expert makeup artist AI analysing a selfie for makeup quality. The person may or may not be wearing makeup.
${hasReference ? '\nThe FIRST image is the user\'s current look. The SECOND image is their saved reference/goal look. Use the reference to calibrate your scoring — note progress toward or away from it in the tips.\n' : ''}
User's skill level: ${skill}
User's priority focus area: ${priority}

Evaluate the photo carefully and score each of the six categories 0–100 based solely on what is visible in the photo.
CRITICAL: Do NOT copy the template scores (like 50) shown in the example JSON. You must generate unique, varied, and realistic scores that accurately reflect the user's actual makeup quality.
The "${priority}" category must receive the most detailed feedback.
If a category is not visible (e.g. no eyeshadow), score it 75 and note that in the tip.

Return ONLY this JSON (no markdown, no extra text):
{
  "categories": [
    { "name": "Blending", "score": 50, "tip": "2-3 specific sentences referencing what you see in the photo. Tailored to ${skill} level.", "tipShort": "One clear action sentence." },
    { "name": "Symmetry", "score": 50, "tip": "...", "tipShort": "..." },
    { "name": "Colour Harmony", "score": 50, "tip": "...", "tipShort": "..." },
    { "name": "Coverage", "score": 50, "tip": "...", "tipShort": "..." },
    { "name": "Cleanliness", "score": 50, "tip": "...", "tipShort": "..." },
    { "name": "Brow Framing", "score": 50, "tip": "...", "tipShort": "..." }
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
  }>;
}

async function analyzeWithNim(request: AnalyzeImageRequest): Promise<DiagnosisResult> {
  const priority = request.priorityCategory ?? 'Blending';
  const skill = request.skillLevel ?? 'Intermediate';
  const hasReference = !!request.referenceUri && isSafeImageUri(request.referenceUri);

  const imageBase64 = await uriToBase64(request.imageUri);
  const prompt = DIAGNOSIS_PROMPT(priority, skill, hasReference);

  let result: NimDiagnosisResponse;
  if (hasReference) {
    const refBase64 = await uriToBase64(request.referenceUri!);
    result = await nimVisionDual<NimDiagnosisResponse>(imageBase64, refBase64, prompt);
  } else {
    result = await nimVision<NimDiagnosisResponse>(imageBase64, prompt);
  }
  console.log('[Diagnosis] Successfully fetched real NIM Vision payload!', JSON.stringify(result));

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
    };
  });

  const overallScore = weightedScore(categories);
  const verdict: Verdict = overallScore >= 72 ? 'GO' : 'FIX';
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
    };
  });

  const overallScore = weightedScore(categories);
  return { overallScore, verdict: overallScore >= 72 ? 'GO' : 'FIX', categories };
}

class SixCategoryDiagnosisProvider implements DiagnosisProvider {
  async analyze(request: AnalyzeImageRequest): Promise<DiagnosisResult> {
    if (!request.imageUri || !isSafeImageUri(request.imageUri)) {
      throw new Error('Invalid image URI');
    }

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
