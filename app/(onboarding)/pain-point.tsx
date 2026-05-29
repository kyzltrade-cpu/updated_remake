import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ob } from '@/components/onboarding-styles';
import { OnboardingHeader } from '@/components/onboarding-header';
import { SelectCard } from '@/components/select-card';
import { GlassButton } from '@/components/glass-button';
import { saveOnboardingField, type PriorityCategory } from '@/lib/onboarding-store';

const OPTIONS: { value: PriorityCategory; label: string; description: string }[] = [
  { value: 'Blending',       label: 'Blending',       description: 'Eyeshadow transitions and gradient edges' },
  { value: 'Symmetry',       label: 'Symmetry',        description: 'Matching both sides — eyes, brows, lips' },
  { value: 'Colour Harmony', label: 'Colour Harmony',  description: 'Shades that work with my skin tone' },
  { value: 'Coverage',       label: 'Coverage',        description: 'Even foundation and concealer application' },
  { value: 'Brow Framing',   label: 'Brow Framing',    description: 'Shape, symmetry, and placement' },
];

export default function PainPointScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<PriorityCategory[]>([]);

  const toggle = (cat: PriorityCategory) => {
    Haptics.selectionAsync();
    setSelected(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat],
    );
  };

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await saveOnboardingField('priorityCategory', JSON.stringify(selected));
    router.push('/(onboarding)/skin-goals');
  };

  return (
    <View style={[ob.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={4} total={11} onBack={() => router.back()} />

      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={ob.header}>
        <Text style={ob.title}>What do you struggle{'\n'}with most?</Text>
        <Text style={ob.sub}>Pick as many as apply — we give these extra weight.</Text>
      </Animated.View>

      <View style={ob.options}>
        {OPTIONS.map((opt, i) => (
          <Animated.View key={opt.value} entering={FadeInUp.delay(160 + i * 55).duration(400)}>
            <SelectCard
              label={opt.label}
              description={opt.description}
              active={selected.includes(opt.value)}
              onPress={() => toggle(opt.value)}
            />
          </Animated.View>
        ))}
      </View>

      <View style={ob.spacer} />

      <Animated.View entering={FadeInUp.delay(500).duration(500)}>
        <GlassButton
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          style={styles.cta}
          disabled={selected.length === 0}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({ cta: { width: '100%' } });
