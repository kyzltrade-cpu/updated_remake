export type SixCategory =
  | 'Blending'
  | 'Symmetry'
  | 'Colour Harmony'
  | 'Coverage'
  | 'Cleanliness'
  | 'Brow Framing';

export type Verdict = 'GO' | 'FIX';

export interface CategoryAnalysis {
  name: SixCategory;
  weight: number;
  score: number;
  isPriority: boolean;
  tip: string;
  tipShort: string;
  tutorialQuery: string;
}

export interface DiagnosisResult {
  overallScore: number;
  verdict: Verdict;
  categories: CategoryAnalysis[];
  skinToneHex?: string;
  faceShape?: string;
}

export interface CoachingResult {
  compliment: string;
  verdict: Verdict;
}

export interface AnalyzeImageRequest {
  imageUri: string;
  userId?: string;
  priorityCategory?: string;
  skillLevel?: string;
}

export interface GetCoachingRequest {
  diagnosis: DiagnosisResult;
  userId?: string;
}

export interface DiagnosisProvider {
  analyze(request: AnalyzeImageRequest): Promise<DiagnosisResult>;
}

export interface CoachingProvider {
  getSuggestions(request: GetCoachingRequest): Promise<CoachingResult>;
}
