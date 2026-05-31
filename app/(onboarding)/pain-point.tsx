import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { OnboardingHeader } from '@/components/onboarding-header';
import { CalCard } from '@/components/cal-card';
import { saveGloField } from '@/lib/glo-profile';
import { tokens } from '@/components/theme';

const OPTIONS = [
  { id: 'shade_match',  icon: '🎨', label: 'Shade matching',        description: 'Products look different on my skin' },
  { id: 'breakouts',    icon: '🔬', label: 'Breakouts & reactions',  description: 'Products irritate or clog my pores' },
  { id: 'longevity',    icon: '⏱️', label: 'Doesn\'t last',         description: 'Fades or transfers by midday' },
  { id: 'price',        icon: '💸', label: 'Wasting money',          description: 'Buying products that don\'t work' },
  { id: 'overwhelmed',  icon: '😵', label: 'Too many choices',       description: 'Can\'t decide what to buy' },
  { id: 'consistency',  icon: '📊', label: 'Lack of consistency',    description: 'My routine changes too often' },
] as const;

type Id = typeof OPTIONS[number]['id'];

export default function PainPointScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Set<Id>>(new Set());

  const toggle = (id: Id) => {
    Haptics.selectionAsync();
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await saveGloField({ pain_points: Array.from(selected) });
    router.push('/(onboarding)/allergies');
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 24 }]}>
      <OnboardingHeader step={13} total={18} onBack={() => router.back()} />

      <View style={styles.header}>
        <Text style={styles.title}>What's stopping{'\n'}you right now?</Text>
        <Text style={styles.sub}>Select all that apply.</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable
          onPress={handleContinue}
          style={[styles.cta, selected.size === 0 && styles.ctaDim]}
        >
          <Text style={styles.ctaText}>
            {selected.size === 0 ? 'None of these' : `Continue (${selected.size} selected)`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.cream },
  header: { paddingHorizontal: 28, paddingTop: 20, paddingBottom: 16 },
  title: { fontFamily: tokens.fonts.serif, fontSize: 32, fontWeight: '400', color: tokens.colors.text, lineHeight: 42, marginBottom: 8 },
  sub: { fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '300', color: tokens.colors.gray, lineHeight: 20 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 28, gap: 10, paddingBottom: 16 },
  bottom: { paddingHorizontal: 28, paddingTop: 12 },
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
  ctaDim: { backgroundColor: tokens.colors.grayLight, shadowOpacity: 0 },
  ctaText: { fontFamily: tokens.fonts.regular, fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
