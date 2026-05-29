import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ob } from '@/components/onboarding-styles';
import { OnboardingHeader } from '@/components/onboarding-header';
import { SelectCard } from '@/components/select-card';

const LEVELS = [
  { id: 'beginner',     label: 'Beginner',     description: 'Still learning the basics' },
  { id: 'intermediate', label: 'Intermediate', description: 'Comfortable with most looks' },
  { id: 'advanced',     label: 'Advanced',     description: 'Techniques are second nature' },
] as const;

type LevelId = (typeof LEVELS)[number]['id'];

export default function SkillScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<LevelId | null>(null);

  const handleSelect = async (id: LevelId) => {
    if (selected) return;
    setSelected(id);
    await AsyncStorage.setItem('@remake_skill_level', id);
    setTimeout(() => router.push('/(onboarding)/pain-point'), 380);
  };

  return (
    <View style={[ob.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={3} total={11} onBack={() => router.back()} />

      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={ob.header}>
        <Text style={ob.title}>Your makeup{'\n'}experience?</Text>
        <Text style={ob.sub}>Tap to select — we'll move on automatically.</Text>
      </Animated.View>

      <View style={ob.options}>
        {LEVELS.map((level, i) => (
          <Animated.View key={level.id} entering={FadeInUp.delay(160 + i * 60).duration(400)}>
            <SelectCard
              label={level.label}
              description={level.description}
              active={selected === level.id}
              onPress={() => handleSelect(level.id)}
              disabled={selected !== null && selected !== level.id}
            />
          </Animated.View>
        ))}
      </View>

      <View style={ob.spacer} />
    </View>
  );
}
