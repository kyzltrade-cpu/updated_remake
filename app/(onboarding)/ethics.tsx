import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ob } from '@/components/onboarding-styles';
import { OnboardingHeader } from '@/components/onboarding-header';
import { SelectCard } from '@/components/select-card';
import { GlassButton } from '@/components/glass-button';
import { saveGloField } from '@/lib/glo-profile';

const OPTIONS = [
  { id: 'cruelty_free', label: 'Cruelty-free',     description: 'Never tested on animals' },
  { id: 'vegan',        label: 'Vegan',             description: 'No animal-derived ingredients' },
  { id: 'eco',          label: 'Eco / Sustainable', description: 'Recyclable packaging, reef-safe formulas' },
] as const;

type EthicId = (typeof OPTIONS)[number]['id'];

export default function EthicsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Set<EthicId>>(new Set());

  const toggle = (id: EthicId) => {
    Haptics.selectionAsync();
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const advance = async (values: EthicId[]) => {
    await saveGloField({ ethics: values });
    router.push('/(onboarding)/foundation-pain');
  };

  return (
    <View style={[ob.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={8} total={11} onBack={() => router.back()} />

      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={ob.header}>
        <Text style={ob.title}>What matters{'\n'}to you?</Text>
        <Text style={ob.sub}>Select all that apply — or skip.</Text>
      </Animated.View>

      <View style={ob.options}>
        {OPTIONS.map((opt, i) => (
          <Animated.View key={opt.id} entering={FadeInUp.delay(160 + i * 60).duration(400)}>
            <SelectCard
              label={opt.label}
              description={opt.description}
              active={selected.has(opt.id)}
              onPress={() => toggle(opt.id)}
            />
          </Animated.View>
        ))}
      </View>

      <View style={ob.spacer} />

      <Animated.View entering={FadeInUp.delay(440).duration(500)} style={styles.bottom}>
        <GlassButton
          title="Continue"
          onPress={() => advance(Array.from(selected))}
          variant="primary"
          style={styles.cta}
        />
        <Pressable onPress={() => advance([])}>
          <Text style={ob.skipLink}>Skip for now</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottom: { gap: 12 },
  cta: { width: '100%' },
});
