import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { OnboardingHeader } from '@/components/onboarding-header';
import { saveGloField } from '@/lib/glo-profile';
import * as Haptics from 'expo-haptics';


const OPTIONS = [
  {
    id: 'warm',
    label: 'Warm',
    desc: 'Golden, peachy, or yellow hues',
    swatchOuter: '#D4A96A',
    swatchInner: '#C9956A',
  },
  {
    id: 'cool',
    label: 'Cool',
    desc: 'Pink, rosy, or bluish hues',
    swatchOuter: '#B8A8C8',
    swatchInner: '#A090B8',
  },
  {
    id: 'no_idea',
    label: 'Not sure',
    desc: 'Your photo will reveal the truth',
    swatchOuter: tokens.colors.border,
    swatchInner: tokens.colors.grayLight,
    isHook: true,
  },
];

export default function ToneGuessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(id);
    await saveGloField({ undertone_guess: id });
    setTimeout(() => router.push('/(onboarding)/style-archetype'), 600);
  };

  return (
    <View style={styles.root}>
      <OnboardingHeader step={9} total={11} onBack={() => router.back()} />

      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={styles.header}>
        <Text style={styles.title}>What's your{'\n'}skin undertone?</Text>
        <Text style={styles.sub}>Tap to select — we'll move on automatically.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.options}>
        {OPTIONS.map((opt, i) => {
          const active = selected === opt.id;
          return (
            <Animated.View key={opt.id} entering={FadeInUp.delay(200 + i * 60).duration(400)}>
              <Pressable
                onPress={() => handleSelect(opt.id)}
                style={({ pressed }) => [
                  styles.card,
                  active && styles.cardActive,
                  opt.isHook && styles.cardHook,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={[styles.swatch, { backgroundColor: opt.swatchOuter }]}>
                  <View style={[styles.swatchInner, { backgroundColor: opt.swatchInner }]} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.label, active && styles.labelActive, opt.isHook && styles.labelHook]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.desc, opt.isHook && styles.descHook]}>{opt.desc}</Text>
                </View>
                {active && <View style={styles.radioDot} />}
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>

      {selected !== null && (
        <Animated.Text entering={FadeIn.duration(250)} style={styles.confirm}>
          ✓ Got it
        </Animated.Text>
      )}

      <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.footnote}>
        <Text style={styles.footnoteText}>
          35% of people pick "Not sure" — your scan will confirm it.
        </Text>
      </Animated.View>

      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.beige, paddingHorizontal: 28 },
  header: { marginBottom: 28 },
  step: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '500', letterSpacing: 1.2, textTransform: 'uppercase', color: tokens.colors.grayLight, marginBottom: 14 },
  title: { fontFamily: tokens.fonts.serif, fontSize: 32, fontWeight: '400', color: tokens.colors.text, lineHeight: 42, marginBottom: 8 },
  sub: { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '300', color: tokens.colors.gray, lineHeight: 22 },
  options: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: tokens.colors.white, borderRadius: 14, paddingVertical: 18, paddingHorizontal: 18, borderWidth: 1.5, borderColor: tokens.colors.border },
  cardActive: { borderColor: tokens.colors.pinkDeep, backgroundColor: tokens.colors.pinkLight },
  cardHook: { borderColor: tokens.colors.goldSoft, backgroundColor: tokens.colors.ivory },
  cardPressed: { opacity: 0.9 },
  swatch: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  swatchInner: { width: 26, height: 26, borderRadius: 13 },
  cardBody: { flex: 1, gap: 2 },
  label: { fontFamily: tokens.fonts.regular, fontSize: 16, fontWeight: '500', color: tokens.colors.text },
  labelActive: { color: tokens.colors.pinkRich },
  labelHook: { color: tokens.colors.gold },
  desc: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '300', color: tokens.colors.gray, lineHeight: 18 },
  descHook: { color: tokens.colors.goldSoft, fontStyle: 'italic' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: tokens.colors.pinkDeep, flexShrink: 0 },
  footnote: { marginTop: 20 },
  footnoteText: { fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '300', color: tokens.colors.grayLight, lineHeight: 18, fontStyle: 'italic' },
  spacer: { flex: 1, minHeight: 24 },
  confirm: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '500', color: tokens.colors.pinkDeep, textAlign: 'center', marginTop: 16, letterSpacing: 0.2 },
});
