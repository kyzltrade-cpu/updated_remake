import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ob } from '@/components/onboarding-styles';
import { OnboardingHeader } from '@/components/onboarding-header';
import { SelectCard } from '@/components/select-card';
import { GlassButton } from '@/components/glass-button';
import { saveGloField } from '@/lib/glo-profile';

const VIBES = [
  { id: 'coquette_rose',    label: 'Coquette Rose',     palette: ['#D4A096', '#C97E8A', '#E8C4B0', '#F2DDD5'] },
  { id: 'soft_glam_glow',   label: 'Soft Glam Glow',    palette: ['#D4AF37', '#C9A86A', '#E8D4A0', '#F5ECD0'] },
  { id: 'balletcore_pearl', label: 'Balletcore Pearl',   palette: ['#E8E0F0', '#D4C8E8', '#F8F0FF', '#C0B0D8'] },
  { id: 'old_money_pink',   label: 'Old Money Pink',     palette: ['#C9A8A0', '#B89090', '#D8C4BC', '#8A7870'] },
  { id: 'clean_girl',       label: 'Clean Girl Minimal', palette: ['#F5F0EC', '#E8E0D8', '#D4C8C0', '#C0B0A8'] },
  { id: 'dark_femme',       label: 'Dark Femme',         palette: ['#4A2040', '#6A2848', '#8A3050', '#3A1030'] },
] as const;

type VibeId = (typeof VIBES)[number]['id'];

function PaletteDots({ colors }: { colors: readonly string[] }) {
  return (
    <View style={styles.palette}>
      {colors.map((color, j) => (
        <View key={j} style={[styles.dot, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

export default function StyleArchetypeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<VibeId[]>([]);

  const toggle = (id: VibeId) => {
    Haptics.selectionAsync();
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(v => v !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const advance = async (picks: VibeId[]) => {
    await saveGloField({ vibe_picks: picks });
    router.push('/(onboarding)/profile-building');
  };

  return (
    <View style={[ob.root, { paddingBottom: insets.bottom + 20 }]}>
      <OnboardingHeader step={11} total={11} onBack={() => router.back()} />

      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={ob.header}>
        <Text style={ob.title}>Which vibes{'\n'}feel like you?</Text>
        <Text style={ob.sub}>Pick up to 2 — or skip.</Text>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {VIBES.map((vibe, i) => (
          <Animated.View key={vibe.id} entering={FadeInUp.delay(160 + i * 50).duration(400)}>
            <SelectCard
              label={vibe.label}
              left={<PaletteDots colors={vibe.palette} />}
              active={selected.includes(vibe.id)}
              onPress={() => toggle(vibe.id)}
              disabled={selected.length >= 2 && !selected.includes(vibe.id)}
            />
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <GlassButton
          title="Continue"
          onPress={() => advance(selected)}
          variant="primary"
          style={styles.cta}
          disabled={selected.length === 0}
        />
        <Pressable onPress={() => advance([])}>
          <Text style={ob.skipLink}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { gap: 10, paddingBottom: 12 },
  palette: {
    flexDirection: 'row',
    gap: 3,
    flexShrink: 0,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  bottom: {
    gap: 12,
    paddingTop: 8,
  },
  cta: { width: '100%' },
});
