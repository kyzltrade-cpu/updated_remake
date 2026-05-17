import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View, Text, StyleSheet, Pressable, Dimensions, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { DnaResult } from '@/lib/api/dna';
import { SEASON_DESCRIPTIONS, ARCHETYPE_DESCRIPTIONS } from '@/lib/api/dna';
import { useSubscription } from '@/contexts/subscription-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width: W, height: H } = Dimensions.get('window');

const PLACEHOLDER_DNA: DnaResult = {
  skinToneHex: '#C8906A',
  colorSeason: 'Warm Autumn',
  faceShape: 'Oval',
  browShape: 'Soft Arch',
  browSymmetryPct: 84,
  lashProfile: 'Long & Full',
  energy: 'Balanced',
  lipProfile: 'Warm Satin',
  blushProfile: 'Bronze Flush',
  archetype: 'The Natural',
  archetypeDescription: '',
};

// ── Lock placeholder ──────────────────────────────────────────────────────────

function LockedValue({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dotSize = size === 'lg' ? 22 : size === 'md' ? 16 : 12;
  const gap = size === 'lg' ? 6 : 4;
  return (
    <View style={[styles.lockedRow, { gap }]}>
      <MaterialIcons name="lock" size={dotSize * 0.7} color="rgba(200,168,130,0.45)" />
      <Text style={[styles.lockedDots, { fontSize: dotSize, letterSpacing: size === 'lg' ? 5 : 3 }]}>
        ●●●●●
      </Text>
    </View>
  );
}

// ── Slide renderers ───────────────────────────────────────────────────────────

function SlideCanvas({ dna, isLocked }: { dna: DnaResult; isLocked?: boolean }) {
  return (
    <View style={styles.page}>
      <LinearGradient
        colors={['#0A0807', dna.skinToneHex + '45', '#0A0807']}
        style={StyleSheet.absoluteFill}
      />
      {/* Ambient glow behind swatch */}
      {!isLocked && (
        <View style={[styles.canvasGlow, { backgroundColor: dna.skinToneHex, shadowColor: dna.skinToneHex }]} />
      )}
      <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.body}>
        <Text style={styles.slideEyebrow}>YOUR CANVAS</Text>
        <View style={[
          styles.canvasSwatch,
          { backgroundColor: dna.skinToneHex, shadowColor: isLocked ? 'transparent' : dna.skinToneHex },
        ]}>
          {isLocked && (
            <BlurView intensity={92} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 110 }]} />
          )}
        </View>
        {isLocked
          ? <LockedValue size="lg" />
          : <Text style={styles.hexCode}>{dna.skinToneHex.toUpperCase()}</Text>}
        <Text style={styles.slideTitle}>Foundation Shade</Text>
        <Text style={styles.slideText}>
          Your perfect foundation match — the shade that makes your skin glow instead of fight.
        </Text>
      </Animated.View>
    </View>
  );
}

function SlideSeason({ dna, isLocked }: { dna: DnaResult; isLocked?: boolean }) {
  const allSeasons = ['Spring', 'Summer', 'Autumn', 'Winter'];
  const userSeason = dna.colorSeason.split(' ').pop()!;
  const SWATCH: Record<string, string> = {
    Spring: '#F4A261', Summer: '#A8C4D5', Autumn: '#C8956A', Winter: '#7A8FBF',
  };
  return (
    <View style={styles.page}>
      <LinearGradient colors={['#0A0807', '#221510', '#0A0807']} style={StyleSheet.absoluteFill} />
      <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.body}>
        <Text style={styles.slideEyebrow}>COLOUR SEASON</Text>
        <Text style={styles.slideTitle}>Your Season</Text>

        <View style={styles.seasonGrid}>
          {allSeasons.map((s) => {
            const active = !isLocked && s === userSeason;
            return (
              <View key={s} style={[styles.seasonCard, active && styles.seasonCardActive]}>
                <View style={[
                  styles.seasonSwatch,
                  { backgroundColor: isLocked ? 'rgba(200,168,130,0.12)' : SWATCH[s] },
                  active && styles.seasonSwatchActive,
                ]} />
                <Text style={[styles.seasonLabel, active && styles.seasonLabelActive]}>{s}</Text>
              </View>
            );
          })}
        </View>

        {isLocked
          ? <LockedValue size="md" />
          : <Text style={styles.slideText}>
              You are a{' '}
              <Text style={[styles.accent, { color: SWATCH[userSeason] }]}>{dna.colorSeason}</Text>.
              {'\n'}{SEASON_DESCRIPTIONS[dna.colorSeason]}
            </Text>}
      </Animated.View>
    </View>
  );
}

