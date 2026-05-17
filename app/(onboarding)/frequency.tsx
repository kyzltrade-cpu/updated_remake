import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import * as Haptics from 'expo-haptics';

const STEP = 2;
const TOTAL = 9;

const OPTIONS = [
  { id: 'daily',        label: 'Daily',          desc: 'Full look every morning' },
  { id: '4_5_week',     label: '4–5× / week',    desc: 'Most days, with occasional breaks' },
  { id: '2_3_week',     label: '2–3× / week',    desc: 'A few times a week' },
  { id: 'occasionally', label: 'Occasionally',    desc: 'Special occasions or when I feel like it' },
];

export default function FrequencyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem('@remake_practice_frequency', selected);
    router.push('/(onboarding)/skin-goals');
  };

  return (
    <View style={styles.root}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(STEP / TOTAL) * 100}%` as `${number}%` }]} />
      </View>

      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.step}>{STEP} of {TOTAL}</Text>
        <Text style={styles.title}>How often do you{'\n'}do makeup?</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.options}>
        {OPTIONS.map((opt, i) => {
          const active = selected === opt.id;
          return (
            <Animated.View key={opt.id} entering={FadeInUp.delay(200 + i * 50).duration(400)}>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setSelected(opt.id); }}
                style={({ pressed }) => [styles.card, active && styles.cardActive, pressed && styles.cardPressed]}
              >
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <View style={styles.radioDot} />}
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
                  <Text style={styles.desc}>{opt.desc}</Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>

      <View style={styles.spacer} />

      <Animated.View entering={FadeInUp.delay(480).duration(500)} style={{ paddingBottom: insets.bottom + 32 }}>
        <GlassButton
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          style={styles.cta}
          disabled={!selected}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.beige, paddingHorizontal: 28 },
  track: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: tokens.colors.border },
  fill: { height: '100%', backgroundColor: tokens.colors.pinkDeep },
  header: { marginBottom: 28 },
  step: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '500', letterSpacing: 1.2, textTransform: 'uppercase', color: tokens.colors.grayLight, marginBottom: 14 },
  title: { fontFamily: tokens.fonts.serif, fontSize: 32, fontWeight: '400', color: tokens.colors.text, lineHeight: 42 },
  options: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: tokens.colors.white, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18, borderWidth: 1.5, borderColor: tokens.colors.border },
  cardActive: { borderColor: tokens.colors.pinkDeep, backgroundColor: tokens.colors.pinkLight },
  cardPressed: { opacity: 0.9 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: tokens.colors.grayLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  radioActive: { borderColor: tokens.colors.pinkDeep },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: tokens.colors.pinkDeep },
  cardBody: { flex: 1, gap: 2 },
  label: { fontFamily: tokens.fonts.regular, fontSize: 16, fontWeight: '500', color: tokens.colors.text },
  labelActive: { color: tokens.colors.pinkRich },
  desc: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '300', color: tokens.colors.gray, lineHeight: 18 },
  spacer: { flex: 1, minHeight: 24 },
  cta: { width: '100%' },
});
