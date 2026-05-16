import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import * as Haptics from 'expo-haptics';
import { saveGloField } from '@/lib/glo-profile';

const OPTIONS = [
  { id: 'cruelty_free', label: 'Cruelty-free', desc: 'Never tested on animals' },
  { id: 'vegan', label: 'Vegan', desc: 'No animal-derived ingredients' },
  { id: 'eco', label: 'Eco / Sustainable', desc: 'Recyclable packaging, reef-safe formulas' },
];

const PROGRESS = 4 / 7;

export default function EthicsScreen() {
  const router = useRouter();
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
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${PROGRESS * 100}%` }]} />
      </View>

      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
        <Text style={styles.step}>4 of 7</Text>
        <Text style={styles.title}>What matters{'\n'}to you?</Text>
        <Text style={styles.sub}>Select all that apply — or skip</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(250).duration(600)} style={styles.options}>
        {OPTIONS.map((opt) => {
          const active = selected.has(opt.id);
          return (
            <Pressable
              key={opt.id}
              onPress={() => toggle(opt.id)}
              style={[styles.card, active && styles.cardActive]}
            >
              <View style={styles.cardLeft}>
                <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={styles.cardDesc}>{opt.desc}</Text>
              </View>
              <View style={[styles.checkbox, active && styles.checkboxActive]}>
                {active && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </Pressable>
          );
        })}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(450).duration(600)} style={styles.bottom}>
        <GlassButton
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          style={styles.cta}
        />
        <Text style={styles.skip}>Your results are personalised around these choices</Text>
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
    marginBottom: 40,
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
    fontSize: 30,
    fontWeight: '400',
    color: tokens.colors.text,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 8,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '300',
    color: tokens.colors.gray,
  },
  options: {
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
  },
  cardActive: {
    borderColor: tokens.colors.pinkDeep,
    backgroundColor: tokens.colors.pinkLight,
  },
  cardLeft: {
    flex: 1,
  },
  cardLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '500',
    color: tokens.colors.text,
    marginBottom: 3,
  },
  cardLabelActive: {
    color: tokens.colors.pinkRich,
  },
  cardDesc: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 17,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: tokens.colors.pinkDeep,
    borderColor: tokens.colors.pinkDeep,
  },
  checkmark: {
    color: tokens.colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  bottom: {
    alignItems: 'center',
    gap: 12,
  },
  cta: {
    width: '100%',
  },
  skip: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: tokens.colors.grayLight,
    textAlign: 'center',
  },
});
