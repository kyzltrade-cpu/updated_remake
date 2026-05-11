/**
 * Coaching API - GPT-4o mini for AI-powered makeup suggestions
 *
 * Uses OpenAI's GPT-4o mini for generating personalized coaching
 * based on the diagnosis results.
 *
 * TODO: Replace with your OpenAI credentials
 */

import type { GetCoachingRequest, CoachingResult, CoachingProvider } from './types';
import { withNimRateLimit } from './rateLimiter';

const GPT4O_MINI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

class GPT4oMiniCoachingProvider implements CoachingProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  }

  async getSuggestions(request: GetCoachingRequest): Promise<CoachingResult> {
    const { diagnosis } = request;

    // Build prompt for GPT-4o mini
    const prompt = this.buildCoachingPrompt(diagnosis);

    // TODO: Implement actual GPT-4o mini API call with rate limiting
    if (this.apiKey) {
      const callApi = withNimRateLimit(async () => {
        const response = await fetch(GPT4O_MINI_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500,
          }),
        });
        if (!response.ok) throw { status: response.status, headers: response.headers };
        const data = await response.json();
        return this.parseCoachingResponse(data);
      });
      return callApi();
    }

    // Placeholder response
    return this.getPlaceholderCoaching(diagnosis);
  }

  private buildCoachingPrompt(diagnosis: GetCoachingRequest['diagnosis']): string {
    const categoryScores = diagnosis.categories
      .map(c => `- ${c.name}: ${c.score}/100 (${c.description})`)
      .join('\n');

    return `As a makeup artist AI coach, analyze this makeup application and provide 3 specific, actionable suggestions for improvement.

Overall Score: ${diagnosis.overallScore}/100

Category Breakdown:
${categoryScores}

Provide exactly 3 suggestions that are:
- Specific to the areas with lowest scores
- Actionable (things they can actually do differently)
- Encouraging but honest

Format your response as JSON:
{
  "suggestions": [
    { "text": "full suggestion text", "emphasis": "key phrase", "category": "category name" }
  ],
  "compliment": "a brief genuine compliment about what's working well"
}`;
  }

  private getPlaceholderCoaching(diagnosis: GetCoachingRequest['diagnosis']): CoachingResult {
    const complimentKey = diagnosis.overallScore >= 90 ? 'flawless'
      : diagnosis.overallScore >= 80 ? 'strong'
      : 'refine';

    const compliments: Record<string, string> = {
      flawless: 'Absolutely stunning execution — your makeup artistry is impeccable and camera-ready.',
      strong: 'Beautiful work with excellent technique — subtle refinements will elevate it further.',
      refine: 'Great foundation to build on — targeted adjustments will make your look truly shine.',
    };

    // Generate suggestions based on lowest scoring categories
    const sortedCategories = [...diagnosis.categories].sort((a, b) => a.score - b.score);
    const lowestCategories = sortedCategories.slice(0, 3);

    const suggestionTemplates: Record<string, string[]> = {
      'Complexion': [
        'Blend your base along the jawline — the transition should be invisible in natural light.',
        'Build foundation coverage in thin layers for a more natural, buildable finish.',
        'Set your foundation with a light dusting to reduce shine while keeping the finish natural.',
      ],
      'Eyes': [
        'Soften the outer-V eyeshadow edge with a clean brush for a seamless diffusion.',
        'Connect your wing liner to the inner corner for a more cohesive look.',
        'Add a transition shade to deepen the crease for more dimension.',
      ],
      'Lips': [
        'Perfect your lip line by using a matching lip liner before applying color.',
        'Blot and re-apply lipstick for longer-lasting color payoff.',
        'Shape your lips with concealer around the edges for a cleaner application.',
      ],
      'Sculpt & Glow': [
        'Bring blush placement slightly higher toward the temples to lift the face shape.',
        'Warm up your complexion with bronzer in the hollows of your cheeks for natural dimension.',
        'Tap highlighter onto the high points with your fingertip for a dewy finish.',
      ],
    };

    const suggestions = lowestCategories.map((cat, i) => {
      const templates = suggestionTemplates[cat.name] || suggestionTemplates['Complexion'];
      const template = templates[i % templates.length];
      const emphasis = template.split('—')[0].trim();
      return { text: template, emphasis, category: cat.name };
    });

    return {
      suggestions,
      compliment: compliments[complimentKey],
    };
  }
}

// Singleton instance
let coachingProvider: CoachingProvider | null = null;

export function getCoachingProvider(): CoachingProvider {
  if (!coachingProvider) {
    coachingProvider = new GPT4oMiniCoachingProvider();
  }
  return coachingProvider;
}

// Convenience function
export async function getCoaching(request: GetCoachingRequest): Promise<CoachingResult> {
  const provider = getCoachingProvider();
  return provider.getSuggestions(request);
}