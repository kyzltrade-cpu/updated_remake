import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import * as Haptics from 'expo-haptics';
import { loadGloDraft, type GloProfileDraft } from '@/lib/glo-profile';

const UNDERTONE_COLORS: Record<string, string> = {
  warm: '#D4A96A',
  cool: '#A090B8',
  neutral: '#B8A090',
};

const UNDERTONE_LABELS: Record<string, string> = {
  warm: 'Warm',
  cool: 'Cool',
  neutral: 'Neutral',
};

export default function RevealScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Partial<GloProfileDraft> | null>(null);

  useEffect(() => {
    loadGloDraft().then(setProfile);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const undertone = profile?.undertone ?? 'warm';
  const undertoneColor = UNDERTONE_COLORS[undertone] ?? UNDERTONE_COLORS.warm;
  const undertoneLabel = UNDERTONE_LABELS[undertone] ?? 'Warm';
  const archetype = profile?.archetype ?? 'Coquette Rose';
  const skinType = profile?.skin_type ?? 'normal';
  const season = profile?.colour_season ?? 'Autumn Warm';

  const handleUnlock = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/pricing');
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100).duration(800)} style={styles.header}>
        <Text style={styles.tag}>Your profile</Text>
        <Text style={styles.title}>Here's what{'\n'}we found.</Text>
      </Animated.View>

      {/* Undertone reveal */}
      <Animated.View entering={FadeInUp.delay(300).duration(700)} style={styles.heroCard}>
        <View style={styles.heroSwatch}>
          <View style={[styles.swatchOuter, { borderColor: undertoneColor + '40' }]}>
            <View style={[styles.swatchInner, { backgroundColor: undertoneColor }]} />
          </View>
        </View>
        <Text style={styles.heroLabel}>Your undertone</Text>
        <Text style={[styles.heroValue, { color: undertoneColor }]}>{undertoneLabel}</Text>
        <Text style={styles.heroSub}>{season}</Text>
      </Animated.View>

      {/* Archetype + skin type — visible */}
      <Animated.View entering={FadeInUp.delay(500).duration(700)} style={styles.chips}>
        <View style={styles.chip}>
          <Text style={styles.chipIcon}>✦</Text>
          <Text style={styles.chipLabel}>{archetype}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipIcon}>◎</Text>
          <Text style={styles.chipLabel}>{skinType.charAt(0).toUpperCase() + skinType.slice(1)} skin</Text>
        </View>
      </Animated.View>

      {/* Locked section */}
      <Animated.View entering={FadeInUp.delay(700).duration(700)} style={styles.locked}>
        <View style={styles.lockedRow}>
          <Text style={styles.lockIcon}>🔒</Text>
          <View style={styles.lockedText}>
            <Text style={styles.lockedTitle}>Shade match · Ingredient safety · Style fit</Text>
            <Text style={styles.lockedSub}>Unlock your full product compatibility profile</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(900).duration(700)} style={styles.bottom}>
        <GlassButton
          title="Unlock My Profile"
          onPress={handleUnlock}
          variant="primary"
          style={styles.cta}
        />
        <Text style={styles.legal}>
          Start with a 7-day free trial. Cancel anytime.
        </Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  tag: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    letterSpacing: 0.16,
    textTransform: 'uppercase',
    color: tokens.colors.gray,
    fontWeight: '500',
    marginBottom: 14,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 32,
    fontWeight: '400',
    color: tokens.colors.text,
    textAlign: 'center',
    lineHeight: 42,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: tokens.colors.white,
    borderRadius: 24,
    padding: 28,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  heroSwatch: {
    marginBottom: 16,
  },
  swatchOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  heroLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    letterSpacing: 0.12,
    textTransform: 'uppercase',
    color: tokens.colors.gray,
    fontWeight: '500',
    marginBottom: 6,
  },
  heroValue: {
    fontFamily: tokens.fonts.serif,
    fontSize: 28,
    fontWeight: '400',
    marginBottom: 4,
  },
  heroSub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '300',
    color: tokens.colors.gray,
    fontStyle: 'italic',
  },
  chips: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: tokens.colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  chipIcon: {
    fontSize: 14,
    color: tokens.colors.pinkDeep,
  },
  chipLabel: {
    flex: 1,
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '500',
    color: tokens.colors.text,
  },
  locked: {
    flex: 1,
    justifyContent: 'center',
  },
  lockedRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    backgroundColor: tokens.colors.ivory,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderStyle: 'dashed',
  },
  lockIcon: {
    fontSize: 22,
  },
  lockedText: {
    flex: 1,
  },
  lockedTitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '500',
    color: tokens.colors.text,
    marginBottom: 4,
    lineHeight: 18,
  },
  lockedSub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '300',
    color: tokens.colors.gray,
  },
  bottom: {
    alignItems: 'center',
    gap: 10,
  },
  cta: {
    width: '100%',
  },
  legal: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: tokens.colors.grayLight,
    textAlign: 'center',
  },
});
