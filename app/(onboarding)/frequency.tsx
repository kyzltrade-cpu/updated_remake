import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ob } from '@/components/onboarding-styles';
import { OnboardingHeader } from '@/components/onboarding-header';
import { SelectCard } from '@/components/select-card';

const OPTIONS = [
  { id: 'daily',        label: 'Daily',        description: 'Full look every morning' },
  { id: '4_5_week',     label: '4–5× a week',  description: 'Most days, with occasional breaks' },
  { id: '2_3_week',     label: '2–3× a week',  description: 'A few times a week' },
  { id: 'occasionally', label: 'Occasionally', description: 'Special occasions only' },
] as const;

type FrequencyId = (typeof OPTIONS)[number]['id'];

export default function FrequencyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<FrequencyId | null>(null);

  const handleSelect = async (id: FrequencyId) => {
    if (selected) return;
    setSelected(id);
    await AsyncStorage.setItem('@remake_practice_frequency', id);
    setTimeout(() => router.push('/(onboarding)/skill'), 380);
  };

  return (
    <View style={[ob.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={2} total={11} onBack={() => router.back()} />

      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={ob.header}>
        <Text style={ob.title}>How often do you{'\n'}do your makeup?</Text>
        <Text style={ob.sub}>Tap to select — we'll move on automatically.</Text>
      </Animated.View>

      <View style={ob.options}>
        {OPTIONS.map((opt, i) => (
          <Animated.View key={opt.id} entering={FadeInUp.delay(160 + i * 60).duration(400)}>
            <SelectCard
              label={opt.label}
              description={opt.description}
              active={selected === opt.id}
              onPress={() => handleSelect(opt.id)}
              disabled={selected !== null && selected !== opt.id}
            />
          </Animated.View>
        ))}
      </View>

      <View style={ob.spacer} />
    </View>
  );
}
