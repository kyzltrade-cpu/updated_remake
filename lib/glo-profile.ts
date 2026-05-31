import AsyncStorage from '@react-native-async-storage/async-storage';

export const GLO_PROFILE_KEY = '@glo_profile_draft';

export interface GloProfileDraft {
  skin_goals: string[];
  skin_type: string;
  allergies: string[];
  ethics: string[];
  foundation_pain: string;
  usual_brand: string;
  undertone_guess: string;
  vibe_picks: string[];
  bare_photo_uri: string;
  goals: string[];
  skill: string;
  foundation_struggle: string;
  pain_points: string[];
  // Gemini Vision results
  undertone: string;
  face_shape: string;
  skin_hex: string;
  colour_season: string;
  archetype: string;
}

export async function saveGloField(data: Partial<GloProfileDraft>): Promise<void> {
  const existing = await loadGloDraft();
  await AsyncStorage.setItem(GLO_PROFILE_KEY, JSON.stringify({ ...existing, ...data }));
}

export async function loadGloDraft(): Promise<Partial<GloProfileDraft>> {
  const raw = await AsyncStorage.getItem(GLO_PROFILE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Partial<GloProfileDraft>;
  } catch {
    return {};
  }
}

export async function clearGloDraft(): Promise<void> {
  await AsyncStorage.removeItem(GLO_PROFILE_KEY);
}
