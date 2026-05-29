import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { ob } from '@/components/onboarding-styles';
import { OnboardingHeader } from '@/components/onboarding-header';
import { SelectCard } from '@/components/select-card';
import { saveGloField } from '@/lib/glo-profile';

const OPTIONS = [
  {
    id: 'warm',
    label: 'Warm',
    description: 'Golden, peachy, or yellow hues',
    outerColor: '#D4A96A',
    innerColor: '#C9956A',
  },
  {
    id: 'cool',
    label: 'Cool',
    description: 'Pink, rosy, or bluish hues',
    outerColor: '#B8A8C8',
    innerColor: '#A090B8',
  },
  {
    id: 'no_idea',
    label: 'Not sure',
    description: 'Your scan will confirm it — 35% pick this',
    outerColor: tokens.colors.border,
    innerColor: tokens.colors.grayLight,
  },
] as const;

type ToneId = (typeof OPTIONS)[number]['id'];

function Swatch({ outer, inner }: { outer: string; inner: string }) {
  return (
    <View style={[styles.swatchOuter, { backgroundColor: outer }]}>
      <View style={[styles.swatchInner, { backgroundColor: inner }]} />
    </View>
  );
}

export default function ToneGuessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<ToneId | null>(null);

  const handleSelect = async (id: ToneId) => {
    if (selected) return;
    setSelected(id);
    await saveGloField({ undertone_guess: id });
    setTimeout(() => router.push('/(onboarding)/style-archetype'), 380);
  };

  return (
    <View style={[ob.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={10} total={11} onBack={() => router.back()} />

      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={ob.header}>
        <Text style={ob.title}>What's your{'\n'}skin undertone?</Text>
        <Text style={ob.sub}>A guess is fine — your scan confirms it.</Text>
      </Animated.View>

      <View style={ob.options}>
        {OPTIONS.map((opt, i) => (
          <Animated.View key={opt.id} entering={FadeInUp.delay(160 + i * 60).duration(400)}>
            <SelectCard
              label={opt.label}
              description={opt.description}
              left={<Swatch outer={opt.outerColor} inner={opt.innerColor} />}
              active={selected === opt.id}
              onPress={() => handleSelect(opt.id)}
              disabled={selected !== null && selected !== opt.id}
            />
          </Animated.View>
        ))}
      </View>

      {selected !== null && (
        <Animated.Text entering={FadeIn.duration(250)} style={styles.confirm}>
          ✓ Got it
        </Animated.Text>
      )}

      <View style={ob.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  swatchOuter: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  swatchInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  confirm: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '500',
    color: tokens.colors.pinkDeep,
    textAlign: 'center',
    marginTop: 16,
  },
});