function SlideFaceShape({ dna, isLocked }: { dna: DnaResult; isLocked?: boolean }) {
  const GLYPHS: Record<string, string> = {
    Oval: '⬭', Round: '○', Heart: '♡', Square: '□', Oblong: '▭',
  };
  return (
    <View style={styles.page}>
      <LinearGradient colors={['#0A0807', '#180E16', '#0A0807']} style={StyleSheet.absoluteFill} />
      <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.body}>
        <Text style={styles.slideEyebrow}>FACE SHAPE</Text>
        <Text style={[styles.shapeGlyph, isLocked && { opacity: 0.15 }]}>
          {isLocked ? '⬭' : (GLYPHS[dna.faceShape] ?? '⬭')}
        </Text>
        <Text style={styles.slideTitle}>Your Face Shape</Text>
        {isLocked
          ? <LockedValue size="lg" />
          : <Text style={styles.bigValue}>{dna.faceShape}</Text>}
        <Text style={styles.slideText}>
          {isLocked
            ? 'Your face shape sets every rule — brow placement, highlight zones, contour map. Unlock to see yours.'
            : `Your ${dna.faceShape.toLowerCase()} face has its own blueprint. Your coaching is built around it.`}
        </Text>
      </Animated.View>
    </View>
  );
}

function SlideBrows({ dna, isLocked }: { dna: DnaResult; isLocked?: boolean }) {
  return (
    <View style={styles.page}>
      <LinearGradient colors={['#0A0807', '#110F1A', '#0A0807']} style={StyleSheet.absoluteFill} />
      <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.body}>
        <Text style={styles.slideEyebrow}>BROW BLUEPRINT</Text>
        <View style={styles.browRing}>
          <View style={styles.browRingInner}>
            {isLocked
              ? <MaterialIcons name="lock" size={32} color="rgba(200,168,130,0.35)" />
              : <>
                  <Text style={styles.browPct}>{dna.browSymmetryPct}%</Text>
                  <Text style={styles.browLabel}>symmetry</Text>
                </>}
          </View>
        </View>
        <Text style={styles.slideTitle}>Your Brows</Text>
        {isLocked
          ? <LockedValue size="lg" />
          : <Text style={styles.bigValue}>{dna.browShape}</Text>}
        <Text style={styles.slideText}>
          {isLocked
            ? 'Brow adjustments create the single biggest visible shift in your face. Unlock your blueprint.'
            : `${dna.browShape} shape — small changes here, massive visible shift.`}
        </Text>
      </Animated.View>
    </View>
  );
}

function SlideLashes({ dna, isLocked }: { dna: DnaResult; isLocked?: boolean }) {
  return (
    <View style={styles.page}>
      <LinearGradient colors={['#0A0807', '#0C1209', '#0A0807']} style={StyleSheet.absoluteFill} />
      <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.body}>
        <Text style={styles.slideEyebrow}>LASH PROFILE</Text>
        <Text style={[styles.lashGlyph, isLocked && { opacity: 0.15 }]}>✦</Text>
        <Text style={styles.slideTitle}>Your Lashes</Text>
        {isLocked
          ? <LockedValue size="lg" />
          : <Text style={styles.bigValue}>{dna.lashProfile}</Text>}
        <Text style={styles.slideText}>
          {isLocked
            ? 'The right mascara technique transforms your natural profile into your signature feature. Unlock to find yours.'
            : `${dna.lashProfile} — the formula and technique that matches your profile exactly.`}
        </Text>
      </Animated.View>
    </View>
  );
}

