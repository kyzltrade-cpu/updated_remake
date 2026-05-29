import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';
import { ob } from '@/components/onboarding-styles';
import { OnboardingHeader } from '@/components/onboarding-header';
import { GlassButton } from '@/components/glass-button';
import { saveGloField } from '@/lib/glo-profile';

const PRESETS = [
  'Fragrance / Parfum',
  'Parabens',
  'Sulfates (SLS / SLES)',
  'Alcohol / Denatured Alcohol',
  'Silicones (Dimethicone)',
  'Nickel',
  'Lanolin',
  'Oxybenzone (Chemical SPF)',
  'Retinol / Vitamin A',
  'AHAs / Glycolic Acid',
  'Salicylic Acid',
  'Niacinamide',
  'Lavender Oil',
  'Tea Tree Oil',
  'Coconut Oil / Derivatives',
  'Nut Oils (Almond, Argan)',
  'Carmine (Red Dye)',
  'Gluten / Wheat Protein',
  'Propylene Glycol',
  'Synthetic Dyes & Colorants',
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
    <View style={[ob.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={7} total={11} onBack={() => router.back()} />

      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={ob.header}>
        <Text style={ob.title}>Anything your{'\n'}skin hates?</Text>
        <Text style={ob.sub}>Toggle all that apply — we filter these from every recommendation.</Text>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {[...PRESETS, ...customList].map(item => {
          const active = toggled.has(item);
          return (
            <Pressable
              key={item}
              onPress={() => toggle(item)}
              style={[styles.row, active && styles.rowActive]}
            >
              <Text style={[styles.rowLabel, active && styles.rowLabelActive]}>{item}</Text>
              <View style={[styles.tog, active && styles.togActive]}>
                <View style={[styles.togThumb, active && styles.togThumbActive]} />
              </View>
            </Pressable>
          );
        })}

        {/* Custom add */}
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            placeholder="Add your own…"
            placeholderTextColor={tokens.colors.grayLight}
            value={custom}
            onChangeText={setCustom}
            onSubmitEditing={addCustom}
            returnKeyType="done"
            autoCorrect={false}
            autoCapitalize="words"
          />
          {custom.trim().length > 0 && (
            <Pressable onPress={addCustom} style={styles.addBtn}>
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <GlassButton
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          style={styles.cta}
        />
        <Pressable onPress={handleContinue}>
          <Text style={ob.skipLink}>None of these apply</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: tokens.colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    marginBottom: 8,
  },
  rowActive: {
    borderColor: tokens.colors.pinkDeep,
    backgroundColor: 'rgba(232,57,154,0.04)',
  },
  rowLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: tokens.colors.text,
    flex: 1,
  },
  rowLabelActive: {
    color: tokens.colors.pinkDeep,
    fontWeight: '500',
  },
  tog: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: tokens.colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
    flexShrink: 0,
  },
  togActive: { backgroundColor: tokens.colors.pinkDeep },
  togThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: tokens.colors.white,
  },
  togThumbActive: { alignSelf: 'flex-end' },
  customRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  customInput: {
    flex: 1,
    backgroundColor: tokens.colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: tokens.colors.text,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
  },
  addBtn: {
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  addBtnText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.white,
  },
  bottom: { gap: 12, paddingTop: 8 },
  cta: { width: '100%' },
});
