import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokens } from '@/components/theme';
import { ob } from '@/components/onboarding-styles';
import { SelectCard } from '@/components/select-card';

const GOALS = [
  {
    id: 'shade',
    emoji: '💄',
    label: 'Find my perfect shade',
    description: 'Match foundation and tint to my exact skin tone',
  },
  {
    id: 'ingredients',
    emoji: '🧴',
    label: 'Avoid bad ingredients',
    description: 'Flag allergens and irritants before I buy',
  },
  {
    id: 'discover',
    emoji: '✨',
    label: 'Get personalised picks',
    description: 'Products matched to my skin type and budget',
  },
  {
    id: 'money',
    emoji: '💸',
    label: 'Stop wasting money',
    description: 'Know before I buy whether a product works for me',
  },
] as const;

type GoalId = (typeof GOALS)[number]['id'];

export default function GoalSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<GoalId | null>(null);

  const handleSelect = async (id: GoalId) => {
    if (selected) return;
    setSelected(id);
    await AsyncStorage.setItem('@remake_onboarding_goal', id);
    setTimeout(() => router.push('/(onboarding)/name'), 380);
  };

  return (
    <View style={[ob.root, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 40 }]}>
      <Animated.View entering={FadeInUp.delay(60).duration(500)} style={ob.header}>
        <Text style={ob.eyebrow}>Welcome to REMAKE</Text>
        <Text style={ob.title}>What brings you{'\n'}here today?</Text>
        <Text style={ob.sub}>We'll build your scanner around this.</Text>
      </Animated.View>

      <View style={ob.options}>
        {GOALS.map((goal, i) => (
          <Animated.View key={goal.id} entering={FadeInUp.delay(160 + i * 60).duration(400)}>
            <SelectCard
              label={goal.label}
              description={goal.description}
              left={<Text style={styles.emoji}>{goal.emoji}</Text>}
              active={selected === goal.id}
              onPress={() => handleSelect(goal.id)}
              disabled={selected !== null && selected !== goal.id}
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emoji: {
    fontSize: 22,
    lineHeight: 26,
  },
});