function SlideEnergy({ dna, isLocked }: { dna: DnaResult; isLocked?: boolean }) {
  const POS: Record<string, number> = { Sharp: 0.1, Balanced: 0.5, Soft: 0.9 };
  const pos = isLocked ? 0.5 : (POS[dna.energy] ?? 0.5);
  return (
    <View style={styles.page}>
      <LinearGradient colors={['#0A0807', '#1C100E', '#0A0807']} style={StyleSheet.absoluteFill} />
      <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.body}>
        <Text style={styles.slideEyebrow}>ENERGY TYPE</Text>
        <Text style={styles.slideTitle}>Your Energy</Text>
        <View style={styles.spectrumWrap}>
          <Text style={styles.spectrumEndLabel}>Sharp</Text>
          <View style={styles.spectrumTrack}>
            <LinearGradient
              colors={['rgba(200,168,130,0.1)', 'rgba(200,168,130,0.4)', 'rgba(200,168,130,0.1)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[
              styles.spectrumDot,
              { left: `${pos * 100}%` as `${number}%` },
              isLocked && { backgroundColor: 'rgba(200,168,130,0.2)', borderColor: 'rgba(200,168,130,0.2)', shadowOpacity: 0 },
            ]} />
          </View>
          <Text style={styles.spectrumEndLabel}>Soft</Text>
        </View>
        {isLocked
          ? <LockedValue size="lg" />
          : <Text style={styles.bigValue}>{dna.energy}</Text>}
        <Text style={styles.slideText}>
          {isLocked
            ? 'Are you drawn to clean lines or blended warmth? Unlock to find where you fall.'
            : dna.energy === 'Sharp'
              ? 'Precision and graphic definition. Clean lines define your signature.'
              : dna.energy === 'Soft'
                ? 'Blended warmth. Depth through texture, not graphic edges.'
                : 'You move between precision and softness — your signature adapts.'}
        </Text>
      </Animated.View>
    </View>
  );
}

function SlideArchetype({ dna, isLocked }: { dna: DnaResult; isLocked?: boolean }) {
  return (
    <View style={styles.page}>
      <LinearGradient colors={['#0A0807', '#1C1310', '#0A0807']} style={StyleSheet.absoluteFill} />
      <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.body}>
        <Text style={styles.slideEyebrow}>BEAUTY ARCHETYPE</Text>
        <Text style={styles.youAre}>You are</Text>
        {isLocked
          ? <LockedValue size="lg" />
          : <Text style={styles.archetypeHero}>{dna.archetype}</Text>}
        <Text style={styles.slideText}>
          {isLocked
            ? 'Your archetype ties face shape, season, and energy into one identity. It changes how you shop, apply, and express. Unlock yours.'
            : ARCHETYPE_DESCRIPTIONS[dna.archetype]}
        </Text>
      </Animated.View>
    </View>
  );
}

function SlideLip({ dna, isLocked }: { dna: DnaResult; isLocked?: boolean }) {
  return (
    <View style={styles.page}>
      <LinearGradient colors={['#0A0807', '#1A0E12', '#0A0807']} style={StyleSheet.absoluteFill} />
      <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.body}>
        <Text style={styles.slideEyebrow}>LIP PROFILE</Text>
        <Text style={[styles.lashGlyph, isLocked && { opacity: 0.15 }]}>♡</Text>
        <Text style={styles.slideTitle}>Your Lips</Text>
        {isLocked
          ? <LockedValue size="lg" />
          : <Text style={styles.bigValue}>{dna.lipProfile}</Text>}
        <Text style={styles.slideText}>
          {isLocked
            ? 'Your natural lip tone shapes the finish that looks most alive on you. Unlock your profile.'
            : `${dna.lipProfile} — the finish that works with your natural lip tone, not against it.`}
        </Text>
      </Animated.View>
    </View>
  );
}

function SlideBlush({ dna, isLocked }: { dna: DnaResult; isLocked?: boolean }) {
  return (
    <View style={styles.page}>
      <LinearGradient colors={['#0A0807', '#180D0E', '#0A0807']} style={StyleSheet.absoluteFill} />
      <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.body}>
        <Text style={styles.slideEyebrow}>BLUSH PROFILE</Text>
        <Text style={[styles.lashGlyph, isLocked && { opacity: 0.15 }]}>◉</Text>
        <Text style={styles.slideTitle}>Your Blush</Text>
        {isLocked
          ? <LockedValue size="lg" />
          : <Text style={styles.bigValue}>{dna.blushProfile}</Text>}
        <Text style={styles.slideText}>
          {isLocked
            ? 'Blush placed wrong reads heavy or invisible. The right tone for your face changes everything. Unlock yours.'
            : `${dna.blushProfile} — your exact tone reads like a natural flush, nothing more.`}
        </Text>
      </Animated.View>
    </View>
  );
}

