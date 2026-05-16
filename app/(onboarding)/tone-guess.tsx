import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';
import { saveGloField } from '@/lib/glo-profile';

const OPTIONS = [
  {
    id: 'warm',
    label: 'Warm',
    sub: 'Golden, peachy, or yellow hues',
    swatch: '#D4A96A',
    swatchInner: '#C9956A',
  },
  {
    id: 'cool',
    label: 'Cool',
    sub: 'Pink, rosy, or bluish hues',
    swatch: '#B8A8C8',
    swatchInner: '#A090B8',
  },
  {
    id: 'no_idea',
    label: 'No idea',
    sub: 'GLO will reveal the truth',
    swatch: tokens.colors.border,
    swatchInner: tokens.colors.grayLight,
    hook: true,
  },
];

const PROGRESS = 6 / 7;

export default function ToneGuessScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(id);
    await saveGloField({ undertone_guess: id });
    setTimeout(() => router.push('/(onboarding)/style-archetype'), 700);
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${PROGRESS * 100}%` }]} />
      </View>

      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
        <Text style={styles.step}>6 of 7</Text>
        <Text style={styles.title}>Quick — what do you think{'\n'}your undertone is?</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(260).duration(600)} style={styles.cards}>
        {OPTIONS.map((opt) => {
          const active = selected === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => handleSelect(opt.id)}
              style={({ pressed }) => [
                styles.card,
                active && styles.cardActive,
                opt.hook && styles.cardHook,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={[styles.swatch, { backgroundColor: opt.swatch }]}>
                <View style={[styles.swatchInner, { backgroundColor: opt.swatchInner }]} />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardLabel, active && styles.cardLabelActive, opt.hook && styles.cardLabelHook]}>
                  {opt.label}
                </Text>
                <Text style={[styles.cardSub, opt.hook && styles.cardSubHook]}>
                  {opt.sub}
                </Text>
              </View>
              {active && <View style={styles.activeDot} />}
            </Pressable>
          );
        })}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.footnote}>
        <Text style={styles.footnoteText}>
          35% of people pick "No idea" — you're not alone. Your bare-face photo will tell us.
        </Text>
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
    marginBottom: 36,
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
    fontSize: 26,
    fontWeight: '400',
    color: tokens.colors.text,
    textAlign: 'center',
    lineHeight: 36,
  },
  cards: {
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    backgroundColor: tokens.colors.white,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
  },
  cardActive: {
    borderColor: tokens.colors.pinkDeep,
    backgroundColor: tokens.colors.pinkLight,
  },
  cardHook: {
    borderColor: tokens.colors.goldSoft,
    backgroundColor: tokens.colors.ivory,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  cardText: {
    flex: 1,
  },
  cardLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '500',
    color: tokens.colors.text,
    marginBottom: 3,
  },
  cardLabelActive: {
    color: tokens.colors.pinkRich,
  },
  cardLabelHook: {
    color: tokens.colors.gold,
  },
  cardSub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 17,
  },
  cardSubHook: {
    color: tokens.colors.goldSoft,
    fontStyle: 'italic',
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.colors.pinkDeep,
  },
  footnote: {
    paddingTop: 20,
  },
  footnoteText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '300',
    color: tokens.colors.grayLight,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
