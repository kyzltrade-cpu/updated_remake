// Shared types for AI API responses

export interface DiagnosisResult {
  overallScore: number;
  categories: CategoryScore[];
  imageAnalysis: ImageAnalysis;
}

export interface CategoryScore {
  name: string;
  score: number;
  description: string;
}

export interface ImageAnalysis {
  skinTone: string;
  lighting: string;
  faceDetected: boolean;
  makeupRegions: MakeupRegion[];
}

export interface MakeupRegion {
  region: 'complexion' | 'eyes' | 'lips' | 'sculpt_glow';
  detected: boolean;
  quality: number; // 0-100
  issues: string[];
}

export interface CoachingResult {
  suggestions: CoachingSuggestion[];
  compliment: string;
}

export interface CoachingSuggestion {
  text: string;
  emphasis: string;
  category: string;
}

// API request/response types
export interface AnalyzeImageRequest {
  imageUri: string;
  userId?: string;
}

export interface GetCoachingRequest {
  diagnosis: DiagnosisResult;
  userId?: string;
}

// Placeholder for diagnosis API (replace with actual provider)
export interface DiagnosisProvider {
  analyze(request: AnalyzeImageRequest): Promise<DiagnosisResult>;
}

// Placeholder for coaching API (GPT-4o mini)
export interface CoachingProvider {
  getSuggestions(request: GetCoachingRequest): Promise<CoachingResult>;
}