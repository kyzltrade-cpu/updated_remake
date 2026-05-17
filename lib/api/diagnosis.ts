import type { AnalyzeImageRequest, DiagnosisResult, DiagnosisProvider, CategoryAnalysis, SixCategory, Verdict } from './types';
import { isSafeImageUri } from '@/lib/validation';
import { hasGeminiKey, uriToBase64, geminiVision } from './gemini';

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

const DIAGNOSIS_PROMPT = (priority: string, skill: string) => `
You are an expert makeup artist AI analysing a selfie for makeup quality. The person may or may not be wearing makeup.

User's skill level: ${skill}
User's priority focus area: ${priority}

Score each of the six categories 0–100 based solely on what is visible in the photo.
Give varied, realistic scores. The "${priority}" category must receive the most detailed feedback.
If a category is not visible (e.g. no eyeshadow), score it 75 and note that in the tip.

Return ONLY this JSON (no markdown, no extra text):
{
  "categories": [
    { "name": "Blending", "score": 82, "tip": "2-3 specific sentences referencing what you see. Tailored to ${skill} level.", "tipShort": "One clear action sentence." },
    { "name": "Symmetry", "score": 78, "tip": "...", "tipShort": "..." },
    { "name": "Colour Harmony", "score": 85, "tip": "...", "tipShort": "..." },
    { "name": "Coverage", "score": 71, "tip": "...", "tipShort": "..." },
    { "name": "Cleanliness", "score": 88, "tip": "...", "tipShort": "..." },
    { "name": "Brow Framing", "score": 80, "tip": "...", "tipShort": "..." }
  ]
}

Scoring guide: 90-100 = professional, 75-89 = good, 60-74 = average, 40-59 = needs work, below 40 = major issues.
`.trim();

interface GeminiDiagnosisResponse {
  categories: Array<{
    name: string;
    score: number;
    tip: string;
    tipShort: string;
  }>;
}

async function analyzeWithGemini(request: AnalyzeImageRequest): Promise<DiagnosisResult> {
  const priority = request.priorityCategory ?? 'Blending';
  const skill = request.skillLevel ?? 'Intermediate';

  const imageBase64 = await uriToBase64(request.imageUri);
  const result = await geminiVision<GeminiDiagnosisResponse>(
    imageBase64,
    DIAGNOSIS_PROMPT(priority, skill),
  );

  const categories: CategoryAnalysis[] = (Object.keys(CATEGORY_WEIGHTS) as SixCategory[]).map(name => {
    const found = result.categories.find(c => c.name === name);
    const score = found
      ? Math.min(100, Math.max(0, Math.round(found.score)))
      : jitter(78, 18);
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
      score: jitter(78, 18),
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

    if (hasGeminiKey()) {
      try {
        return await analyzeWithGemini(request);
      } catch (e) {
        console.warn('[Diagnosis] Gemini failed, using mock:', e);
      }
    }

    // Mock fallback — simulated delay
    await new Promise(r => setTimeout(r, 3000));
    return mockAnalyze(request);
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
