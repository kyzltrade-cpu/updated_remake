import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';
import { saveGloField } from '@/lib/glo-profile';

const TYPES = [
  { id: 'normal', label: 'Normal', icon: '◎', desc: 'Balanced, rarely breaks out' },
  { id: 'oily', label: 'Oily', icon: '◉', desc: 'Shiny by mid-morning' },
  { id: 'dry', label: 'Dry', icon: '◇', desc: 'Tight, sometimes flaky' },
  { id: 'combination', label: 'Combination', icon: '◈', desc: 'Oily T-zone, dry cheeks' },
  { id: 'sensitive', label: 'Sensitive', icon: '◫', desc: 'Reacts easily, prone to redness' },
] as const;

const PROGRESS = 2 / 7;

export default function SkinTypeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(id);
    await saveGloField({ skin_type: id });
    setTimeout(() => router.push('/(onboarding)/allergies'), 800);
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${PROGRESS * 100}%` }]} />
      </View>

      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
        <Text style={styles.step}>2 of 7</Text>
        <Text style={styles.title}>How does your skin{'\n'}feel by noon?</Text>
        <Text style={styles.sub}>Tap to select</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(250).duration(600)} style={styles.cards}>
        {TYPES.map((type) => {
          const active = selected === type.id;
          return (
            <Pressable
              key={type.id}
              onPress={() => handleSelect(type.id)}
              style={({ pressed }) => [
                styles.card,
                active && styles.cardActive,
                pressed && styles.cardPressed,
              ]}
            >
              <Text style={[styles.cardIcon, active && styles.cardIconActive]}>
                {type.icon}
              </Text>
              <View style={styles.cardText}>
                <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>
                  {type.label}
                </Text>
                <Text style={[styles.cardDesc, active && styles.cardDescActive]}>
                  {type.desc}
                </Text>
              </View>
              {active && <View style={styles.checkDot} />}
            </Pressable>
          );
        })}
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
    color: tokens.colors.grayLight,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
  },
  cards: {
    flex: 1,
    gap: 10,
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
  },
  cardActive: {
    borderColor: tokens.colors.pinkDeep,
    backgroundColor: tokens.colors.pinkLight,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardIcon: {
    fontSize: 22,
    color: tokens.colors.grayLight,
    width: 28,
    textAlign: 'center',
  },
  cardIconActive: {
    color: tokens.colors.pinkDeep,
  },
  cardText: {
    flex: 1,
  },
  cardLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '500',
    color: tokens.colors.text,
    marginBottom: 2,
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
  cardDescActive: {
    color: tokens.colors.pinkDeep,
  },
  checkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.colors.pinkDeep,
  },
});
