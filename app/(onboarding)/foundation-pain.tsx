import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { OnboardingHeader } from '@/components/onboarding-header';
import { CalCard } from '@/components/cal-card';
import { saveGloField } from '@/lib/glo-profile';
import { tokens } from '@/components/theme';
import { Clock, Palette, FlaskConical, Droplets, Sparkles } from 'lucide-react-native';

const OPTIONS = [
  { id: 'shade_match',  icon: (active: boolean) => <Palette size={20} color={active ? '#FFFFFF' : tokens.colors.pinkDeep} />, label: 'Finding my shade',          description: 'Always too light, too dark, or wrong tone' },
  { id: 'coverage',     icon: (active: boolean) => <Droplets size={20} color={active ? '#FFFFFF' : tokens.colors.pinkDeep} />, label: 'Getting the right coverage', description: 'Too cakey or doesn\'t cover enough' },
  { id: 'longevity',    icon: (active: boolean) => <Clock size={20} color={active ? '#FFFFFF' : tokens.colors.pinkDeep} />, label: 'It doesn\'t last',           description: 'Fades, oxidises, or transfers' },
  { id: 'ingredients',  icon: (active: boolean) => <FlaskConical size={20} color={active ? '#FFFFFF' : tokens.colors.pinkDeep} />, label: 'Ingredients & breakouts',    description: 'Reacts to formulas or clogs pores' },
  { id: 'no_problem',   icon: (active: boolean) => <Sparkles size={20} color={active ? '#FFFFFF' : tokens.colors.pinkDeep} />, label: 'No issues',                  description: 'Foundation works well for me' },
] as const;

type Id = typeof OPTIONS[number]['id'];

export default function FoundationPainScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Id | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelect = (id: Id) => {

    setSelected(id);
    Haptics.selectionAsync();
    saveGloField({ foundation_struggle: id });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => router.push('/(onboarding)/style-archetype'), 480);
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={8} total={18} onBack={() => router.back()} />
      <View style={styles.body}>
        <Text style={styles.title}>What's your biggest{'\n'}foundation struggle?</Text>
        <Text style={styles.sub}>We'll zero in on what fixes it.</Text>
        <View style={styles.options}>
          {OPTIONS.map((o, i) => (
            <CalCard
              key={o.id}
              icon={o.icon}
              label={o.label}
              description={o.description}
              active={selected === o.id}
              onPress={() => handleSelect(o.id)}

              index={i}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.cream },
  body: { paddingHorizontal: 28, paddingTop: 20 },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 32,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 42,
    marginBottom: 8,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '300',
    color: tokens.colors.gray,
    marginBottom: 28,
    lineHeight: 20,
  },
  options: { gap: 10 },
});
