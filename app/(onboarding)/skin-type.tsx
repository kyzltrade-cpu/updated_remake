import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ob } from '@/components/onboarding-styles';
import { OnboardingHeader } from '@/components/onboarding-header';
import { SelectCard } from '@/components/select-card';
import { saveGloField } from '@/lib/glo-profile';

const TYPES = [
  { id: 'normal',      label: 'Normal',      description: 'Balanced, rarely breaks out' },
  { id: 'oily',        label: 'Oily',        description: 'Shiny by mid-morning' },
  { id: 'dry',         label: 'Dry',         description: 'Tight, sometimes flaky' },
  { id: 'combination', label: 'Combination', description: 'Oily T-zone, dry cheeks' },
  { id: 'sensitive',   label: 'Sensitive',   description: 'Reacts easily, prone to redness' },
] as const;

type SkinTypeId = (typeof TYPES)[number]['id'];

export default function SkinTypeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<SkinTypeId | null>(null);

  const handleSelect = async (id: SkinTypeId) => {
    if (selected) return;
    setSelected(id);
    await saveGloField({ skin_type: id });
    setTimeout(() => router.push('/(onboarding)/allergies'), 380);
  };

  return (
    <View style={[ob.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={6} total={11} onBack={() => router.back()} />

      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={ob.header}>
        <Text style={ob.title}>How does your skin{'\n'}feel by noon?</Text>
        <Text style={ob.sub}>Tap to select — we'll move on automatically.</Text>
      </Animated.View>

      <View style={ob.options}>
        {TYPES.map((type, i) => (
          <Animated.View key={type.id} entering={FadeInUp.delay(160 + i * 55).duration(400)}>
            <SelectCard
              label={type.label}
              description={type.description}
              active={selected === type.id}
              onPress={() => handleSelect(type.id)}
              disabled={selected !== null && selected !== type.id}
            />
          </Animated.View>
        ))}
      </View>

      <View style={ob.spacer} />
    </View>
  );
}
