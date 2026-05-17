import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import * as Haptics from 'expo-haptics';
import { saveGloField } from '@/lib/glo-profile';

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

const PROGRESS = 3 / 7;

export default function AllergiesScreen() {
  const router = useRouter();
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
    const all = [...Array.from(toggled), ...customList];
    await saveGloField({ allergies: all });
    router.push('/(onboarding)/ethics');
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${PROGRESS * 100}%` }]} />
      </View>

      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
        <Text style={styles.step}>5 of 9</Text>
        <Text style={styles.title}>Anything your{'\n'}skin hates?</Text>
        <Text style={styles.sub}>Toggle all that apply — or skip if none</Text>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {PRESETS.map((item) => {
          const active = toggled.has(item);
          return (
            <Pressable key={item} onPress={() => toggle(item)} style={styles.row}>
              <Text style={[styles.rowLabel, active && styles.rowLabelActive]}>{item}</Text>
              <View style={[styles.toggle, active && styles.toggleActive]}>
                <View style={[styles.toggleThumb, active && styles.toggleThumbActive]} />
              </View>
            </Pressable>
          );
        })}

        {customList.map((item) => (
          <Pressable key={item} onPress={() => setCustomList(p => p.filter(i => i !== item))} style={styles.row}>
            <Text style={[styles.rowLabel, styles.rowLabelActive]}>{item}</Text>
            <View style={[styles.toggle, styles.toggleActive]}>
              <View style={[styles.toggleThumb, styles.toggleThumbActive]} />
            </View>
          </Pressable>
        ))}

        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            placeholder="Add your own..."
            placeholderTextColor={tokens.colors.grayLight}
            value={custom}
            onChangeText={setCustom}
            onSubmitEditing={addCustom}
            returnKeyType="done"
            autoCapitalize="words"
            maxLength={60}
          />
          <Pressable
            onPress={addCustom}
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.addBtnText}>+</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.bottom}>
        <GlassButton
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          style={styles.cta}
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
    marginBottom: 24,
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
    fontSize: 28,
    fontWeight: '400',
    color: tokens.colors.text,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 8,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '300',
    color: tokens.colors.gray,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 0,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: tokens.colors.border,
  },
  rowLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: tokens.colors.gray,
    flex: 1,
  },
  rowLabelActive: {
    color: tokens.colors.text,
    fontWeight: '500',
  },
  toggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: tokens.colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: tokens.colors.pinkDeep,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: tokens.colors.white,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  customRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    backgroundColor: tokens.colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: tokens.colors.text,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: tokens.colors.pinkDeep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: tokens.colors.white,
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '300',
  },
  bottom: {
    alignItems: 'center',
    paddingTop: 16,
  },
  cta: {
    width: '100%',
  },
});
