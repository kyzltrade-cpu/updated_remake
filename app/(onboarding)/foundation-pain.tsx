import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { ob } from '@/components/onboarding-styles';
import { OnboardingHeader } from '@/components/onboarding-header';
import { SelectCard } from '@/components/select-card';
import { GlassButton } from '@/components/glass-button';
import { saveGloField } from '@/lib/glo-profile';

const OPTIONS = [
  { id: 'almost_always', label: 'Almost always', description: 'Every other purchase is a miss' },
  { id: 'sometimes',     label: 'Sometimes',      description: 'Maybe half the time' },
  { id: 'rarely',        label: 'Rarely',          description: 'I usually get it right' },
  { id: 'i_just_guess',  label: 'I just guess',   description: 'And hope for the best' },
] as const;

type PainId = (typeof OPTIONS)[number]['id'];

export default function FoundationPainScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<PainId | null>(null);
  const [brand, setBrand] = useState('');

  const handleContinue = async () => {
    await saveGloField({ foundation_pain: selected ?? '', usual_brand: brand.trim() });
    router.push('/(onboarding)/tone-guess');
  };

  return (
    <View style={[ob.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={9} total={11} onBack={() => router.back()} />

      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={ob.header}>
        <Text style={ob.title}>How often do you buy{'\n'}the wrong shade?</Text>
        <Text style={ob.sub}>Be honest — we're about to fix this.</Text>
      </Animated.View>

      <View style={ob.options}>
        {OPTIONS.map((opt, i) => (
          <Animated.View key={opt.id} entering={FadeInUp.delay(160 + i * 55).duration(400)}>
            <SelectCard
              label={opt.label}
              description={opt.description}
              active={selected === opt.id}
              onPress={() => setSelected(opt.id)}
            />
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInUp.delay(420).duration(500)} style={styles.brandSection}>
        <Text style={styles.brandLabel}>
          What brand do you usually buy?{' '}
          <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={styles.brandInput}
          placeholder="e.g. Fenty Beauty, MAC, Charlotte Tilbury…"
          placeholderTextColor={tokens.colors.grayLight}
          value={brand}
          onChangeText={setBrand}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={80}
        />
      </Animated.View>

      <View style={ob.spacer} />

      <Animated.View entering={FadeInUp.delay(500).duration(500)}>
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
  brandSection: { marginTop: 20 },
  brandLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '500',
    color: tokens.colors.text,
    marginBottom: 10,
  },
  optional: {
    fontWeight: '300',
    color: tokens.colors.grayLight,
  },
  brandInput: {
    backgroundColor: tokens.colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: tokens.colors.text,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
  },
  cta: { width: '100%' },
});
