import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import { OnboardingHeader } from '@/components/onboarding-header';
import { saveOnboardingField, type PriorityCategory } from '@/lib/onboarding-store';
import * as Haptics from 'expo-haptics';


const OPTIONS: { value: PriorityCategory; label: string; desc: string }[] = [
  { value: 'Blending',       label: 'Blending',        desc: 'Eyeshadow transitions and gradient edges' },
  { value: 'Symmetry',       label: 'Symmetry',         desc: 'Matching both sides — eyes, brows, lips' },
  { value: 'Colour Harmony', label: 'Colour Harmony',   desc: 'Choosing shades that work with my skin tone' },
  { value: 'Coverage',       label: 'Coverage',         desc: 'Even foundation and concealer application' },
  { value: 'Brow Shaping',   label: 'Brow Shaping',     desc: 'Shape, symmetry, and placement' },
];

export default function PainPointScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<PriorityCategory[]>([]);

  const toggle = (cat: PriorityCategory) => {
    Haptics.selectionAsync();
    setSelected(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await saveOnboardingField('priorityCategory', JSON.stringify(selected));
    router.push('/(onboarding)/frequency');
  };

  return (
    <View style={styles.root}>
      <OnboardingHeader step={2} total={11} onBack={() => router.back()} />

      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={styles.header}>
        <Text style={styles.title}>What do you struggle{'\n'}with most?</Text>
        <Text style={styles.sub}>Pick as many as apply — we'll give these extra attention.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.options}>
        {OPTIONS.map((opt, i) => {
          const active = selected.includes(opt.value);
          return (
            <Animated.View key={opt.value} entering={FadeInUp.delay(200 + i * 50).duration(400)}>
              <Pressable
                onPress={() => toggle(opt.value)}
                style={({ pressed }) => [styles.card, active && styles.cardActive, pressed && styles.cardPressed]}
              >
                <View style={[styles.check, active && styles.checkActive]}>
                  {active && <View style={styles.checkMark} />}
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

      <Animated.View entering={FadeInUp.delay(520).duration(500)} style={{ paddingBottom: insets.bottom + 32 }}>
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
  header: { marginBottom: 28 },
  step: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '500', letterSpacing: 1.2, textTransform: 'uppercase', color: tokens.colors.grayLight, marginBottom: 14 },
  title: { fontFamily: tokens.fonts.serif, fontSize: 32, fontWeight: '400', color: tokens.colors.text, lineHeight: 42, marginBottom: 8 },
  sub: { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '300', color: tokens.colors.gray, lineHeight: 22 },
  options: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: tokens.colors.white, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18, borderWidth: 1.5, borderColor: tokens.colors.border },
  cardActive: { borderColor: tokens.colors.pinkDeep, backgroundColor: tokens.colors.pinkLight },
  cardPressed: { opacity: 0.9 },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: tokens.colors.grayLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  checkActive: { backgroundColor: tokens.colors.pinkDeep, borderColor: tokens.colors.pinkDeep },
  checkMark: { width: 10, height: 6, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: tokens.colors.white, transform: [{ rotate: '-45deg' }, { translateY: -1 }] },
  cardBody: { flex: 1, gap: 2 },
  label: { fontFamily: tokens.fonts.regular, fontSize: 16, fontWeight: '500', color: tokens.colors.text },
  labelActive: { color: tokens.colors.pinkRich },
  desc: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '300', color: tokens.colors.gray, lineHeight: 18 },
  spacer: { flex: 1, minHeight: 24 },
  cta: { width: '100%' },
});
