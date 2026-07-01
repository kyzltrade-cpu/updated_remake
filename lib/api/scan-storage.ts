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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('scans')
    .select('id, overall_score, verdict, coaching_compliment, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) console.warn('[scan-storage] getLastScan failed:', error.message);
  return data ?? null;
}

export async function getScanHistory(userId: string, limit = 10): Promise<ScanRecord[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('scans')
    .select('id, overall_score, verdict, coaching_compliment, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) console.warn('[scan-storage] getScanHistory failed:', error.message);
  return data ?? [];
}

export async function getScanStats(userId: string): Promise<{
  totalScans: number;
  avgScore: number;
  currentStreak: number;
  streakFreezes: number;
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  const [scansRes, streakRes] = await Promise.all([
    supabase
      .from('scans')
      .select('overall_score', { count: 'exact' })
      .eq('user_id', userId),
    supabase
      .from('streaks')
      .select('current_streak, streak_freezes')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  const scores: number[] = (scansRes.data ?? []).map((r: Record<string, number>) => r.overall_score);
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
    : 0;

  return {
    totalScans: scansRes.count ?? 0,
    avgScore,
    currentStreak: streakRes.data?.current_streak ?? 0,
    streakFreezes: streakRes.data?.streak_freezes ?? 2,
  };
}

export async function saveDnaResult(userId: string, dna: DnaResult): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;
  const { error } = await supabase
    .from('profiles')
    .update({ dna_result: dna as unknown as Record<string, unknown> })
    .eq('id', userId);
  if (error) console.warn('[scan-storage] saveDnaResult failed:', error.message);
}

export async function getScanById(scanId: string): Promise<any | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('id', scanId)
    .maybeSingle();
  if (error) console.warn('[scan-storage] getScanById failed:', error.message);
  return data ?? null;
}

export async function useStreakFreeze(userId: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;
  
  try {
    const { data, error } = await supabase.rpc('use_streak_freeze');
    if (error) {
      console.warn('[scan-storage] use_streak_freeze RPC failed:', error.message);
      return false;
    }
    return !!data;
  } catch (e) {
    console.warn('[scan-storage] useStreakFreeze exception:', e);
    return false;
  }
}
