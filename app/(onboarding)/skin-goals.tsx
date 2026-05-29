import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';
import { ob } from '@/components/onboarding-styles';
import { OnboardingHeader } from '@/components/onboarding-header';
import { GlassButton } from '@/components/glass-button';
import { saveGloField } from '@/lib/glo-profile';

// Makeup-focused goals (not skincare)
const GOALS = [
  'Full Coverage',
  'Long-Wear',
  'Natural Glow',
  'Glass Skin',
  'SPF Protection',
  'Buildable Finish',
];

export default function SkinGoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (goal: string) => {
    Haptics.selectionAsync();
    setSelected(prev => {
      if (prev.includes(goal)) return prev.filter(g => g !== goal);
      if (prev.length >= 3) return prev;
      return [...prev, goal];
    });
  };

  const handleContinue = async () => {
    await saveGloField({ skin_goals: selected });
    router.push('/(onboarding)/skin-type');
  };

  return (
    <View style={[ob.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={5} total={11} onBack={() => router.back()} />

      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={ob.header}>
        <Text style={ob.title}>What does your{'\n'}makeup need to do?</Text>
        <Text style={ob.sub}>Pick up to 3 — we prioritise these in your recommendations.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.chips}>
        {GOALS.map((goal, i) => {
          const active = selected.includes(goal);
          const maxed = selected.length >= 3 && !active;
          return (
            <Animated.View key={goal} entering={FadeInUp.delay(200 + i * 40).duration(380)}>
              <Pressable
                onPress={() => !maxed && toggle(goal)}
                style={[
                  styles.chip,
                  active && styles.chipActive,
                  maxed && styles.chipMuted,
                ]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{goal}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>

      <View style={ob.spacer} />

      <Animated.View entering={FadeInUp.delay(440).duration(500)}>
        <GlassButton
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          style={styles.cta}
          disabled={selected.length === 0}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 50,
    backgroundColor: tokens.colors.white,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
  },
  chipActive: {
    backgroundColor: tokens.colors.pinkDeep,
    borderColor: tokens.colors.pinkDeep,
  },
  chipMuted: { opacity: 0.35 },
  chipText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '500',
    color: tokens.colors.text,
  },
  chipTextActive: {
    color: tokens.colors.white,
  },
  cta: { width: '100%' },
});
