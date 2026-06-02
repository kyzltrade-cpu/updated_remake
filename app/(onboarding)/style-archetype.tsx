import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { OnboardingHeader } from '@/components/onboarding-header';
import { CalCard } from '@/components/cal-card';
import { saveGloField } from '@/lib/glo-profile';
import { tokens } from '@/components/theme';
import { Star, Flame, Flower2, Leaf, Camera } from 'lucide-react-native';

const OPTIONS = [
  { id: 'natural',    icon: (active: boolean) => <Leaf size={20} color={active ? '#FFFFFF' : tokens.colors.pinkDeep} />, label: 'Natural',    description: 'Minimal, skin-first, effortless' },
  { id: 'glam',       icon: (active: boolean) => <Star size={20} color={active ? '#FFFFFF' : tokens.colors.pinkDeep} />, label: 'Glam',       description: 'Bold, dramatic, full glam' },
  { id: 'editorial',  icon: (active: boolean) => <Camera size={20} color={active ? '#FFFFFF' : tokens.colors.pinkDeep} />, label: 'Editorial',  description: 'Artistic, experimental, runway-inspired' },
  { id: 'classic',    icon: (active: boolean) => <Flower2 size={20} color={active ? '#FFFFFF' : tokens.colors.pinkDeep} />, label: 'Classic',    description: 'Timeless, polished, refined' },
  { id: 'streetwear', icon: (active: boolean) => <Flame size={20} color={active ? '#FFFFFF' : tokens.colors.pinkDeep} />, label: 'Streetwear', description: 'Cool, casual, urban edge' },
] as const;

type Id = typeof OPTIONS[number]['id'];

export default function StyleArchetypeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Id | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelect = (id: Id) => {

    setSelected(id);
    Haptics.selectionAsync();
    saveGloField({ archetype: id });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => router.push('/(onboarding)/validation'), 480);
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={9} total={18} onBack={() => router.back()} />
      <View style={styles.body}>
        <Text style={styles.title}>What's your{'\n'}beauty style?</Text>
        <Text style={styles.sub}>Helps match your vibe to the right formulas.</Text>
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
