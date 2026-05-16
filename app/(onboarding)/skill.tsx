import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';

const LEVELS = [
  { id: 'beginner', label: 'Beginner', desc: 'Still learning the basics' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Comfortable with most looks' },
  { id: 'advanced', label: 'Advanced', desc: 'Techniques are second nature' },
];

export default function SkillScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = async (id: string) => {
    if (selected) return;
    setSelected(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem('@remake_skill_level', id);
    setTimeout(() => router.push('/(onboarding)/pain-point'), 800);
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
        <Text style={styles.title}>Your makeup experience?</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(250).duration(600)} style={styles.cards}>
        {LEVELS.map((level, i) => {
          const isSelected = selected === level.id;
          return (
            <Pressable
              key={level.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => handleSelect(level.id)}
            >
              <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                {level.label}
              </Text>
              <Text style={[styles.cardDesc, isSelected && styles.cardDescSelected]}>
                {level.desc}
              </Text>
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
    paddingTop: 100,
    paddingBottom: 50,
  },
  header: { marginBottom: 40 },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 34,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 44,
  },
  cards: { gap: 14 },
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 22,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
  },
  cardSelected: {
    backgroundColor: tokens.colors.accent,
    borderColor: tokens.colors.accent,
  },
  cardLabel: {
    fontFamily: tokens.fonts.serif,
    fontSize: 20,
    fontWeight: '400',
    color: tokens.colors.text,
    marginBottom: 4,
  },
  cardLabelSelected: { color: tokens.colors.white },
  cardDesc: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '300',
    color: tokens.colors.gray,
  },
  cardDescSelected: { color: 'rgba(255,255,255,0.65)' },
});
