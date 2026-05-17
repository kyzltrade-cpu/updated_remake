import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import { saveGloField } from '@/lib/glo-profile';
import * as Haptics from 'expo-haptics';

const STEP = 7;
const TOTAL = 9;

const OPTIONS = [
  { id: 'almost_always', label: 'Almost always',  desc: 'Every other purchase is a miss' },
  { id: 'sometimes',     label: 'Sometimes',       desc: 'Maybe half the time' },
  { id: 'rarely',        label: 'Rarely',           desc: 'I usually get it right' },
  { id: 'i_just_guess',  label: 'I just guess',    desc: 'And hope for the best' },
];

export default function FoundationPainScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);
  const [brand, setBrand] = useState('');

  const handleContinue = async () => {
    await saveGloField({ foundation_pain: selected ?? '', usual_brand: brand.trim() });
    router.push('/(onboarding)/tone-guess');
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
        <Text style={styles.title}>How often do you buy{'\n'}the wrong shade?</Text>
        <Text style={styles.sub}>Be honest — we're about to fix this.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.options}>
        {OPTIONS.map((opt, i) => {
          const active = selected === opt.id;
          return (
            <Animated.View key={opt.id} entering={FadeInUp.delay(200 + i * 50).duration(400)}>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected(opt.id); }}
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

      <Animated.View entering={FadeInUp.delay(440).duration(500)} style={styles.brandSection}>
        <Text style={styles.brandLabel}>What brand do you usually buy? <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput
          style={styles.brandInput}
          placeholder="e.g. Fenty Beauty, MAC, Charlotte Tilbury..."
          placeholderTextColor={tokens.colors.grayLight}
          value={brand}
          onChangeText={setBrand}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={80}
        />
      </Animated.View>

      <View style={styles.spacer} />

      <Animated.View entering={FadeInUp.delay(540).duration(500)} style={{ paddingBottom: insets.bottom + 32 }}>
        <GlassButton title="Continue" onPress={handleContinue} variant="primary" style={styles.cta} disabled={!selected} />
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
  title: { fontFamily: tokens.fonts.serif, fontSize: 32, fontWeight: '400', color: tokens.colors.text, lineHeight: 42, marginBottom: 8 },
  sub: { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '300', color: tokens.colors.gray, lineHeight: 22 },
  options: { gap: 10, marginBottom: 24 },
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
  brandSection: {},
  brandLabel: { fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '500', color: tokens.colors.text, marginBottom: 10 },
  optional: { fontWeight: '300', color: tokens.colors.grayLight },
  brandInput: { backgroundColor: tokens.colors.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontFamily: tokens.fonts.regular, fontSize: 14, color: tokens.colors.text, borderWidth: 1.5, borderColor: tokens.colors.border },
  spacer: { flex: 1, minHeight: 16 },
  cta: { width: '100%' },
  backBtn: { position: 'absolute', left: 20, zIndex: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: tokens.colors.white, borderWidth: 1, borderColor: tokens.colors.border, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 20, color: tokens.colors.text, lineHeight: 22 },
});
