import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import * as Haptics from 'expo-haptics';

const OPTIONS = [
  { id: 'daily', label: 'Daily' },
  { id: '4_5_week', label: '4–5× / week' },
  { id: '2_3_week', label: '2–3× / week' },
  { id: 'occasionally', label: 'Occasionally' },
];

export default function FrequencyScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem('@remake_practice_frequency', selected);
    router.push('/(onboarding)/skin-goals');
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
        <Text style={styles.title}>How often do you do makeup?</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(260).duration(600)} style={styles.options}>
        {OPTIONS.map(opt => {
          const isSelected = selected === opt.id;
          return (
            <Pressable
              key={opt.id}
              style={[styles.row, isSelected && styles.rowSelected]}
              onPress={() => { Haptics.selectionAsync(); setSelected(opt.id); }}
            >
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.rowLabel, isSelected && styles.rowLabelSelected]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>

      <View style={styles.spacer} />

      <Animated.View entering={FadeInUp.delay(480).duration(600)}>
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
    paddingTop: 100,
    paddingBottom: 50,
  },
  header: { marginBottom: 36 },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 34,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 44,
  },
  options: { gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: tokens.colors.white,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
  },
  rowSelected: {
    borderColor: tokens.colors.pinkDeep,
    backgroundColor: tokens.colors.pinkLight + '20',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: tokens.colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: { borderColor: tokens.colors.pinkDeep },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.colors.pinkDeep,
  },
  rowLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '400',
    color: tokens.colors.text,
  },
  rowLabelSelected: { color: tokens.colors.text },
  spacer: { flex: 1, minHeight: 32 },
  cta: { width: '100%' },
});
