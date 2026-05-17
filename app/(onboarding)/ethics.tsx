import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { OnboardingHeader } from '@/components/onboarding-header';
import { GlassButton } from '@/components/glass-button';
import { saveGloField } from '@/lib/glo-profile';
import * as Haptics from 'expo-haptics';


const OPTIONS = [
  { id: 'cruelty_free', label: 'Cruelty-free',        desc: 'Never tested on animals' },
  { id: 'vegan',        label: 'Vegan',                desc: 'No animal-derived ingredients' },
  { id: 'eco',          label: 'Eco / Sustainable',    desc: 'Recyclable packaging, reef-safe formulas' },
];

export default function EthicsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    Haptics.selectionAsync();
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleContinue = async () => {
    await saveGloField({ ethics: Array.from(selected) });
    router.push('/(onboarding)/foundation-pain');
  };

  return (
    <View style={styles.root}>
      <OnboardingHeader step={7} total={11} onBack={() => router.back()} />

      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={styles.header}>
        <Text style={styles.title}>What matters{'\n'}to you?</Text>
        <Text style={styles.sub}>Select all that apply — or skip.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.options}>
        {OPTIONS.map((opt, i) => {
          const active = selected.has(opt.id);
          return (
            <Animated.View key={opt.id} entering={FadeInUp.delay(200 + i * 60).duration(400)}>
              <Pressable
                onPress={() => toggle(opt.id)}
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

      <Animated.View entering={FadeInUp.delay(460).duration(500)} style={{ paddingBottom: insets.bottom + 32 }}>
        <GlassButton title="Continue" onPress={handleContinue} variant="primary" style={styles.cta} />
        <Text style={styles.note}>Your results are personalised around these choices.</Text>
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
  options: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: tokens.colors.white, borderRadius: 14, paddingVertical: 18, paddingHorizontal: 18, borderWidth: 1.5, borderColor: tokens.colors.border },
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
  cta: { width: '100%', marginBottom: 10 },
  note: { fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.grayLight, textAlign: 'center' },
});