function SlideSummary({ dna, isLocked, onShare }: { dna: DnaResult; isLocked?: boolean; onShare: () => void }) {
  const rows = [
    { label: 'Foundation Tone', value: dna.skinToneHex.toUpperCase() },
    { label: 'Colour Season', value: dna.colorSeason },
    { label: 'Face Shape', value: dna.faceShape },
    { label: 'Brow Shape', value: dna.browShape },
    { label: 'Lash Profile', value: dna.lashProfile },
    { label: 'Lip Profile', value: dna.lipProfile },
    { label: 'Blush Profile', value: dna.blushProfile },
    { label: 'Archetype', value: dna.archetype },
  ];
  return (
    <View style={styles.page}>
      <LinearGradient colors={['#0A0807', '#1C1310', '#0A0807']} style={StyleSheet.absoluteFill} />
      <Animated.View entering={FadeInUp.delay(100).duration(500)} style={[styles.body, styles.summaryBody]}>
        <Text style={styles.slideEyebrow}>ALL RESULTS</Text>
        <Text style={styles.slideTitle}>Beauty Wrapped</Text>
        <View style={styles.summaryCard}>
          {rows.map((row, i) => (
            <View key={row.label} style={[styles.summaryRow, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              {isLocked
                ? <View style={styles.summaryLockedRow}>
                    <MaterialIcons name="lock" size={9} color="rgba(200,168,130,0.4)" />
                    <Text style={styles.summaryLockedDots}>●●●●</Text>
                  </View>
                : <Text style={styles.summaryValue}>{row.value}</Text>}
            </View>
          ))}
        </View>
        {!isLocked && (
          <Pressable style={styles.shareBtn} onPress={onShare}>
            <Text style={styles.shareBtnText}>Share your Beauty Card ↗</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

const SLIDE_COUNT = 10;

export default function DnaRevealScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ dna?: string; bypass?: string }>();
  const [dna, setDna] = useState<DnaResult | null>(null);
  const [current, setCurrent] = useState(0);
  const { subscription } = useSubscription();
  const isPro = subscription?.plan === 'pro' || (__DEV__ && params.bypass === '1');

  useEffect(() => {
    if (params.dna) {
      try { setDna(JSON.parse(params.dna) as DnaResult); return; } catch { /* fall through */ }
    }
    AsyncStorage.getItem('dna_result').then(raw => {
      if (raw) try { setDna(JSON.parse(raw) as DnaResult); } catch { /* ignore */ }
    });
  }, [params.dna]);

  const handleScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    if (idx !== current) {
      setCurrent(idx);
      Haptics.selectionAsync();
    }
  };

  const handleShare = () => { /* TODO: react-native-view-shot + expo-sharing */ };
  const handleClose = () => router.replace('/(main)/home');
  const handleUnlock = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(main)/paywall');
  };

  const displayDna = (isPro ? dna : null) ?? PLACEHOLDER_DNA;
  const locked = !isPro;

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScroll}
        style={StyleSheet.absoluteFill}
        contentContainerStyle={{ height: H }}
      >
        <SlideCanvas dna={displayDna} isLocked={locked} />
        <SlideSeason dna={displayDna} isLocked={locked} />
        <SlideFaceShape dna={displayDna} isLocked={locked} />
        <SlideBrows dna={displayDna} isLocked={locked} />
        <SlideLashes dna={displayDna} isLocked={locked} />
        <SlideEnergy dna={displayDna} isLocked={locked} />
        <SlideLip dna={displayDna} isLocked={locked} />
        <SlideBlush dna={displayDna} isLocked={locked} />
        <SlideArchetype dna={displayDna} isLocked={locked} />
        <SlideSummary dna={displayDna} isLocked={locked} onShare={handleShare} />
      </ScrollView>

      {/* Progress dots + close */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        {/* Spacer mirrors the close button width so dots sit dead-centre */}
        <View style={styles.headerSpacer} />
        <View style={styles.dotsWrap}>
          {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === current ? styles.dotActive : i < current ? styles.dotPast : styles.dotFuture,
              ]}
            />
          ))}
        </View>
        <Pressable hitSlop={12} style={styles.closeBtn} onPress={handleClose}>
          <Text style={styles.closeTxt}>✕</Text>
        </Pressable>
      </View>

      {/* Unlock strip */}
      {locked && (
        <Animated.View
          entering={FadeIn.delay(400).duration(500)}
          style={[styles.unlockWrap, { paddingBottom: insets.bottom + 20 }]}
          pointerEvents="box-none"
        >
          <LinearGradient
            colors={['transparent', 'rgba(10,8,7,0.97)']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Pressable
            style={({ pressed }) => [styles.unlockBtn, pressed && { opacity: 0.87 }]}
            onPress={handleUnlock}
          >
            <Text style={styles.unlockTxt}>Unlock Everything</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#1A1715" />
          </Pressable>
          <Text style={styles.unlockNote}>7-day free trial · Cancel anytime</Text>
        </Animated.View>
      )}

      {isPro && (
        <View style={[styles.counter, { bottom: insets.bottom + 20 }]}>
          <Text style={styles.counterTxt}>{current + 1} / {SLIDE_COUNT}</Text>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0807' },

  page: { width: W, flex: 1, justifyContent: 'center', alignItems: 'center' },
  body: {
    alignItems: 'center',
    paddingHorizontal: 28,
    gap: 20,
    paddingBottom: 160,
    width: W,
  },
  summaryBody: {
    gap: 16,
    paddingBottom: 100,
  },

  // Header
  header: {
    position: 'absolute', left: 0, right: 0, top: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 10,
    zIndex: 30,
  },
  headerSpacer: { width: 32 },
  dotsWrap: { flex: 1, flexDirection: 'row', gap: 4, justifyContent: 'center', alignItems: 'center' },
  dot: { height: 3, borderRadius: 1.5 },
  dotActive: { width: 22, backgroundColor: '#FFF9F7' },
  dotPast: { width: 5, backgroundColor: 'rgba(255,249,247,0.5)' },
  dotFuture: { width: 5, backgroundColor: 'rgba(255,249,247,0.18)' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  closeTxt: { color: '#FFF9F7', fontSize: 14 },

  // Unlock strip
  unlockWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    zIndex: 30, alignItems: 'center', gap: 10,
    paddingTop: 60, paddingHorizontal: 28,
  },
  unlockBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, width: '100%', paddingVertical: 16,
    borderRadius: 50, backgroundColor: '#C8A882',
  },
  unlockTxt: {
    fontFamily: 'Inter', fontSize: 15, fontWeight: '700',
    color: '#1A1715', letterSpacing: 0.2,
  },
  unlockNote: {
    fontFamily: 'Inter', fontSize: 11,
    color: 'rgba(255,249,247,0.32)', letterSpacing: 0.2,
  },

  // Counter
  counter: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 30 },
  counterTxt: { fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,249,247,0.38)', letterSpacing: 1 },

  // Common typography
  slideEyebrow: {
    fontFamily: 'Inter', fontSize: 10, fontWeight: '700',
    letterSpacing: 3, color: 'rgba(200,168,130,0.6)',
    textTransform: 'uppercase', marginBottom: -6,
  },
  slideTitle: {
    fontFamily: 'Playfair Display', fontSize: 42, color: '#FFF9F7',
    textAlign: 'center', lineHeight: 50,
    marginBottom: 4,
  },
  slideText: {
    fontFamily: 'Inter', fontSize: 14, color: 'rgba(255,249,247,0.6)',
    textAlign: 'center', lineHeight: 24,
    maxWidth: W - 80,
  },
  accent: { fontStyle: 'italic', fontWeight: '600' },
  bigValue: {
    fontFamily: 'Playfair Display', fontSize: 32, color: '#C8A882',
    fontStyle: 'italic', textAlign: 'center', lineHeight: 40,
  },

  // Lock
  lockedRow: { flexDirection: 'row', alignItems: 'center' },
  lockedDots: { fontFamily: 'Inter', color: 'rgba(200,168,130,0.4)' },

  // Canvas
  canvasGlow: {
    position: 'absolute',
    width: W * 0.8, height: W * 0.8,
    borderRadius: W * 0.4,
    opacity: 0.1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 80,
  },
  canvasSwatch: {
    width: 220, height: 220, borderRadius: 110, overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.65, shadowRadius: 48,
  },
  hexCode: {
    fontFamily: 'Playfair Display', fontSize: 36, color: '#FFF9F7', letterSpacing: 3,
  },

  // Season
  seasonGrid: { flexDirection: 'row', gap: 10, marginVertical: 4 },
  seasonCard: {
    alignItems: 'center', gap: 10, paddingVertical: 18, paddingHorizontal: 10,
    borderRadius: 18, borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.07)',
    width: (W - 56 - 30) / 4,
  },
  seasonCardActive: {
    backgroundColor: 'rgba(200,168,130,0.12)',
    borderColor: '#C8A882',
  },
  seasonSwatch: { width: 52, height: 52, borderRadius: 26 },
  seasonSwatchActive: {
    shadowColor: '#C8956A', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 10,
  },
  seasonLabel: { fontFamily: 'Inter', fontSize: 10, fontWeight: '500', color: 'rgba(255,249,247,0.38)' },
  seasonLabelActive: { color: '#C8A882', fontWeight: '700' },

  // Face shape
  shapeGlyph: { fontSize: 130, color: 'rgba(200,168,130,0.7)', lineHeight: 140 },

  // Lash glyph
  lashGlyph: { fontSize: 80, color: 'rgba(200,168,130,0.6)', lineHeight: 90 },

  // Brows
  browRing: {
    width: 180, height: 180, borderRadius: 90,
    borderWidth: 1.5, borderColor: 'rgba(200,168,130,0.25)',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#C8A882', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2, shadowRadius: 24,
  },
  browRingInner: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 2, borderColor: '#C8A882',
    justifyContent: 'center', alignItems: 'center', gap: 4,
    shadowColor: '#C8A882', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 16,
  },
  browPct: { fontFamily: 'Playfair Display', fontSize: 44, color: '#FFF9F7', lineHeight: 50 },
  browLabel: { fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,249,247,0.45)', letterSpacing: 1.5, textTransform: 'uppercase' },

  // Energy spectrum
  spectrumWrap: { flexDirection: 'row', alignItems: 'center', gap: 16, width: W - 80 },
  spectrumEndLabel: { fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,249,247,0.4)', width: 36, textAlign: 'center' },
  spectrumTrack: {
    flex: 1, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(200,168,130,0.12)', position: 'relative', overflow: 'hidden',
  },
  spectrumDot: {
    position: 'absolute', top: -7,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#C8A882',
    borderWidth: 2.5, borderColor: '#1A1715',
    marginLeft: -9,
    shadowColor: '#C8A882', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7, shadowRadius: 8,
  },

  // Archetype
  youAre: {
    fontFamily: 'Inter', fontSize: 13, fontWeight: '400',
    color: 'rgba(255,249,247,0.4)', letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: -10,
  },
  archetypeHero: {
    fontFamily: 'Playfair Display', fontSize: 56, color: '#C8A882',
    textAlign: 'center', lineHeight: 64,
  },

  // Summary
  summaryCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(200,168,130,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 15, paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  summaryLabel: { fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,249,247,0.38)', letterSpacing: 0.3 },
  summaryValue: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: '#FFF9F7' },
  summaryLockedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryLockedDots: { fontFamily: 'Inter', fontSize: 10, color: 'rgba(200,168,130,0.3)', letterSpacing: 2 },
  shareBtn: {
    width: '100%', paddingVertical: 15, alignItems: 'center',
    borderRadius: 50, backgroundColor: '#C8A882',
  },
  shareBtnText: { fontFamily: 'Inter', fontSize: 14, fontWeight: '700', color: '#1A1715' },
});
