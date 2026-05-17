import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import * as Haptics from 'expo-haptics';
import { saveGloField } from '@/lib/glo-profile';

const OPTIONS = [
  { id: 'almost_always', label: 'Almost always', sub: 'Every other purchase is a miss' },
  { id: 'sometimes', label: 'Sometimes', sub: 'Maybe half the time' },
  { id: 'rarely', label: 'Rarely', sub: 'I usually get it right' },
  { id: 'i_just_guess', label: 'I just guess', sub: 'And hope for the best' },
];

const PROGRESS = 5 / 7;

export default function FoundationPainScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [brand, setBrand] = useState('');

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(id);
  };

  const handleContinue = async () => {
    await saveGloField({
      foundation_pain: selected ?? '',
      usual_brand: brand.trim(),
    });
    router.push('/(onboarding)/tone-guess');
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${PROGRESS * 100}%` }]} />
      </View>

      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
        <Text style={styles.step}>7 of 9</Text>
        <Text style={styles.title}>How often do you buy{'\n'}the wrong shade?</Text>
        <Text style={styles.sub}>Be honest — we're about to fix this</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(250).duration(600)} style={styles.options}>
        {OPTIONS.map((opt) => {
          const active = selected === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => handleSelect(opt.id)}
              style={[styles.option, active && styles.optionActive]}
            >
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                {opt.label}
              </Text>
              <Text style={[styles.optionSub, active && styles.optionSubActive]}>
                {opt.sub}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(450).duration(600)} style={styles.brandSection}>
        <Text style={styles.brandLabel}>What brand do you usually buy?</Text>
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
        <Text style={styles.optional}>Optional</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(550).duration(600)} style={styles.bottom}>
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
    marginBottom: 28,
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
    fontSize: 27,
    fontWeight: '400',
    color: tokens.colors.text,
    textAlign: 'center',
    lineHeight: 37,
    marginBottom: 8,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '300',
    color: tokens.colors.gray,
    fontStyle: 'italic',
  },
  options: {
    gap: 10,
    marginBottom: 24,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: tokens.colors.white,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
  },
  optionActive: {
    borderColor: tokens.colors.pinkDeep,
    backgroundColor: tokens.colors.pinkLight,
  },
  optionLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '500',
    color: tokens.colors.text,
    marginBottom: 2,
  },
  optionLabelActive: {
    color: tokens.colors.pinkRich,
  },
  optionSub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '300',
    color: tokens.colors.gray,
  },
  optionSubActive: {
    color: tokens.colors.pinkDeep,
  },
  brandSection: {
    flex: 1,
  },
  brandLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '500',
    color: tokens.colors.text,
    marginBottom: 10,
  },
  brandInput: {
    backgroundColor: tokens.colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: tokens.colors.text,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: 6,
  },
  optional: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: tokens.colors.grayLight,
  },
  bottom: {
    alignItems: 'center',
  },
  cta: {
    width: '100%',
  },
});
