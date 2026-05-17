import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import { saveGloField } from '@/lib/glo-profile';
import * as Haptics from 'expo-haptics';

const STEP = 5;
const TOTAL = 9;

const PRESETS = [
  'Fragrance / Parfum',
  'Parabens',
  'Sulfates (SLS/SLES)',
  'Synthetic Dyes',
  'Lanolin',
  'Nickel',
  'Formaldehyde-releasers',
  'Lavender Oil',
  'Peppermint Oil',
  'Tea Tree Oil',
];

export default function AllergiesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [toggled, setToggled] = useState<Set<string>>(new Set());
  const [custom, setCustom] = useState('');
  const [customList, setCustomList] = useState<string[]>([]);

  const toggle = (item: string) => {
    Haptics.selectionAsync();
    setToggled(prev => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  };

  const addCustom = () => {
    const trimmed = custom.trim();
    if (!trimmed || customList.includes(trimmed)) return;
    setCustomList(prev => [...prev, trimmed]);
    setCustom('');
  };

  const handleContinue = async () => {
    await saveGloField({ allergies: [...Array.from(toggled), ...customList] });
    router.push('/(onboarding)/ethics');
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(STEP / TOTAL) * 100}%` as `${number}%` }]} />
      </View>
      <Pressable onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 10 }]}>
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>

      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.step}>{STEP} of {TOTAL}</Text>
        <Text style={styles.title}>Anything your{'\n'}skin hates?</Text>
        <Text style={styles.sub}>Toggle all that apply — or skip if none.</Text>
      </Animated.View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {[...PRESETS, ...customList].map((item) => {
          const active = toggled.has(item) || customList.includes(item);
          return (
            <Pressable key={item} onPress={() => toggle(item)} style={styles.row}>
              <Text style={[styles.rowLabel, active && styles.rowLabelActive]}>{item}</Text>
              <View style={[styles.tog, active && styles.togActive]}>
                <View style={[styles.togThumb, active && styles.togThumbActive]} />
              </View>
            </Pressable>
          );
        })}

        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="Add ingredient..."
            placeholderTextColor={tokens.colors.grayLight}
            value={custom}
            onChangeText={setCustom}
            onSubmitEditing={addCustom}
            returnKeyType="done"
            autoCapitalize="words"
            maxLength={60}
          />
          <Pressable onPress={addCustom} style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.addBtnText}>+</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(400).duration(500)}>
        <GlassButton title="Continue" onPress={handleContinue} variant="primary" style={styles.cta} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.beige, paddingHorizontal: 28 },
  track: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: tokens.colors.border },
  fill: { height: '100%', backgroundColor: tokens.colors.pinkDeep },
  header: { marginBottom: 20 },
  step: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '500', letterSpacing: 1.2, textTransform: 'uppercase', color: tokens.colors.grayLight, marginBottom: 14 },
  title: { fontFamily: tokens.fonts.serif, fontSize: 32, fontWeight: '400', color: tokens.colors.text, lineHeight: 42, marginBottom: 8 },
  sub: { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '300', color: tokens.colors.gray, lineHeight: 22 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: tokens.colors.border },
  rowLabel: { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '400', color: tokens.colors.gray, flex: 1 },
  rowLabelActive: { color: tokens.colors.text, fontWeight: '500' },
  tog: { width: 42, height: 24, borderRadius: 12, backgroundColor: tokens.colors.border, justifyContent: 'center', paddingHorizontal: 2 },
  togActive: { backgroundColor: tokens.colors.pinkDeep },
  togThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: tokens.colors.white, alignSelf: 'flex-start' },
  togThumbActive: { alignSelf: 'flex-end' },
  addRow: { flexDirection: 'row', gap: 10, marginTop: 16, alignItems: 'center' },
  addInput: { flex: 1, backgroundColor: tokens.colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontFamily: tokens.fonts.regular, fontSize: 14, color: tokens.colors.text, borderWidth: 1.5, borderColor: tokens.colors.border },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: tokens.colors.pinkDeep, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: tokens.colors.white, fontSize: 22, lineHeight: 24, fontWeight: '300' },
  cta: { width: '100%' },
  backBtn: { position: 'absolute', left: 20, zIndex: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: tokens.colors.white, borderWidth: 1, borderColor: tokens.colors.border, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 20, color: tokens.colors.text, lineHeight: 22 },
});
