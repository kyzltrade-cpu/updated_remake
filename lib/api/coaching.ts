import type { GetCoachingRequest, CoachingResult } from './types';
import { hasNimKey, nimText } from './nim';
import { getOnboardingData } from '@/lib/onboarding-store';
import { loadGloDraft } from '@/lib/glo-profile';

async function buildPrompt(request: GetCoachingRequest): Promise<string> {
  const { diagnosis } = request;
  const [onboarding, glo] = await Promise.all([getOnboardingData(), loadGloDraft()]);

  const categoryLines = diagnosis.categories
    .map(c => `  - ${c.name}: ${c.score}/100${c.isPriority ? ' (priority)' : ''}`)
    .join('\n');

  const skinCtx = [
    glo.skin_type ? `Skin type: ${glo.skin_type}` : null,
    glo.allergies?.length ? `Allergies/sensitivities: ${glo.allergies.join(', ')}` : null,
    glo.foundation_pain ? `Foundation challenge: ${glo.foundation_pain}` : null,
  ].filter(Boolean).join('\n');

  return `
You are a warm, expert makeup coach. A user just scanned their makeup look.

User profile:
- Skill level: ${onboarding.skillLevel ?? 'unknown'}
- Practice frequency: ${onboarding.practiceFrequency ?? 'unknown'}
- Priority focus: ${onboarding.priorityCategory ?? 'unknown'}${skinCtx ? `\n${skinCtx}` : ''}

Scan results:
- Overall score: ${diagnosis.overallScore}/100
- Verdict: ${diagnosis.verdict}
- Category scores:
${categoryLines}

Write a single short coaching compliment (1-2 sentences max). Rules:
- Warm, encouraging, expert tone — like a personal beauty editor
- Reference their specific scores or focus area if relevant
- Calibrate language to skill level (gentler for Beginner, more technical for Advanced)
- Never generic. Make it feel personal.
- Return ONLY the compliment text, no JSON, no quotes, no extra text.
`.trim();
}

/**
 * Sanity check post-processor to ensure any AI-hallucinated or rounded scores
 * mentioned in the coaching compliment text perfectly align with the actual score.
 */
function sanitizeCompliment(compliment: string, score: number): string {
  let result = compliment;
  
  // 1. Standard pattern corrections (e.g., "score of 82" or "rating of 82")
  result = result.replace(/score of \d+(\/100)?/gi, `score of ${score}`);
  result = result.replace(/rating of \d+(\/100)?/gi, `rating of ${score}`);
  
  // 2. Scan and correct any standalone 2-digit number close to the score (+/- 3 points)
  // to avoid LLM typo shifts or minor math rounding hallucinations.
  result = result.replace(/\b\d+\b/g, (match) => {
    const num = parseInt(match, 10);
    if (!isNaN(num) && Math.abs(num - score) <= 3) {
      return String(score);
    }
    return match;
  });
  
  return result;
}

function fallbackCompliment(score: number): string {
  if (score >= 90) return 'Impeccable. Every category is working together — this is camera-ready.';
  if (score >= 80) return 'Beautiful technique. A few small refinements will take this to flawless.';
  if (score >= 70) return 'Solid foundation. Focus on the highlighted areas and you\'ll see a big shift.';
  return 'Good effort — the improvements below will make a noticeable difference today.';
}

export async function getCoaching(request: GetCoachingRequest): Promise<CoachingResult> {
  const score = request.diagnosis.overallScore;
  if (hasNimKey()) {
    try {
      const prompt = await buildPrompt(request);
      const compliment = await nimText(prompt);
      if (typeof compliment === 'string') {
        return {
          compliment: sanitizeCompliment(compliment.trim(), score),
          verdict: request.diagnosis.verdict,
        };
      }
    } catch (e) {
      console.warn('[Coaching] NIM failed, using fallback:', e);
    }
  }

  return {
    compliment: fallbackCompliment(score),
    verdict: request.diagnosis.verdict,
  };
}
