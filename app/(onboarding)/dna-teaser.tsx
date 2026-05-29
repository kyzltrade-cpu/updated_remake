import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';
import { ob } from '@/components/onboarding-styles';
import { GlassButton } from '@/components/glass-button';
import type { DnaResult } from '@/lib/api/dna';

const LOCKED_ROWS = [
  { label: 'Face Shape' },
  { label: 'Brow Blueprint' },
  { label: 'Lash Profile' },
];

export default function DnaTeaserScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [dna, setDna] = useState<Partial<DnaResult> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('dna_result').then(raw => {
      if (raw) {
        try {
          setDna(JSON.parse(raw) as Partial<DnaResult>);
        } catch {
          setDna({});
        }
      } else {
        setDna({});
      }
    });
  }, []);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/email-capture');
  };

  const archetype     = dna?.archetype     ?? 'Your Archetype';
  const colourSeason  = dna?.colour_season ?? 'Colour Season';

  return (
    <View style={[ob.rootDark, styles.root, { paddingBottom: insets.bottom + 40 }]}>
      {/* Eyebrow */}
      <Animated.Text entering={FadeIn.delay(80).duration(700)} style={ob.eyebrowGold}>
        Your Beauty DNA ✦
      </Animated.Text>

      {/* "You're a…" lead-in */}
      <Animated.Text entering={FadeInUp.delay(200).duration(500)} style={styles.leadin}>
        You're a…
      </Animated.Text>

      {/* Archetype reveal */}
      <Animated.Text
        entering={ZoomIn.delay(350).duration(500).springify().damping(14)}
        style={styles.archetype}
      >
        {archetype}
      </Animated.Text>

      {/* Colour season pill */}
      <Animated.View entering={FadeInUp.delay(560).duration(400)} style={styles.seasonRow}>
        <View style={styles.seasonPill}>
          <Text style={styles.seasonText}>{colourSeason}</Text>
        </View>
      </Animated.View>

      {/* Divider */}
      <Animated.View entering={FadeIn.delay(640).duration(400)} style={styles.divider} />

      {/* Locked rows */}
      <Animated.View entering={FadeInUp.delay(680).duration(400)} style={styles.locked}>
        {LOCKED_ROWS.map(row => (
          <View key={row.label} style={styles.lockedRow}>
            <Text style={styles.lockedLabel}>{row.label}</Text>
            <View style={styles.lockedBar} />
          </View>
        ))}
        <View style={styles.lockedRow}>
          <Text style={styles.lockedLabel}>+ 3 personalised product kits</Text>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
      </Animated.View>

      <Animated.Text entering={FadeInUp.delay(740).duration(400)} style={styles.gateNote}>
        Create your free account to save and unlock your full Beauty DNA reveal.
      </Animated.Text>

      <View style={ob.spacer} />

      <Animated.View entering={FadeInUp.delay(780).duration(400)} style={ob.bottom}>
        <GlassButton
          title="Save My Results"
          onPress={handleSave}
          variant="primary"
          style={styles.cta}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 72,
  },
  leadin: {
    fontFamily: tokens.fonts.serif,
    fontSize: 20,
    fontStyle: 'italic',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    marginBottom: 6,
  },
  archetype: {
    fontFamily: tokens.fonts.serif,
    fontSize: 40,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 50,
    marginBottom: 16,
  },
  seasonRow: {
    flexDirection: 'row',
    marginBottom: 28,
  },
  seasonPill: {
    backgroundColor: 'rgba(212,175,55,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    borderRadius: 50,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  seasonText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '500',
    color: tokens.colors.gold,
    letterSpacing: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginBottom: 20,
  },
  locked: {
    gap: 12,
  },
  lockedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lockedLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.35)',
  },
  lockedBar: {
    height: 8,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 4,
  },
  lockIcon: {
    fontSize: 14,
    opacity: 0.5,
  },
  gateNote: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 24,
  },
  cta: {
    width: '100%',
  },
});
