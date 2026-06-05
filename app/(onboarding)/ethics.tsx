import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { OnboardingHeader } from '@/components/onboarding-header';
import { CalCard } from '@/components/cal-card';
import { saveGloField } from '@/lib/glo-profile';
import { tokens } from '@/components/theme';
import { Sparkles, Recycle, Leaf, Rabbit } from 'lucide-react-native';

const OPTIONS = [
  { id: 'vegan',         icon: (active: boolean) => <Leaf size={20} color={active ? '#FFFFFF' : tokens.colors.pinkDeep} />, label: 'Vegan',          description: 'No animal-derived ingredients' },
  { id: 'cruelty_free',  icon: (active: boolean) => <Rabbit size={20} color={active ? '#FFFFFF' : tokens.colors.pinkDeep} />, label: 'Cruelty-free',   description: 'Not tested on animals' },
  { id: 'clean',         icon: (active: boolean) => <Sparkles size={20} color={active ? '#FFFFFF' : tokens.colors.pinkDeep} />, label: 'Clean beauty',   description: 'Free from harmful chemicals' },
  { id: 'sustainable',   icon: (active: boolean) => <Recycle size={20} color={active ? '#FFFFFF' : tokens.colors.pinkDeep} />, label: 'Sustainable',    description: 'Eco-friendly packaging & practices' },
  { id: 'none',          icon: (active: boolean) => <Sparkles size={20} color={active ? '#FFFFFF' : tokens.colors.pinkDeep} />, label: 'No preference',  description: 'Any formula works for me' },
] as const;

type Id = typeof OPTIONS[number]['id'];

export default function EthicsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Set<Id>>(new Set());

  const toggle = (id: Id) => {
    Haptics.selectionAsync();
    if (id === 'none') {
      setSelected(new Set(['none']));
      return;
    }
    setSelected(prev => {
      const next = new Set(prev);
      next.delete('none');
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await saveGloField({ ethics: Array.from(selected) });
    router.push('/(onboarding)/uv-tracker');
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 24 }]}>
      <OnboardingHeader step={15} total={18} onBack={() => router.back()} />
      <View style={styles.body}>
        <Text style={styles.title}>Any product{'\n'}values?</Text>
        <Text style={styles.sub}>We'll filter recommendations to match. Select all that apply.</Text>
        <View style={styles.options}>
          {OPTIONS.map((o, i) => (
            <CalCard
              key={o.id}
              icon={o.icon}
              label={o.label}
              description={o.description}
              active={selected.has(o.id)}
              onPress={() => toggle(o.id)}
              index={i}
            />
          ))}
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <View style={styles.bottom}>
        <Pressable onPress={handleContinue} style={styles.cta}>
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.cream },
  body: { paddingHorizontal: 28, paddingTop: 20 },
  title: { fontFamily: tokens.fonts.serif, fontSize: 32, fontWeight: '400', color: tokens.colors.text, lineHeight: 42, marginBottom: 8 },
  sub: { fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '300', color: tokens.colors.gray, marginBottom: 28, lineHeight: 20 },
  options: { gap: 10 },
  bottom: { paddingHorizontal: 28 },
  cta: {
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 7,
  },
  ctaText: { fontFamily: tokens.fonts.regular, fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
