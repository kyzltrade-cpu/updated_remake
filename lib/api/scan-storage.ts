import { createClient } from '@/lib/supabase';
import type { DiagnosisResult, CoachingResult } from '@/lib/api/types';
import type { DnaResult } from '@/lib/api/dna';

export interface ScanRecord {
  id: string;
  overall_score: number;
  verdict: 'GO' | 'FIX';
  coaching_compliment: string;
  created_at: string;
}

export async function saveScan(params: {
  userId: string;
  imageUri: string;
  diagnosis: DiagnosisResult;
  coaching: CoachingResult;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('scans').insert({
    user_id: params.userId,
    image_url: params.imageUri,
    overall_score: params.diagnosis.overallScore,
    category_scores: params.diagnosis.categories,
    suggestions: params.diagnosis.categories.map(c => c.tip),
    verdict: params.diagnosis.verdict,
    coaching_compliment: params.coaching.compliment,
  });
  if (error) console.warn('[scan-storage] saveScan failed:', error.message);
}

export async function getLastScan(userId: string): Promise<ScanRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scans')
    .select('id, overall_score, verdict, coaching_compliment, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) console.warn('[scan-storage] getLastScan failed:', error.message);
  if (data) return data;

  // Mock fallback — gives the delta arrow something to compare against
  return {
    id: 'mock-last',
    overall_score: 71,
    verdict: 'GO',
    coaching_compliment: '',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export async function getScanHistory(userId: string, limit = 10): Promise<ScanRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scans')
    .select('id, overall_score, verdict, coaching_compliment, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) console.warn('[scan-storage] getScanHistory failed:', error.message);

  // Return real data if exists, otherwise return mock data
  if (data && data.length > 0) return data;

  // Mock data for demo
  const now = new Date();
  const mockScans: ScanRecord[] = [];
  const compliments = [
    'Beautiful technique. A few small refinements will take this to flawless.',
    'Solid foundation. Focus on the highlighted areas and you\'ll see a big shift.',
    'Impeccable. Every category is working together — this is camera-ready.',
    'Good effort — the improvements below will make a noticeable difference today.',
  ];

  for (let i = 0; i < 5; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 3));
    mockScans.push({
      id: `mock-scan-${i}`,
      overall_score: 72 + Math.floor(Math.random() * 22),
      verdict: Math.random() > 0.3 ? 'GO' : 'FIX',
      coaching_compliment: compliments[Math.floor(Math.random() * compliments.length)],
      created_at: date.toISOString(),
    });
  }

  return mockScans;
}

export async function getScanStats(userId: string): Promise<{
  totalScans: number;
  avgScore: number;
  currentStreak: number;
}> {
  const supabase = createClient();

  const [scansRes, streakRes] = await Promise.all([
    supabase
      .from('scans')
      .select('overall_score', { count: 'exact' })
      .eq('user_id', userId),
    supabase
      .from('streaks')
      .select('current_streak')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  const scores = scansRes.data?.map(r => r.overall_score as number) ?? [];
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  // If we have real data, return it
  if ((scansRes.count ?? 0) > 0) {
    return {
      totalScans: scansRes.count ?? 0,
      avgScore,
      currentStreak: streakRes.data?.current_streak ?? 0,
    };
  }

  // Mock data for demo
  return {
    totalScans: 5,
    avgScore: 82,
    currentStreak: 3,
  };
}

export async function saveDnaResult(userId: string, dna: DnaResult): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ dna_result: dna as unknown as Record<string, unknown> })
    .eq('id', userId);
  if (error) console.warn('[scan-storage] saveDnaResult failed:', error.message);
}
