import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import * as Haptics from 'expo-haptics';
import { saveGloField } from '@/lib/glo-profile';

const GOALS = [
  'Acne Control',
  'Anti-Redness',
  'Anti-Aging',
  'Pore Refining',
  'Glow Boost',
  'Glass Skin',
];

const PROGRESS = 1 / 7;

export default function SkinGoalsScreen() {
  const router = useRouter();
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
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${PROGRESS * 100}%` }]} />
      </View>

      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
        <Text style={styles.step}>3 of 9</Text>
        <Text style={styles.title}>What does your{'\n'}skin want most?</Text>
        <Text style={styles.sub}>Pick up to 3</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(260).duration(600)} style={styles.chips}>
        {GOALS.map((goal) => {
          const active = selected.includes(goal);
          const maxed = selected.length >= 3 && !active;
          return (
            <Pressable
              key={goal}
              onPress={() => !maxed && toggle(goal)}
              style={[styles.chip, active && styles.chipActive, maxed && styles.chipMuted]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {goal}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(420).duration(600)} style={styles.bottom}>
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
  container: {
    flex: 1,
    backgroundColor: tokens.colors.beige,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 50,
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: tokens.colors.border,
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colors.pinkDeep,
  },
  header: {
    alignItems: 'center',
    marginBottom: 44,
    paddingTop: 10,
  },
  step: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    letterSpacing: 0.16,
    textTransform: 'uppercase',
    color: tokens.colors.grayLight,
    fontWeight: '500',
    marginBottom: 18,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 30,
    fontWeight: '400',
    color: tokens.colors.text,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 10,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '300',
    color: tokens.colors.gray,
  },
  chips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    alignContent: 'center',
  },
  chip: {
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 50,
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  chipActive: {
    backgroundColor: tokens.colors.pinkDeep,
    borderColor: tokens.colors.pinkDeep,
  },
  chipMuted: {
    opacity: 0.35,
  },
  chipText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: tokens.colors.text,
  },
  chipTextActive: {
    color: tokens.colors.white,
    fontWeight: '500',
  },
  bottom: {
    alignItems: 'center',
  },
  cta: {
    width: '100%',
  },
});
