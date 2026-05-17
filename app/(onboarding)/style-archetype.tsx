import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import * as Haptics from 'expo-haptics';
import { saveGloField } from '@/lib/glo-profile';

const VIBES = [
  {
    id: 'coquette_rose',
    label: 'Coquette Rose',
    palette: ['#D4A096', '#C97E8A', '#E8C4B0', '#F2DDD5'],
  },
  {
    id: 'soft_glam_glow',
    label: 'Soft Glam Glow',
    palette: ['#D4AF37', '#C9A86A', '#E8D4A0', '#F5ECD0'],
  },
  {
    id: 'balletcore_pearl',
    label: 'Balletcore Pearl',
    palette: ['#E8E0F0', '#D4C8E8', '#F8F0FF', '#C0B0D8'],
  },
  {
    id: 'old_money_pink',
    label: 'Old Money Pink',
    palette: ['#C9A8A0', '#B89090', '#D8C4BC', '#8A7870'],
  },
  {
    id: 'clean_girl',
    label: 'Clean Girl Minimal',
    palette: ['#F5F0EC', '#E8E0D8', '#D4C8C0', '#C0B0A8'],
  },
  {
    id: 'dark_femme',
    label: 'Dark Femme',
    palette: ['#4A2040', '#6A2848', '#8A3050', '#3A1030'],
  },
];

const PROGRESS = 7 / 7;

export default function StyleArchetypeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    Haptics.selectionAsync();
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(v => v !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const handleContinue = async () => {
    await saveGloField({ vibe_picks: selected });
    router.push('/(onboarding)/lighting');
  };

  const handleSkip = async () => {
    await saveGloField({ vibe_picks: [] });
    router.push('/(onboarding)/lighting');
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <View style={styles.progressFill} />
      </View>

      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
        <Text style={styles.step}>9 of 9</Text>
        <Text style={styles.title}>Which of these{'\n'}vibes feel like you?</Text>
        <Text style={styles.sub}>Pick up to 2 — or skip</Text>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {VIBES.map((vibe) => {
          const active = selected.includes(vibe.id);
          const maxed = selected.length >= 2 && !active;
          return (
            <Pressable
              key={vibe.id}
              onPress={() => !maxed && toggle(vibe.id)}
              style={[
                styles.card,
                active && styles.cardActive,
                maxed && styles.cardMuted,
              ]}
            >
              <View style={styles.palette}>
                {vibe.palette.map((color, i) => (
                  <View
                    key={i}
                    style={[styles.dot, { backgroundColor: color }]}
                  />
                ))}
              </View>
              <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>
                {vibe.label}
              </Text>
              {active && <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>}
            </Pressable>
          );
        })}
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.bottom}>
        <GlassButton
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          style={styles.cta}
          disabled={selected.length === 0}
        />
        <Pressable onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.beige,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 50,
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: tokens.colors.border,
  },
  progressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: tokens.colors.pinkDeep,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 10,
  },
  step: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    letterSpacing: 0.16,
    textTransform: 'uppercase',
    color: tokens.colors.grayLight,
    fontWeight: '500',
    marginBottom: 18,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 28,
    fontWeight: '400',
    color: tokens.colors.text,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 8,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '300',
    color: tokens.colors.gray,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: tokens.colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
  },
  cardActive: {
    borderColor: tokens.colors.pinkDeep,
    backgroundColor: tokens.colors.pinkLight,
  },
  cardMuted: {
    opacity: 0.4,
  },
  palette: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cardLabel: {
    flex: 1,
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: tokens.colors.text,
  },
  cardLabelActive: {
    color: tokens.colors.pinkRich,
    fontWeight: '500',
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: tokens.colors.pinkDeep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: tokens.colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  bottom: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
  },
  cta: {
    width: '100%',
  },
  skipBtn: {
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: tokens.colors.gray,
    textDecorationLine: 'underline',
  },
});
