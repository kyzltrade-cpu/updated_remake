import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_KEYS = {
  name: '@remake_user_name',
  skillLevel: '@remake_skill_level',
  priorityCategory: '@remake_priority_category',
  practiceFrequency: '@remake_practice_frequency',
  dnaRevealSeen: '@remake_dna_reveal_seen',
} as const;

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type PriorityCategory = 'Blending' | 'Symmetry' | 'Colour Harmony' | 'Coverage' | 'Brow Framing';
export type PracticeFrequency = 'daily' | '4-5x' | '2-3x' | 'occasionally';

export interface OnboardingData {
  name: string;
  skillLevel: SkillLevel;
  priorityCategory: PriorityCategory;
  practiceFrequency: PracticeFrequency;
}

export async function saveOnboardingField<K extends keyof typeof ONBOARDING_KEYS>(
  field: K,
  value: string
) {
  await AsyncStorage.setItem(ONBOARDING_KEYS[field], value);
}

export async function getOnboardingData(): Promise<Partial<OnboardingData>> {
  const [name, skillLevel, priorityCategory, practiceFrequency] = await AsyncStorage.multiGet([
    ONBOARDING_KEYS.name,
    ONBOARDING_KEYS.skillLevel,
    ONBOARDING_KEYS.priorityCategory,
    ONBOARDING_KEYS.practiceFrequency,
  ]);
  return {
    name: name[1] ?? undefined,
    skillLevel: (skillLevel[1] as SkillLevel) ?? undefined,
    priorityCategory: (priorityCategory[1] as PriorityCategory) ?? undefined,
    practiceFrequency: (practiceFrequency[1] as PracticeFrequency) ?? undefined,
  };
}
