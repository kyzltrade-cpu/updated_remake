import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import { OnboardingPagination } from '@/components/onboarding-pagination';
import { saveOnboardingField, type PriorityCategory } from '@/lib/onboarding-store';
import * as Haptics from 'expo-haptics';

const OPTIONS: { value: PriorityCategory; label: string; desc: string }[] = [
  { value: 'Blending', label: 'Blending', desc: 'Eyeshadow transitions and gradient edges' },
  { value: 'Symmetry', label: 'Symmetry', desc: 'Matching both sides — eyes, brows, lips' },
  { value: 'Colour Harmony', label: 'Colour Harmony', desc: 'Choosing shades that work with my skin tone' },
  { value: 'Coverage', label: 'Coverage', desc: 'Even foundation and concealer application' },
  { value: 'Brow Shaping', label: 'Brow Shaping', desc: 'Shape, symmetry, and placement' },
];

export default function PainPointScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<PriorityCategory[]>([]);

  const handleToggle = (cat: PriorityCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await saveOnboardingField('priorityCategory', JSON.stringify(selected));
    router.push('/(onboarding)/frequency');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}>
      <OnboardingPagination total={6} current={2} />

      <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.content}>
        <Text style={styles.heading}>What do you struggle with most?</Text>
        <Text style={styles.sub}>Pick as many as apply. We'll give these extra attention.</Text>

        <View style={styles.options}>
          {OPTIONS.map((opt, i) => {
            const isSelected = selected.includes(opt.value);
            return (
              <Animated.View key={opt.value} entering={FadeInUp.delay(i * 70).duration(380)}>
                <Pressable
                  onPress={() => handleToggle(opt.value)}
                  style={({ pressed }) => [
                    styles.option,
                    isSelected && styles.optionSelected,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <View style={styles.optionRow}>
                    <View style={[styles.dot, isSelected && styles.dotSelected]}>
                      {isSelected && <View style={styles.dotCheck} />}
                    </View>
                    <View style={styles.optionText}>
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                        {opt.label}
                      </Text>
                      <Text style={[styles.optionDesc, isSelected && styles.optionDescSelected]}>
                        {opt.desc}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(400).duration(400)}>
        <GlassButton
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          disabled={selected.length === 0}
          style={styles.cta}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.beige, paddingHorizontal: 28 },
  content: { flex: 1, justifyContent: 'center', gap: 14 },
  heading: {
    fontFamily: tokens.fonts.serif,
    fontSize: 32,
    color: tokens.colors.text,
    lineHeight: 42,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    color: tokens.colors.gray,
    lineHeight: 22,
  },
  options: { gap: 10, marginTop: 18 },
  option: {
    backgroundColor: tokens.colors.white,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
  },
  optionSelected: { backgroundColor: tokens.colors.accent, borderColor: tokens.colors.accent },
  optionPressed: { opacity: 0.88 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: tokens.colors.pinkMid,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  dotSelected: { backgroundColor: tokens.colors.accent, borderColor: tokens.colors.accent },
  dotCheck: {
    width: 10, height: 6,
    borderLeftWidth: 2, borderBottomWidth: 2,
    borderColor: '#fff',
    transform: [{ rotate: '-45deg' }, { translateY: -1 }],
  },
  optionText: { flex: 1, gap: 2 },
  optionLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '600',
    color: tokens.colors.text,
  },
  optionLabelSelected: { color: '#FFF9F7' },
  optionDesc: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: tokens.colors.gray,
    lineHeight: 18,
  },
  optionDescSelected: { color: 'rgba(255,249,247,0.65)' },
  cta: { width: '100%' },
});
