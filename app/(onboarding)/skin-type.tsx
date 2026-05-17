import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { OnboardingHeader } from '@/components/onboarding-header';
import { saveGloField } from '@/lib/glo-profile';
import * as Haptics from 'expo-haptics';


const TYPES = [
  { id: 'normal',      label: 'Normal',      desc: 'Balanced, rarely breaks out' },
  { id: 'oily',        label: 'Oily',        desc: 'Shiny by mid-morning' },
  { id: 'dry',         label: 'Dry',         desc: 'Tight, sometimes flaky' },
  { id: 'combination', label: 'Combination', desc: 'Oily T-zone, dry cheeks' },
  { id: 'sensitive',   label: 'Sensitive',   desc: 'Reacts easily, prone to redness' },
] as const;

export default function SkinTypeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(id);
    await saveGloField({ skin_type: id });
    setTimeout(() => router.push('/(onboarding)/allergies'), 600);
  };

  return (
    <View style={styles.root}>
      <OnboardingHeader step={5} total={11} onBack={() => router.back()} />

      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={styles.header}>
        <Text style={styles.title}>How does your skin{'\n'}feel by noon?</Text>
        <Text style={styles.sub}>Tap to select — we'll move on automatically.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.options}>
        {TYPES.map((type, i) => {
          const active = selected === type.id;
          return (
            <Animated.View key={type.id} entering={FadeInUp.delay(200 + i * 50).duration(400)}>
              <Pressable
                onPress={() => handleSelect(type.id)}
                style={({ pressed }) => [styles.card, active && styles.cardActive, pressed && styles.cardPressed]}
              >
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <View style={styles.radioDot} />}
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.label, active && styles.labelActive]}>{type.label}</Text>
                  <Text style={styles.desc}>{type.desc}</Text>
                </View>
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
  confirm: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '500', color: tokens.colors.pinkDeep, textAlign: 'center', marginTop: 16, letterSpacing: 0.2 },
});
