import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import { saveGloField } from '@/lib/glo-profile';
import * as Haptics from 'expo-haptics';

const STEP = 3;
const TOTAL = 9;

const GOALS = [
  'Acne Control',
  'Anti-Redness',
  'Anti-Aging',
  'Pore Refining',
  'Glow Boost',
  'Glass Skin',
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
    <View style={styles.root}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(STEP / TOTAL) * 100}%` as `${number}%` }]} />
      </View>
      <Pressable onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 10 }]}>
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>

      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.step}>{STEP} of {TOTAL}</Text>
        <Text style={styles.title}>What does your{'\n'}skin want most?</Text>
        <Text style={styles.sub}>Pick up to 3</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.chips}>
        {GOALS.map((goal, i) => {
          const active = selected.includes(goal);
          const maxed = selected.length >= 3 && !active;
          return (
            <Animated.View key={goal} entering={FadeInUp.delay(200 + i * 40).duration(380)}>
              <Pressable
                onPress={() => !maxed && toggle(goal)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  maxed && styles.chipMuted,
                  pressed && styles.chipPressed,
                ]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{goal}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>

      <View style={styles.spacer} />

      <Animated.View entering={FadeInUp.delay(440).duration(500)} style={{ paddingBottom: insets.bottom + 32 }}>
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
  root: { flex: 1, backgroundColor: tokens.colors.beige, paddingHorizontal: 28 },
  track: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: tokens.colors.border },
  fill: { height: '100%', backgroundColor: tokens.colors.pinkDeep },
  header: { marginBottom: 32 },
  step: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '500', letterSpacing: 1.2, textTransform: 'uppercase', color: tokens.colors.grayLight, marginBottom: 14 },
  title: { fontFamily: tokens.fonts.serif, fontSize: 32, fontWeight: '400', color: tokens.colors.text, lineHeight: 42, marginBottom: 8 },
  sub: { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '300', color: tokens.colors.gray },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 13, paddingHorizontal: 22, borderRadius: 50, backgroundColor: tokens.colors.white, borderWidth: 1.5, borderColor: tokens.colors.border },
  chipActive: { backgroundColor: tokens.colors.pinkDeep, borderColor: tokens.colors.pinkDeep },
  chipMuted: { opacity: 0.35 },
  chipPressed: { opacity: 0.85 },
  chipText: { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '400', color: tokens.colors.text },
  chipTextActive: { color: tokens.colors.white, fontWeight: '500' },
  spacer: { flex: 1, minHeight: 24 },
  cta: { width: '100%' },
  backBtn: { position: 'absolute', left: 20, zIndex: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: tokens.colors.white, borderWidth: 1, borderColor: tokens.colors.border, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 20, color: tokens.colors.text, lineHeight: 22 },
});
