import type { GetCoachingRequest, CoachingResult, CoachingProvider } from './types';

class CoachingProviderImpl implements CoachingProvider {
  async getSuggestions(request: GetCoachingRequest): Promise<CoachingResult> {
    const { diagnosis } = request;
    const { verdict, overallScore } = diagnosis;

    const compliment =
      overallScore >= 90
        ? 'Impeccable. Every category is working together — this is camera-ready.'
        : overallScore >= 80
          ? 'Beautiful technique. A few small refinements will take this to flawless.'
          : overallScore >= 70
            ? 'Solid foundation. Focus on the highlighted areas and you\'ll see a big shift.'
            : 'Good effort — the improvements below will make a noticeable difference today.';

    return { compliment, verdict };
  }
}

let provider: CoachingProvider | null = null;

export function getCoachingProvider(): CoachingProvider {
  if (!provider) provider = new CoachingProviderImpl();
  return provider;
}

export async function getCoaching(request: GetCoachingRequest): Promise<CoachingResult> {
  return getCoachingProvider().getSuggestions(request);
}
