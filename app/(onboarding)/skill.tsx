import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokens } from '@/components/theme';
import { OnboardingHeader } from '@/components/onboarding-header';
import * as Haptics from 'expo-haptics';

const LEVELS = [
  { id: 'beginner',     label: 'Beginner',     desc: 'Still learning the basics' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Comfortable with most looks' },
  { id: 'advanced',     label: 'Advanced',     desc: 'Techniques are second nature' },
];

export default function SkillScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = async (id: string) => {
    if (selected) return;
    setSelected(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem('@remake_skill_level', id);
    setTimeout(() => router.push('/(onboarding)/pain-point'), 800);
  };

  return (
    <View style={styles.root}>
      <OnboardingHeader step={2} total={11} onBack={() => router.back()} />

      <Animated.View
        entering={FadeInUp.delay(80).duration(500)}
        style={[styles.header, { paddingTop: insets.top + 24 }]}
      >
        <Text style={styles.title}>Your makeup{'\n'}experience?</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.cards}>
        {LEVELS.map((level, i) => {
          const isSelected = selected === level.id;
          return (
            <Animated.View key={level.id} entering={FadeInUp.delay(200 + i * 60).duration(400)}>
              <Pressable
                style={({ pressed }) => [
                  styles.card,
                  isSelected && styles.cardSelected,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => handleSelect(level.id)}
              >
                <View style={[styles.radio, isSelected && styles.radioActive]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                    {level.label}
                  </Text>
                  <Text style={[styles.cardDesc, isSelected && styles.cardDescSelected]}>
                    {level.desc}
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>

      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.beige,
    paddingHorizontal: 28,
  },
  header: { marginBottom: 32 },
  step: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: tokens.colors.grayLight,
    marginBottom: 14,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 32,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 42,
  },
  cards: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: tokens.colors.white,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
  },
  cardSelected: {
    borderColor: tokens.colors.pinkDeep,
    backgroundColor: tokens.colors.pinkLight,
  },
  cardPressed: { opacity: 0.9 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: tokens.colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  radioActive: { borderColor: tokens.colors.pinkDeep },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: tokens.colors.pinkDeep },
  cardBody: { flex: 1, gap: 3 },
  cardLabel: {
    fontFamily: tokens.fonts.serif,
    fontSize: 18,
    fontWeight: '400',
    color: tokens.colors.text,
  },
  cardLabelSelected: { color: tokens.colors.pinkRich },
  cardDesc: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '300',
    color: tokens.colors.gray,
  },
  cardDescSelected: { color: tokens.colors.pinkMid },
  spacer: { flex: 1 },
});
