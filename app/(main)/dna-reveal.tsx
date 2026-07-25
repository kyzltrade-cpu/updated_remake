import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView, Linking, Image } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  FadeIn, FadeInUp,
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withSpring, withTiming, withDelay, withRepeat, withSequence,
  cancelAnimation, runOnJS, Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import Svg, { Defs, Filter, FeTurbulence, FeColorMatrix, Rect, Path, G, Pattern, Circle, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
const AnimatedPath = Animated.createAnimatedComponent(Path);
import type { DnaResult } from '@/lib/api/dna';
import { SEASON_DESCRIPTIONS, ARCHETYPE_DESCRIPTIONS, SEASON_PALETTES } from '@/lib/api/dna';
import { useSubscription } from '@/contexts/subscription-context';
import { useAuth } from '@/contexts/AuthContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { createClient } from '@/lib/supabase';
import { DnaShareCard, CARD_W, CARD_H } from '@/components/dna-share-card';
import { findShades } from '@/lib/api/shades';
import { getKitForDna, type CategoryKit, type ProductRec } from '@/lib/api/recommendations';
import { LiquidBackdrop } from '@/components/liquid-backdrop';
import { HolographicTracer } from '@/components/holographic-tracer';
import { tokens } from '@/components/theme';

const { width: W, height: H } = Dimensions.get('window');
const SLIDE_COUNT = 19; // +1 for opening slide, +1 for Eye Shape, +1 for Celebrity Match
const SLIDE_DURATION = 9000;
const SEG_GAP = 3;
const SEG_PAD = 14;
const SEG_W = (W - SEG_PAD * 2 - SEG_GAP * (SLIDE_COUNT - 1)) / SLIDE_COUNT;
const TRACK_W = W - 184;
const RISE_MS = 2400;

const PLACEHOLDER_DNA: DnaResult = {
  skinToneHex: '#C8906A',
  colorSeason: 'Warm Autumn',
  faceShape: 'Oval',
  browShape: 'Soft Arch',
  browSymmetryPct: 84,
  lashProfile: 'Long & Full',
  energy: 'Balanced',
  archetype: 'The Natural',
  archetypeDescription: '',
  lipProfile: 'Warm Satin',
  blushProfile: 'Bronze Flush',
};

// Two tracks: one for the journey (0–5), one for the reveal (6–10).
// Preload the reveal track on slide 2 so the crossfade is instant with no silence.
const MUSIC_JOURNEY = require('../../assets/sounds/t5.mp3');  // energetic build
const MUSIC_REVEAL  = require('../../assets/sounds/tf.mp3');  // peak energy, archetype reveal
const MUSIC_VOL = 0.75;

const MUSIC_REVEAL_SLIDE = 5;
const MUSIC_PRELOAD_SLIDE = 2;
const CROSSFADE_STEPS = 20;
const CROSSFADE_STEP_MS = 55; // 20 × 55ms = 1.1s crossfade

// ── Sparkles ──────────────────────────────────────────────────────────────────

const SCHARS = ['✦', '✧', '◉', '✿', '★', '♡'];
const SCOLORS = [
  'rgba(200,168,130,0.55)', 'rgba(255,249,247,0.28)',
  'rgba(200,168,130,0.38)', 'rgba(255,200,130,0.4)',
];

function Spark({ x, y, delay, color, char, size }: {
  x: number; y: number; delay: number; color: string; char: string; size: number;
}) {
  const ty = useSharedValue(0);
  const op = useSharedValue(0);
  useEffect(() => {
    ty.value = withDelay(delay, withRepeat(withTiming(-130, { duration: RISE_MS }), -1, false));
    op.value = withDelay(delay, withRepeat(
      withSequence(withTiming(0.9, { duration: 280 }), withTiming(0, { duration: RISE_MS - 280 })),
      -1, false,
    ));
  }, []);
  const sty = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }], opacity: op.value }));
  return (
    <Animated.Text style={[{ position: 'absolute', left: x, top: y, fontSize: size, color }, sty]}>
      {char}
    </Animated.Text>
  );
}

function Sparkles({ count = 9 }: { count?: number }) {
  const [sparks] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      x: 20 + Math.random() * (W - 44),
      y: H * 0.1 + Math.random() * H * 0.65,
      delay: Math.floor(Math.random() * 1200),
      color: SCOLORS[i % SCOLORS.length],
      char: SCHARS[i % SCHARS.length],
      size: 10 + Math.floor(Math.random() * 14),
    })),
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {sparks.map((s, i) => <Spark key={i} {...s} />)}
    </View>
  );
}

// ── Slide color palettes ──────────────────────────────────────────────────────

interface SlideColors {
  gradientTop: string;
  gradientBot: string;
  text: string;
  muted: string;
  eyebrow: string;
  accent: string;
  blobA: string;
  blobB: string;
}

const SLIDE_COLORS: SlideColors[] = [
  // 0 — Opening: STARK VIBRANT NEON HOT PINK (stark black text contrast)
  { 
    gradientTop: '#FF007F', gradientBot: '#E8006F', 
    blobA: '#FF5E97', blobB: '#000000', 
    text: '#0F0311', muted: 'rgba(15,3,17,0.75)', 
    eyebrow: '#0F0311', accent: '#0F0311' 
  },
  // 1 — Canvas: Soft Rose-Cream Alabaster (quiet luxury warm pastel theme)
  { 
    gradientTop: '#FFF8F6', gradientBot: '#FFF0EC', 
    blobA: '#FFD6EF', blobB: '#FFE6D9', 
    text: '#2E1E20', muted: 'rgba(46,30,32,0.65)', 
    eyebrow: '#D98A96', accent: '#F57FBF' 
  },
  // 3 — Season: Bright Silk Lavender & Mint (high-end cosmetic elegance)
  { 
    gradientTop: '#F8F6FC', gradientBot: '#EFF1F8', 
    blobA: '#EFCFFF', blobB: '#D8F7E5', 
    text: '#1E2530', muted: 'rgba(30,37,48,0.65)', 
    eyebrow: '#A092F0', accent: '#D4AF37' 
  },
  // 3 — Face Shape: Cashmere Cream-Blush (high-end warm editorial neutral theme)
  { 
    gradientTop: '#FAF6F0', gradientBot: '#F3EFE9', 
    blobA: '#FFDCE2', blobB: '#F5E6DC', 
    text: '#221518', muted: 'rgba(34,21,24,0.68)', 
    eyebrow: '#D98A96', accent: '#D98A96' 
  },
  // 5 — Brows: ULTRA RICH FOREST EMERALD (stark white & gold text contrast)
  { 
    gradientTop: '#004D40', gradientBot: '#00251A', 
    blobA: '#D4AF37', blobB: '#00796B', 
    text: '#FFFFFF', muted: 'rgba(255,255,255,0.72)', 
    eyebrow: '#D4AF37', accent: '#D4AF37' 
  },
  // 6 — Lashes: STARK DEEP INDIGO (glowing neon green contrast)
  { 
    gradientTop: '#1E1B4B', gradientBot: '#0F0E36', 
    blobA: '#00FF87', blobB: '#4F46E5', 
    text: '#FFFFFF', muted: 'rgba(255,255,255,0.7)', 
    eyebrow: '#00FF87', accent: '#00FF87' 
  },
  // 7 — Eye Shape: DEEP CHERRY RED (stark white & cyan contrast)
  { 
    gradientTop: '#4C0519', gradientBot: '#2D0011', 
    blobA: '#00F5FF', blobB: '#880E4F', 
    text: '#FFFFFF', muted: 'rgba(255,255,255,0.72)', 
    eyebrow: '#00F5FF', accent: '#00F5FF' 
  },
  // 8 — Celebrity Match: Starry gold over rich obsidian (stark white & coquette gold contrast)
  { 
    gradientTop: '#080206', gradientBot: '#12050E', 
    blobA: '#D4AF37', blobB: '#3F102F', 
    text: '#FFFFFF', muted: 'rgba(255,255,255,0.72)', 
    eyebrow: '#D4AF37', accent: '#D4AF37' 
  },
  // 9 — Energy: VIBRANT ACID LIME YELLOW (deep dark forest text contrast)
  { 
    gradientTop: '#CCFF00', gradientBot: '#B2EB00', 
    blobA: '#1A237E', blobB: '#E6FF00', 
    text: '#0C1A00', muted: 'rgba(12,26,0,0.75)', 
    eyebrow: '#0C1A00', accent: '#0C1A00' 
  },
  // 10 — Archetype: THE REVEAL (glowing hot pink over deep purple)
  { 
    gradientTop: '#110118', gradientBot: '#050008', 
    blobA: '#FF007F', blobB: '#880E4F', 
    text: '#FFFFFF', muted: 'rgba(255,255,255,0.75)', 
    eyebrow: '#FF007F', accent: '#FF007F' 
  },
  // 11 — Lips: DEEP gothic plum (stark white & neon pink contrast)
  { 
    gradientTop: '#1B001F', gradientBot: '#0D0017', 
    blobA: '#FF007F', blobB: '#4A148C', 
    text: '#FFFFFF', muted: 'rgba(255,255,255,0.72)', 
    eyebrow: '#FF007F', accent: '#FF007F' 
  },
  // 12 — Blush: VIBRANT ELECTRIC CORAL (dark navy text contrast)
  { 
    gradientTop: '#FF6F00', gradientBot: '#E65100', 
    blobA: '#1A237E', blobB: '#FFB300', 
    text: '#1C0600', muted: 'rgba(28,6,0,0.75)', 
    eyebrow: '#1C0600', accent: '#1C0600' 
  },
  // 13 — Foundation Recs/Kit 0: Deep luxury charcoal (gold and white contrast)
  { 
    gradientTop: '#0D0D0D', gradientBot: '#1A1A1A', 
    blobA: '#D4AF37', blobB: '#333333', 
    text: '#FFFFFF', muted: 'rgba(255,255,255,0.7)', 
    eyebrow: '#D4AF37', accent: '#D4AF37' 
  },
  // 14 — Blush Recs/Kit 1: STARK VIBRANT MAGENTA (black text contrast)
  { 
    gradientTop: '#D81B60', gradientBot: '#C2185B', 
    blobA: '#FFF0F5', blobB: '#880E4F', 
    text: '#0F0107', muted: 'rgba(15,1,7,0.75)', 
    eyebrow: '#0F0107', accent: '#0F0107' 
  },
  // 15 — Mascara Recs/Kit 2: Midnight navy (glowing electric purple contrast)
  { 
    gradientTop: '#050B24', gradientBot: '#0A133A', 
    blobA: '#8F5EFE', blobB: '#111A4D', 
    text: '#FFFFFF', muted: 'rgba(255,255,255,0.7)', 
    eyebrow: '#8F5EFE', accent: '#8F5EFE' 
  },
  // 16 — Eye Recs/Kit 3: VIBRANT LIME GREEN (stark black text contrast)
  { 
    gradientTop: '#00E676', gradientBot: '#00C853', 
    blobA: '#1B5E20', blobB: '#B9F6CA', 
    text: '#011A04', muted: 'rgba(1,26,4,0.75)', 
    eyebrow: '#011A04', accent: '#011A04' 
  },
  // 17 — Lip Recs/Kit 4: Deep velvet burgundy (stark white & cyan contrast)
  { 
    gradientTop: '#3E0313', gradientBot: '#1D000A', 
    blobA: '#00F5FF', blobB: '#5C061F', 
    text: '#FFFFFF', muted: 'rgba(255,255,255,0.7)', 
    eyebrow: '#00F5FF', accent: '#00F5FF' 
  },
  // 18 — Skincare Recs/Kit 5: ELECTRIC DEEP CYAN TEAL (neon yellow contrast)
  { 
    gradientTop: '#006064', gradientBot: '#00363A', 
    blobA: '#FFD700', blobB: '#00838F', 
    text: '#FFFFFF', muted: 'rgba(255,255,255,0.72)', 
    eyebrow: '#FFD700', accent: '#FFD700' 
  },
  // 19 — Summary/Finale: DEEP COSMIC NIGHT (pure gold and white contrast)
  { 
    gradientTop: '#0A0314', gradientBot: '#1C0838', 
    blobA: '#D4AF37', blobB: '#060108', 
    text: '#FFEEDD', muted: 'rgba(255,238,221,0.7)', 
    eyebrow: '#D4AF37', accent: '#D4AF37' 
  },
];

// ── Grain overlay (iOS renders, Android gracefully skips) ─────────────────────

// Pulsing glow orb — same energy as Beauty Wrapped, now slide-aware for perfect color harmony
function DnaPulseOrb({ colors }: { colors: SlideColors }) {
  const sc = useSharedValue(1);
  const al = useSharedValue(0.06);
  useEffect(() => {
    sc.value = withRepeat(withSequence(withTiming(1.12, { duration: 2200 }), withTiming(0.9, { duration: 2000 })), -1, true);
    al.value = withRepeat(withSequence(withTiming(0.12, { duration: 1800 }), withTiming(0.04, { duration: 2200 })), -1, true);
  }, []);
  const sty = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }], opacity: al.value }));
  const orbColor = colors.accent || '#E8399A';
  return (
    <Animated.View style={[
      dnaPulseOrbStyle, 
      { backgroundColor: orbColor, shadowColor: orbColor }, 
      sty
    ]} pointerEvents="none" />
  );
}
const dnaPulseOrbStyle = {
  position: 'absolute' as const, width: W * 0.85, height: W * 0.85, borderRadius: W * 0.425,
  top: H * 0.1, left: W * 0.075,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.4, shadowRadius: 80,
};

function GrainOverlay() {
  return (
    <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Filter id="grain" x="0%" y="0%" width="100%" height="100%">
          <FeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
          <FeColorMatrix type="saturate" values="0" />
        </Filter>
      </Defs>
      <Rect width={W} height={H} filter="url(#grain)" opacity={0.06} fill="white" />
    </Svg>
  );
}

// ── Morphing background — never remounts, crossfades between gradients ─────────

function MorphingBackground({ fromIdx, toIdx, morphProgress }: {
  fromIdx: number; toIdx: number; morphProgress: SharedValue<number>;
}) {
  const from = SLIDE_COLORS[fromIdx] ?? SLIDE_COLORS[0];
  const to = SLIDE_COLORS[toIdx] ?? SLIDE_COLORS[0];
  const toStyle = useAnimatedStyle(() => ({ opacity: morphProgress.value }));
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[from.gradientTop, from.gradientBot]}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, toStyle]}>
        <LinearGradient
          colors={[to.gradientTop, to.gradientBot]}
          start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// ── Persistent ambient — blobs + sparkles, never remounts, floats forever ──────

function PersistentAmbient({ fromIdx, toIdx, morphProgress }: {
  fromIdx: number; toIdx: number; morphProgress: SharedValue<number>;
}) {
  const txA = useSharedValue(0);
  const tyA = useSharedValue(0);
  const scA = useSharedValue(1);
  const txB = useSharedValue(0);
  const tyB = useSharedValue(0);
  const scB = useSharedValue(1);

  useEffect(() => {
    txA.value = withRepeat(withSequence(withTiming(35, { duration: 3800 }), withTiming(-25, { duration: 3200 })), -1, true);
    tyA.value = withRepeat(withSequence(withTiming(-30, { duration: 2900 }), withTiming(25, { duration: 3700 })), -1, true);
    scA.value = withRepeat(withSequence(withTiming(1.15, { duration: 3200 }), withTiming(0.88, { duration: 2800 })), -1, true);
    txB.value = withRepeat(withSequence(withTiming(-50, { duration: 2600 }), withTiming(38, { duration: 3400 })), -1, true);
    tyB.value = withRepeat(withSequence(withTiming(42, { duration: 3100 }), withTiming(-32, { duration: 2700 })), -1, true);
    scB.value = withRepeat(withSequence(withTiming(0.88, { duration: 2400 }), withTiming(1.1, { duration: 3000 })), -1, true);
  }, []);

  const styA = useAnimatedStyle(() => ({
    transform: [{ translateX: txA.value }, { translateY: tyA.value }, { scale: scA.value }],
  }));
  const styB = useAnimatedStyle(() => ({
    transform: [{ translateX: txB.value }, { translateY: tyB.value }, { scale: scB.value }],
  }));

  const fromC = SLIDE_COLORS[fromIdx] ?? SLIDE_COLORS[0];
  const toC = SLIDE_COLORS[toIdx] ?? SLIDE_COLORS[0];

  const blobFromStyle = useAnimatedStyle(() => ({ opacity: (1 - morphProgress.value) * 0.45 }));
  const blobToStyle = useAnimatedStyle(() => ({ opacity: morphProgress.value * 0.45 }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Blob A — primary, centered, slow drift */}
      <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, styA]}>
        <View style={{ width: W * 0.85, height: W * 0.85 }}>
          <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: W * 0.425, backgroundColor: fromC.blobA }, blobFromStyle]} />
          <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: W * 0.425, backgroundColor: toC.blobA }, blobToStyle]} />
        </View>
      </Animated.View>
      {/* Blob B — secondary, top-right offset, faster drift */}
      <Animated.View style={[{ position: 'absolute', top: H * 0.04, right: -W * 0.18 }, styB]}>
        <View style={{ width: W * 0.6, height: W * 0.6 }}>
          <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: W * 0.3, backgroundColor: fromC.blobB }, blobFromStyle]} />
          <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: W * 0.3, backgroundColor: toC.blobB }, blobToStyle]} />
        </View>
      </Animated.View>
      <Sparkles count={10} />
    </View>
  );
}

// ── Confetti burst ────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#FF2D78', '#FFFFFF', '#FFB3CC', '#FF80A8', '#FFC0CB', '#FFE4F0'];
const CONFETTI_CHARS = ['♡', '★', '✦', '◉', '✿'];

function ConfettiPiece({ angle, dist, delay, color, char }: {
  angle: number; dist: number; delay: number; color: string; char: string;
}) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const op = useSharedValue(1);
  const rot = useSharedValue(0);
  useEffect(() => {
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    x.value = withDelay(delay, withTiming(dx, { duration: 900 }));
    y.value = withDelay(delay, withTiming(dy + 120, { duration: 1100 }));
    op.value = withDelay(delay + 600, withTiming(0, { duration: 500 }));
    rot.value = withDelay(delay, withTiming(360, { duration: 1000 }));
  }, []);
  const sty = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${rot.value}deg` }],
    opacity: op.value,
  }));
  return <Animated.Text style={[{ position: 'absolute', fontSize: 16, color }, sty]}>{char}</Animated.Text>;
}

function ConfettiBurst({ count = 20 }: { count?: number }) {
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2,
      dist: 80 + Math.random() * 80,
      delay: Math.floor(Math.random() * 200),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      char: CONFETTI_CHARS[i % CONFETTI_CHARS.length],
    })),
  );
  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
      {pieces.map((p, i) => <ConfettiPiece key={i} {...p} />)}
    </View>
  );
}

// ── Content transitions — Z-axis push-through, direction-aware ───────────────

// Outgoing recedes: fades + scales down + drifts up. Fast — get out of the way.
function OutgoingContent({ children }: { children: React.ReactNode }) {
  const op = useSharedValue(1);
  const ty = useSharedValue(0);
  const sc = useSharedValue(1);
  useEffect(() => {
    op.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) });
    ty.value = withTiming(-12, { duration: 180, easing: Easing.out(Easing.quad) });
    sc.value = withTiming(0.96, { duration: 180, easing: Easing.out(Easing.quad) });
  }, []);
  const sty = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }, { scale: sc.value }],
  }));
  return <Animated.View style={[StyleSheet.absoluteFill, sty]}>{children}</Animated.View>;
}

// Incoming advances: scales up from slightly behind + drifts from direction hint.
// dir=1 → forward (hint from right), dir=-1 → back (hint from left).
function IncomingContent({ children, dir }: { children: React.ReactNode; dir: 1 | -1 }) {
  const op = useSharedValue(0);
  const ty = useSharedValue(16);
  const sc = useSharedValue(0.97);
  const tx = useSharedValue(dir * 8);
  useEffect(() => {
    op.value = withDelay(90, withTiming(1, { duration: 230, easing: Easing.out(Easing.quad) }));
    ty.value = withDelay(90, withSpring(0, { damping: 28, stiffness: 240 }));
    sc.value = withDelay(90, withSpring(1, { damping: 28, stiffness: 240 }));
    tx.value = withDelay(90, withSpring(0, { damping: 28, stiffness: 240 }));
  }, []);
  const sty = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }, { translateX: tx.value }, { scale: sc.value }],
  }));
  return <Animated.View style={[StyleSheet.absoluteFill, { opacity: 0 }, sty]}>{children}</Animated.View>;
}

// ── Slide reducer ─────────────────────────────────────────────────────────────

interface SlideState {
  current: number;
  outgoing: { idx: number; uid: number } | null;
  dir: 1 | -1;
  uid: number;
}

type SlideAction = { type: 'go'; to: number } | { type: 'done' };

function slideReducer(s: SlideState, a: SlideAction): SlideState {
  if (a.type === 'go') {
    if (a.to === s.current) return s;
    return { current: a.to, outgoing: { idx: s.current, uid: s.uid }, dir: a.to > s.current ? 1 : -1, uid: s.uid + 1 };
  }
  if (a.type === 'done') return { ...s, outgoing: null };
  return s;
}

// ── Lock placeholder ──────────────────────────────────────────────────────────

function LockedValue({ size = 'md', color = 'rgba(255,255,255,0.55)' }: { size?: 'sm' | 'md' | 'lg'; color?: string }) {
  const sz = size === 'lg' ? 22 : size === 'md' ? 16 : 12;
  return (
    <View style={[ds.lockedRow, { gap: size === 'lg' ? 6 : 4 }]}>
      <MaterialIcons name="lock" size={sz * 0.7} color={color} />
      <Text style={[ds.lockedDots, { fontSize: sz, letterSpacing: size === 'lg' ? 5 : 3, color }]}>●●●●●</Text>
    </View>
  );
}

// ── Progress segment ──────────────────────────────────────────────────────────

function ProgressSeg({ i, current, progress, textColor, trackColor }: { i: number; current: number; progress: SharedValue<number>; textColor: string; trackColor: string }) {
  const fillStyle = useAnimatedStyle(() => ({
    width: i < current ? SEG_W : i === current ? progress.value * SEG_W : 0,
  }));
  return (
    <View style={[ds.segTrack, { width: SEG_W, backgroundColor: trackColor }]}>
      <Animated.View style={[ds.segFill, { backgroundColor: textColor }, fillStyle]} />
    </View>
  );
}

// ── Sequential reveal helpers — Spotify Wrapped build-up ─────────────────────

// lift=true → text starts from screen center and springs up to its layout position
function RevealItem({ delay, fast = false, children }: { delay: number; fast?: boolean; children: React.ReactNode }) {
  const op = useSharedValue(0);
  const ty = useSharedValue(fast ? 0 : 24);
  const sc = useSharedValue(fast ? 1 : 0.7);
  useEffect(() => {
    if (fast) {
      op.value = withDelay(delay, withTiming(1, { duration: 110 }));
    } else {
      op.value = withDelay(delay, withTiming(1, { duration: 180 }));
      ty.value = withDelay(delay, withSpring(0, { damping: 200, stiffness: 280 }));
      sc.value = withDelay(delay, withSpring(1, { damping: 200, stiffness: 280 }));
    }
  }, []);
  const sty = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: ty.value }, { scale: sc.value }] }));
  return <Animated.View style={sty}>{children}</Animated.View>;
}

function RevealPop({ delay, children }: { delay: number; children: React.ReactNode }) {
  const op = useSharedValue(0);
  const sc = useSharedValue(0.55);
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 300 }));
    sc.value = withDelay(delay, withSpring(1, { damping: 9, stiffness: 100 }));
  }, []);
  const sty = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ scale: sc.value }] }));
  return <Animated.View style={sty}>{children}</Animated.View>;
}

// Bounces in from scale 0.2 — for large visual anchors (swatches, rings)
function PopIn({ delay, children }: { delay: number; children: React.ReactNode }) {
  const op = useSharedValue(0);
  const sc = useSharedValue(0.2);
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 200 }));
    sc.value = withDelay(delay, withSpring(1, { damping: 6, stiffness: 110 }));
  }, []);
  const sty = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ scale: sc.value }] }));
  return <Animated.View style={sty}>{children}</Animated.View>;
}

// Spins in — scale + rotation. Only for glyphs/icons where rotation is visible.
function SpinIn({ delay, children }: { delay: number; children: React.ReactNode }) {
  const op = useSharedValue(0);
  const sc = useSharedValue(0.2);
  const rot = useSharedValue(-25);
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 200 }));
    sc.value = withDelay(delay, withSpring(1, { damping: 7, stiffness: 100 }));
    rot.value = withDelay(delay, withSpring(0, { damping: 9, stiffness: 90 }));
  }, []);
  const sty = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ rotate: `${rot.value}deg` }, { scale: sc.value }],
  }));
  return <Animated.View style={sty}>{children}</Animated.View>;
}

// Falls from above — for eyebrows and category labels. Opposite of RevealItem.
function DropIn({ delay, children }: { delay: number; children: React.ReactNode }) {
  const op = useSharedValue(0);
  const ty = useSharedValue(-18);
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 220 }));
    ty.value = withDelay(delay, withSpring(0, { damping: 16, stiffness: 180 }));
  }, []);
  const sty = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: ty.value }] }));
  return <Animated.View style={sty}>{children}</Animated.View>;
}

// Slides in from left — for labels/elements on the left side of a pair
function SlideFromLeft({ delay, children }: { delay: number; children: React.ReactNode }) {
  const op = useSharedValue(0);
  const tx = useSharedValue(-44);
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 240 }));
    tx.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 170 }));
  }, []);
  const sty = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateX: tx.value }] }));
  return <Animated.View style={sty}>{children}</Animated.View>;
}

// Slides in from right — for labels/elements on the right side of a pair
function SlideFromRight({ delay, children }: { delay: number; children: React.ReactNode }) {
  const op = useSharedValue(0);
  const tx = useSharedValue(44);
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 240 }));
    tx.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 170 }));
  }, []);
  const sty = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateX: tx.value }] }));
  return <Animated.View style={sty}>{children}</Animated.View>;
}

// ── Word-by-word kinetic typography (Spotify Wrapped dynamic lyric effect) ──
function SingleWordReveal({ word, delay, style }: { word: string; delay: number; style: any }) {
  const op = useSharedValue(0);
  const ty = useSharedValue(22);
  const sc = useSharedValue(0.72);
  const rot = useSharedValue(-6);

  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) }));
    ty.value = withDelay(delay, withSpring(0, { damping: 14, stiffness: 120 }));
    sc.value = withDelay(delay, withSpring(1, { damping: 14, stiffness: 120 }));
    rot.value = withDelay(delay, withSpring(0, { damping: 14, stiffness: 120 }));
  }, []);

  const sty = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [
      { translateY: ty.value },
      { scale: sc.value },
      { rotate: `${rot.value}deg` },
    ],
  }));

  return (
    <Animated.Text style={[style, sty, { marginHorizontal: 2, marginVertical: 1 }]}>
      {word}
    </Animated.Text>
  );
}

function WordByWordReveal({ text, style, delay = 0 }: { text: string; style: any; delay?: number }) {
  const words = text.split(/(\s+)/); // Keep whitespace
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', width: '100%', paddingHorizontal: 10 }}>
      {words.map((word, i) => {
        if (word.trim().length === 0) {
          return <Text key={i}>{word}</Text>;
        }
        return (
          <SingleWordReveal key={i} word={word} delay={delay + i * 110} style={style} />
        );
      })}
    </View>
  );
}

// ── Flying cards for face shape (high physical-kinetic entries) ──
function FlyingCardLeft({ children, style }: { children: React.ReactNode; style: any }) {
  const tx = useSharedValue(-260);
  const rot = useSharedValue(-45);
  useEffect(() => {
    tx.value = withDelay(400, withSpring(0, { damping: 13, stiffness: 95 }));
    rot.value = withDelay(400, withSpring(-6, { damping: 13, stiffness: 95 }));
  }, []);
  const sty = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { rotate: `${rot.value}deg` }],
  }));
  return <Animated.View style={[style, sty]}>{children}</Animated.View>;
}

function FlyingCardRight({ children, style }: { children: React.ReactNode; style: any }) {
  const tx = useSharedValue(260);
  const rot = useSharedValue(45);
  useEffect(() => {
    tx.value = withDelay(600, withSpring(0, { damping: 13, stiffness: 95 }));
    rot.value = withDelay(600, withSpring(5, { damping: 13, stiffness: 95 }));
  }, []);
  const sty = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { rotate: `${rot.value}deg` }],
  }));
  return <Animated.View style={[style, sty]}>{children}</Animated.View>;
}

// ── Sweeping cosmetic brush stroke ──
function BrushStrokeSweep({ color, delay }: { color: string; delay: number }) {
  const drawProgress = useSharedValue(1);
  const pathLength = 260;

  useEffect(() => {
    drawProgress.value = 1;
    drawProgress.value = withDelay(delay, withTiming(0, { duration: 1800, easing: Easing.out(Easing.cubic) }));
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: drawProgress.value * pathLength,
  }));

  const sweepPath = 'M 10 50 C 40 10, 160 10, 190 50 C 210 70, 210 130, 180 150 C 120 190, 50 160, 20 120';

  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
      <Svg width="220" height="220" viewBox="0 0 200 200" style={{ overflow: 'visible', opacity: 0.28 }}>
        <AnimatedPath
          d={sweepPath}
          stroke={color}
          strokeWidth={28}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
}

// ── Premium holographic aesthetic card ──
function ArchetypeCard({ dna, colors, isLocked }: { dna: DnaResult; colors: any; isLocked?: boolean }) {
  const scale = useSharedValue(0.85);
  const rotation = useSharedValue(-8);
  const shineX = useSharedValue(-300);

  useEffect(() => {
    scale.value = withDelay(2500, withSpring(1, { damping: 10, stiffness: 80 }));
    rotation.value = withDelay(2500, withSpring(0, { damping: 10, stiffness: 80 }));
    shineX.value = withDelay(3200, withRepeat(
      withSequence(
        withTiming(300, { duration: 1800, easing: Easing.out(Easing.quad) }),
        withTiming(-300, { duration: 0 }),
        withDelay(3000, withTiming(-300, { duration: 0 })),
      ),
      -1, false,
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shineX.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, {
      width: W - 56,
      height: 170,
      borderRadius: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      padding: 18,
      justifyContent: 'space-between',
      overflow: 'hidden',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isLocked ? 0 : 0.15,
      shadowRadius: 24,
      marginVertical: 12,
    }]}>
      {/* Holographic Shine Overlay */}
      {!isLocked && (
        <Animated.View style={[shineStyle, StyleSheet.absoluteFill, { width: '200%', pointerEvents: 'none' }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.06)', 'rgba(255,192,203,0.18)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {/* Card Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5 }}>REMAKE BEAUTY ID</Text>
        <Text style={{ fontFamily: 'Playfair Display', fontSize: 13, fontStyle: 'italic', color: colors.accent, fontWeight: '600' }}>aesthetic</Text>
      </View>

      {/* Card Body */}
      <View style={{ gap: 4 }}>
        <Text style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Your Archetype</Text>
        {isLocked ? (
          <Text style={{ fontFamily: 'Inter', fontSize: 24, fontWeight: '700', color: 'rgba(255,255,255,0.15)', letterSpacing: 4 }}>●●●●●●●</Text>
        ) : (
          <Text style={{ fontFamily: 'Playfair Display', fontSize: 28, fontStyle: 'italic', color: '#FFF5F9', fontWeight: 'bold' }}>{dna.archetype}</Text>
        )}
      </View>

      {/* Card Footer */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 10 }}>
        <View>
          <Text style={{ fontFamily: 'Inter', fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Season</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: '600', color: colors.text }}>{isLocked ? '●●●' : dna.colorSeason}</Text>
        </View>
        <View>
          <Text style={{ fontFamily: 'Inter', fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Shape</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: '600', color: colors.text }}>{isLocked ? '●●●' : dna.faceShape}</Text>
        </View>
        <View>
          <Text style={{ fontFamily: 'Inter', fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Energy</Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: '600', color: colors.text }}>{isLocked ? '●●●' : dna.energy}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Lash star cluster — 5 stars that scatter from origin ─────────────────────

function LashStar({ delay, color, tx, ty, size }: {
  delay: number; color: string; tx: number; ty: number; size: number;
}) {
  const op = useSharedValue(0);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const sc = useSharedValue(0);
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 180 }));
    x.value = withDelay(delay, withSpring(tx, { damping: 7, stiffness: 80 }));
    y.value = withDelay(delay, withSpring(ty, { damping: 7, stiffness: 80 }));
    sc.value = withDelay(delay, withSpring(1, { damping: 5, stiffness: 90 }));
  }, []);
  const sty = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: sc.value }],
  }));
  return <Animated.Text style={[{ position: 'absolute', fontSize: size, color }, sty]}>✦</Animated.Text>;
}

function LashStars({ delay, color }: { delay: number; color: string }) {
  const stars = [
    { tx: 0,   ty: -58, size: 36 },
    { tx: -52, ty: -18, size: 22 },
    { tx: 52,  ty: -18, size: 22 },
    { tx: -34, ty: 34,  size: 16 },
    { tx: 34,  ty: 34,  size: 16 },
  ];
  return (
    <View style={{ width: 140, height: 120, alignItems: 'center', justifyContent: 'center' }}>
      {stars.map((s, i) => (
        <LashStar key={i} delay={delay + i * 90} color={color} tx={s.tx} ty={s.ty} size={s.size} />
      ))}
    </View>
  );
}

// ── Blush dot cluster — 3 circles in a triangle (like actual blush placement) ──

function BlushDot({ delay, hex, tx, ty, size, isLocked }: {
  delay: number; hex: string; tx: number; ty: number; size: number; isLocked?: boolean;
}) {
  const op = useSharedValue(0);
  const sc = useSharedValue(0);
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 200 }));
    sc.value = withDelay(delay, withSpring(1, { damping: 6, stiffness: 100 }));
  }, []);
  const sty = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ scale: sc.value }] }));
  return (
    <Animated.View style={[{
      position: 'absolute',
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: isLocked ? `${hex}40` : hex,
      shadowColor: hex, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isLocked ? 0 : 0.55, shadowRadius: size * 0.28,
      left: '50%', top: '50%',
      marginLeft: tx - size / 2, marginTop: ty - size / 2,
    }, sty]} />
  );
}

function BlushDots({ delay, hex, isLocked }: { delay: number; hex: string; isLocked?: boolean }) {
  const dots = [
    { tx: -42, ty: -10, size: 76 },
    { tx: 42,  ty: -10, size: 76 },
    { tx: 0,   ty: 46,  size: 58 },
  ];
  return (
    <View style={{ width: 160, height: 130, position: 'relative' }}>
      {dots.map((d, i) => (
        <BlushDot key={i} delay={delay + i * 180} hex={hex} tx={d.tx} ty={d.ty} size={d.size} isLocked={isLocked} />
      ))}
    </View>
  );
}

// ── Ripple rings — expanding concentric rings from a point, looping ──────────

function RippleRing({ color, ringDelay, size }: { color: string; ringDelay: number; size: number }) {
  const sc = useSharedValue(0.3);
  const op = useSharedValue(0);
  useEffect(() => {
    sc.value = withDelay(ringDelay, withRepeat(
      withTiming(2.6, { duration: 2600, easing: Easing.out(Easing.quad) }), -1, false,
    ));
    op.value = withDelay(ringDelay, withRepeat(
      withSequence(
        withTiming(0.6, { duration: 150 }),
        withTiming(0, { duration: 2450, easing: Easing.out(Easing.cubic) }),
      ),
      -1, false,
    ));
  }, []);
  const sty = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ scale: sc.value }] }));
  return (
    <Animated.View
      style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: color }, sty]}
      pointerEvents="none"
    />
  );
}

function RippleRings({ color, size = 180, delay = 0 }: { color: string; size?: number; delay?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
      <RippleRing color={color} ringDelay={delay} size={size} />
      <RippleRing color={color} ringDelay={delay + 870} size={size} />
      <RippleRing color={color} ringDelay={delay + 1740} size={size} />
    </View>
  );
}

// ── Season bars — animated bar chart for colour season ────────────────────────

function SeasonBar({ name, color, targetH, isActive, index, isLocked, textColor, mutedColor }: {
  name: string; color: string; targetH: number; isActive: boolean; index: number;
  isLocked?: boolean; textColor: string; mutedColor: string;
}) {
  const ht = useSharedValue(4);
  useEffect(() => {
    ht.value = withDelay(2000 + index * 140, withSpring(targetH, { damping: 15, stiffness: 85 }));
  }, []);
  const barSty = useAnimatedStyle(() => ({ height: ht.value }));
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
      <Animated.View style={[{
        width: '100%', borderRadius: 10,
        backgroundColor: isLocked ? `${color}35` : color,
        ...(isActive && !isLocked ? { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 14 } : {}),
      }, barSty]} />
      <Text style={{ fontFamily: 'Inter', fontSize: 9, letterSpacing: 0.8, color: isActive && !isLocked ? textColor : mutedColor, fontWeight: isActive ? '700' : '400' }}>
        {name.slice(0, 3).toUpperCase()}
      </Text>
    </View>
  );
}

// ── Symmetry bars — two bars growing from centre outward ──────────────────────

function SymmetryBars({ color }: { color: string }) {
  const w = useSharedValue(0);
  const BAR_HALF = (W - 100) / 2;
  useEffect(() => {
    w.value = withDelay(1800, withTiming(BAR_HALF, { duration: 1900, easing: Easing.out(Easing.cubic) }));
  }, []);
  const barSty = useAnimatedStyle(() => ({ width: w.value }));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', width: W - 56, marginTop: -8 }}>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <Animated.View style={[{ height: 2, borderRadius: 1, backgroundColor: `${color}50` }, barSty]} />
      </View>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginHorizontal: 3 }} />
      <View style={{ flex: 1, alignItems: 'flex-start' }}>
        <Animated.View style={[{ height: 2, borderRadius: 1, backgroundColor: `${color}50` }, barSty]} />
      </View>
    </View>
  );
}

// ── Burst dots — ✦ symbols radiating outward from a point ────────────────────

function BurstDot({ angle, color, delay }: { angle: number; color: string; delay: number }) {
  const d = useSharedValue(0);
  const op = useSharedValue(0);
  const rad = (angle * Math.PI) / 180;
  useEffect(() => {
    op.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 70 }),
      withDelay(300, withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) })),
    ));
    d.value = withDelay(delay, withTiming(110, { duration: 760, easing: Easing.out(Easing.cubic) }));
  }, []);
  const sty = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateX: Math.cos(rad) * d.value }, { translateY: Math.sin(rad) * d.value }],
  }));
  return <Animated.Text style={[{ position: 'absolute', fontSize: 11, color }, sty]}>✦</Animated.Text>;
}

function BurstDots({ color, delay = 0 }: { color: string; delay?: number }) {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <View style={{ width: 0, height: 0, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
      {angles.map((a, i) => (
        <BurstDot key={a} angle={a} color={color} delay={delay + i * 35} />
      ))}
    </View>
  );
}

// ── Custom cosmetic Brow Outline Tracer ──
function BrowTracer({ color }: { color: string }) {
  const drawProgress = useSharedValue(1);
  const pathLength = 120;

  useEffect(() => {
    drawProgress.value = 1;
    drawProgress.value = withDelay(1400, withSpring(0, { stiffness: 140, damping: 20 }));
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: drawProgress.value * pathLength,
  }));

  const leftBrow = 'M 20 52 C 32 36, 45 38, 48 44';
  const rightBrow = 'M 80 52 C 68 36, 55 38, 52 44';

  return (
    <View style={{ width: 140, height: 80, alignItems: 'center', justifyContent: 'center', marginVertical: 10 }}>
      <Svg width="140" height="80" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
        <G>
          <Path d={leftBrow} stroke="rgba(255, 255, 255, 0.1)" strokeWidth={3} fill="none" strokeLinecap="round" />
          <AnimatedPath
            d={leftBrow}
            stroke={color}
            strokeWidth={3.5}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={pathLength}
            animatedProps={animatedProps}
          />
          <Path d={rightBrow} stroke="rgba(255, 255, 255, 0.1)" strokeWidth={3} fill="none" strokeLinecap="round" />
          <AnimatedPath
            d={rightBrow}
            stroke={color}
            strokeWidth={3.5}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={pathLength}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
    </View>
  );
}

// ── Custom cosmetic Lash Sweep Tracer ──
function LashTracer({ color }: { color: string }) {
  const drawProgress = useSharedValue(1);
  const pathLength = 100;

  useEffect(() => {
    drawProgress.value = 1;
    drawProgress.value = withDelay(1400, withSpring(0, { stiffness: 150, damping: 22 }));
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: drawProgress.value * pathLength,
  }));

  const lid = 'M 20 58 C 40 42, 60 42, 80 58';
  const lashes = [
    'M 30 49 C 24 35, 18 32, 12 34',
    'M 40 46 C 36 28, 30 20, 24 24',
    'M 50 45 C 50 24, 50 14, 50 17',
    'M 60 46 C 64 28, 70 20, 76 24',
    'M 70 49 C 76 35, 82 32, 88 34',
  ];

  return (
    <View style={{ width: 140, height: 100, alignItems: 'center', justifyContent: 'center', marginVertical: 12 }}>
      <Svg width="140" height="100" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
        <G>
          <Path d={lid} stroke="rgba(255,255,255,0.12)" strokeWidth={2} fill="none" strokeLinecap="round" />
          {lashes.map((lash, idx) => (
            <AnimatedPath
              key={idx}
              d={lash}
              stroke={color}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={pathLength}
              animatedProps={animatedProps}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}

// ── Slide: Canvas ─────────────────────────────────────────────────────────────

// ── Cosmetic shade naming matrix for viral coquette beauty engagement ──────────
function getCosmeticColorName(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 200;
  const g = parseInt(clean.substring(2, 4), 16) || 150;
  const b = parseInt(clean.substring(4, 6), 16) || 110;
  
  // Calculate relative luminance to map to luxury skin-tone names
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  
  if (y > 220) return 'Vanilla Silk 🌸';
  if (y > 195) return 'Warm Ivory 🥐';
  if (y > 170) return 'Sunkissed Latte ☕️';
  if (y > 140) return 'Chai Sand 🐚';
  if (y > 115) return 'Glazed Almond 🌰';
  if (y > 90)  return 'Warm Honey 🍯';
  if (y > 65)  return 'Toasted Caramel 🍮';
  return 'Rich Espresso ☕️';
}

function SlideCanvas({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  const glAl = useSharedValue(0.1);
  const shades = isLocked ? null : findShades(dna.skinToneHex);

  // Staggered animated values
  const introOp = useSharedValue(0);
  const introY = useSharedValue(20);
  const introScale = useSharedValue(0.93);

  const bridgeOp = useSharedValue(0);
  const bridgeY = useSharedValue(20);
  const bridgeScale = useSharedValue(0.93);

  const revealOp = useSharedValue(0);
  const revealY = useSharedValue(30);

  const scale = useSharedValue(0.85);

  // Infinite organic floating vectors for silhouettes
  const floatL = useSharedValue(0);
  const floatR = useSharedValue(0);

  useEffect(() => {
    // 1. Cinematic slow-fade & slow-glide intro (completed at 3.6s)
    introOp.value = withSequence(
      withTiming(1, { duration: 1800 }), // Buttery slower fade-in
      withDelay(1000, withTiming(0, { duration: 800 })) // Slower fade-out
    );
    introY.value = withSequence(
      withTiming(0, { duration: 2000, easing: Easing.bezier(0.1, 0.8, 0.2, 1) }), // Luxurious slow-rise
      withDelay(800, withTiming(-20, { duration: 800 })) // Slower exit rise
    );
    // Continuous subtle zoom to keep the screen alive
    introScale.value = withTiming(1.04, { duration: 3600, easing: Easing.out(Easing.quad) });

    // 2. Cinematic slow-fade & slow-glide bridge (completed at 7.0s)
    bridgeOp.value = withSequence(
      withDelay(3800, withTiming(1, { duration: 1600 })), // Buttery slower fade-in
      withDelay(800, withTiming(0, { duration: 800 })) // Slower fade-out
    );
    bridgeY.value = withSequence(
      withDelay(3800, withTiming(0, { duration: 1800, easing: Easing.bezier(0.1, 0.8, 0.2, 1) })), // Luxurious slow-rise
      withDelay(600, withTiming(-20, { duration: 800 })) // Slower exit rise
    );
    // Continuous subtle zoom to keep the screen alive
    bridgeScale.value = withSequence(
      withDelay(3800, withTiming(0.93, { duration: 0 })),
      withDelay(3800, withTiming(1.04, { duration: 3200, easing: Easing.out(Easing.quad) }))
    );

    // 3. Final Reveal enters at 7200ms with a gorgeous luxurious spring
    revealOp.value = withDelay(7200, withTiming(1, { duration: 1000 }));
    revealY.value = withDelay(7200, withSpring(0, { damping: 12, stiffness: 80 }));
    scale.value = withDelay(7200, withSpring(1, { damping: 12, stiffness: 80 }));

    // Infinitely repeat slow vertical float
    floatL.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 2400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    floatR.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glAl.value = withRepeat(
      withSequence(withTiming(0.15, { duration: 1200 }), withTiming(0.05, { duration: 1200 })),
      -1, true
    );
  }, []);

  const introStyle = useAnimatedStyle(() => ({
    opacity: introOp.value,
    transform: [
      { translateY: introY.value },
      { scale: introScale.value }
    ],
  }));

  const bridgeStyle = useAnimatedStyle(() => ({
    opacity: bridgeOp.value,
    transform: [
      { translateY: bridgeY.value },
      { scale: bridgeScale.value }
    ],
  }));

  const revealStyle = useAnimatedStyle(() => ({
    opacity: revealOp.value,
    transform: [{ translateY: revealY.value }],
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: 55 }],
  }));

  const floatLStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatL.value }],
  }));

  const floatRStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatR.value }],
  }));

  const macShade = shades?.MAC ?? 'N/A';
  const fentyShade = shades?.Fenty ?? 'N/A';
  const cosmeticName = getCosmeticColorName(dna.skinToneHex);

  return (
    <View style={[ds.page, { backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }]}>
      
      {/* ── PHASE 1: INTRO NARRATIVE (0s - 2.8s) ── */}
      <Animated.View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }, introStyle]} pointerEvents="none">
        <Text style={{
          fontFamily: 'Inter',
          fontSize: 22,
          fontWeight: '600',
          color: colors.text,
          textAlign: 'center',
          lineHeight: 30,
          letterSpacing: -0.5,
          marginBottom: 10,
        }}>
          Struggling to find your perfect shade?
        </Text>
        <Text style={{
          fontFamily: 'Playfair Display',
          fontSize: 24,
          fontStyle: 'italic',
          color: colors.accent,
          textAlign: 'center',
        }}>
          Don't worry, we gotchu. ✦
        </Text>
      </Animated.View>

      {/* ── PHASE 2: BRIDGE (3.0s - 5.5s) ── */}
      <Animated.View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }, bridgeStyle]} pointerEvents="none">
        <Text style={{
          fontFamily: 'Playfair Display',
          fontSize: 32,
          fontStyle: 'italic',
          color: colors.text,
          textAlign: 'center',
          letterSpacing: 0.5,
        }}>
          Your perfect shade is...
        </Text>
      </Animated.View>

      {/* ── PHASE 3: THE REVEAL (5.8s onwards) ── */}
      <Animated.View style={[revealStyle, { paddingVertical: 80 }]}>
        
        {/* Makeup Silhouettes - Left Dropper Bottle */}
        <Animated.View style={[{ position: 'absolute', bottom: 60, left: 24, opacity: 0.28 }, floatLStyle]} pointerEvents="none">
          <Svg width="80" height="150" viewBox="0 0 80 150">
            {/* Dropper bulb */}
            <Path d="M 32 15 C 32 8, 48 8, 48 15 L 48 24 L 32 24 Z" fill="rgba(46,30,32,0.05)" stroke="rgba(46,30,32,0.08)" strokeWidth="1" />
            {/* Cap collar */}
            <Rect x="26" y="24" width="28" height="10" rx="2" fill="rgba(46,30,32,0.04)" stroke="rgba(46,30,32,0.08)" strokeWidth="1" />
            {/* Bottle shoulders and body */}
            <Path d="M 22 42 C 22 34, 58 34, 58 42 L 58 135 C 58 140, 22 140, 22 135 Z" fill="rgba(46,30,32,0.02)" stroke="rgba(46,30,32,0.08)" strokeWidth="1" />
            {/* Dropper pipette inside */}
            <Path d="M 38 34 L 38 115" stroke="rgba(46,30,32,0.06)" strokeWidth="1.2" />
            {/* Fluid level indicator */}
            <Path d="M 22 90 L 58 90" stroke="rgba(46,30,32,0.04)" strokeWidth="0.8" strokeDasharray="3 3" />
          </Svg>
        </Animated.View>

        {/* Makeup Silhouettes - Right Makeup Brush */}
        <Animated.View style={[{ position: 'absolute', bottom: 50, right: 24, opacity: 0.28 }, floatRStyle]} pointerEvents="none">
          <Svg width="70" height="170" viewBox="0 0 70 170">
            {/* Brush tapered handle */}
            <Path d="M 32 80 L 38 80 L 36 160 L 34 170 Z" fill="rgba(46,30,32,0.04)" stroke="rgba(46,30,32,0.06)" strokeWidth="1" />
            {/* Ferrule (metal band) */}
            <Rect x="26" y="52" width="18" height="28" rx="1" fill="rgba(46,30,32,0.05)" stroke="rgba(46,30,32,0.08)" strokeWidth="1" />
            {/* Flared brush bristles */}
            <Path d="M 26 52 C 22 35, 16 15, 35 10 C 54 15, 48 35, 44 52 Z" fill="rgba(46,30,32,0.03)" stroke="rgba(46,30,32,0.06)" strokeWidth="1" />
          </Svg>
        </Animated.View>

        {/* 3D Tunnel and Swatch (Moved lower, made bigger, main focus) */}
        <Animated.View style={[animatedStyle, { width: W, height: 320, alignItems: 'center', justifyContent: 'center', marginTop: 30 }]}>
          <View style={{ width: 320, height: 320, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            
            {/* Holographic Tunnel Rings (Behind Swatch) */}
            <Svg width="320" height="320" viewBox="0 0 100 100" style={StyleSheet.absoluteFill} pointerEvents="none">
              {/* Upper Tunnel Rings */}
              <Circle cx="50" cy="50" r="32" stroke="rgba(46,30,32,0.08)" strokeWidth="0.8" fill="none" />
              <Circle cx="50" cy="42" r="33" stroke="rgba(46,30,32,0.06)" strokeWidth="0.8" fill="none" />
              <Circle cx="50" cy="34" r="34" stroke="rgba(46,30,32,0.04)" strokeWidth="0.8" fill="none" />
              <Circle cx="50" cy="26" r="35" stroke="rgba(46,30,32,0.02)" strokeWidth="0.8" fill="none" />
              <Circle cx="50" cy="18" r="36" stroke="rgba(46,30,32,0.01)" strokeWidth="0.8" fill="none" />
              
              {/* Lower Tunnel Rings */}
              <Circle cx="50" cy="58" r="33" stroke="rgba(46,30,32,0.06)" strokeWidth="0.8" fill="none" />
              <Circle cx="50" cy="66" r="34" stroke="rgba(46,30,32,0.04)" strokeWidth="0.8" fill="none" />
              <Circle cx="50" cy="74" r="35" stroke="rgba(46,30,32,0.02)" strokeWidth="0.8" fill="none" />
              <Circle cx="50" cy="82" r="36" stroke="rgba(46,30,32,0.01)" strokeWidth="0.8" fill="none" />
            </Svg>

            {/* Central Skin Swatch (Englarged to 230x230, bold border, main focus) */}
            <View style={[ds.canvasSwatch, { 
              width: 230, 
              height: 230, 
              borderRadius: 115, 
              backgroundColor: dna.skinToneHex, 
              shadowColor: dna.skinToneHex, 
              shadowOpacity: 0.25, 
              shadowRadius: 18,
              borderWidth: 4, // Bold luxury white border
              borderColor: '#FFFFFF',
              overflow: 'hidden'
            }]}>
              {!isLocked && (
                <Animated.View style={[StyleSheet.absoluteFill, { width: '200%', pointerEvents: 'none' }]}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              )}
              {isLocked && <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />}
            </View>
          </View>
        </Animated.View>

        {/* Info Wrapper to keep Shade Box and Foundation Matches snug together */}
        <View style={{ width: '100%', alignItems: 'center', gap: 16 }}>
          {/* Outlined Box containing Shade Match Info in the Middle */}
          <View style={{ width: W - 56, alignSelf: 'center' }}>
            <View style={{
              borderWidth: 1,
              borderColor: 'rgba(46, 30, 32, 0.12)',
              paddingVertical: 18,
              paddingHorizontal: 24,
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.65)', // Elegant cream filled card
              borderRadius: 4, // Sharp, premium rectangle like reference image
            }}>
              <Text style={{
                fontFamily: 'Inter',
                fontSize: 12,
                fontWeight: '700',
                letterSpacing: 3,
                color: 'rgba(46, 30, 32, 0.55)',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>
                Your Perfect Shade
              </Text>
              <Text style={{
                fontFamily: 'Inter',
                fontSize: 22,
                fontWeight: '800',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                color: dna.skinToneHex,
                textAlign: 'center',
                marginBottom: 4,
              }}>
                {cosmeticName}
              </Text>
              <Text style={{
                fontFamily: 'Inter',
                fontSize: 11,
                fontWeight: '500',
                color: 'rgba(46, 30, 32, 0.45)',
                letterSpacing: 2,
              }}>
                {dna.skinToneHex.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Stats Below the Box at the Bottom */}
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{
              fontFamily: 'Inter',
              fontSize: 12,
              fontWeight: '600',
              color: colors.muted,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}>
              Your Foundation matches ✦
            </Text>
            
            {isLocked ? (
              <LockedValue size="lg" color="rgba(46, 30, 32, 0.4)" />
            ) : (
              <View style={{ alignItems: 'center', marginVertical: 4 }}>
                <Text style={{
                  fontFamily: 'Inter',
                  fontSize: 38,
                  fontWeight: '900',
                  color: colors.text,
                  letterSpacing: -1,
                }}>
                  {macShade} · {fentyShade}
                </Text>
                <Text style={{
                  fontFamily: 'Inter',
                  fontSize: 12,
                  fontWeight: '500',
                  color: colors.muted,
                  marginTop: 2,
                }}>
                  ( MAC Best Match  ·  Fenty Best Match )
                </Text>
              </View>
            )}

            {shades && (
              <Text style={{
                fontFamily: 'Inter',
                fontSize: 11,
                color: colors.muted,
                textAlign: 'center',
                marginTop: 6,
                maxWidth: W - 80,
                lineHeight: 16,
              }}>
                NARS: {shades.NARS}  ·  L'Oréal: {shades["L'Oréal"]}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// ── Slide: Season ─────────────────────────────────────────────────────────────

const SWATCH_SEASON: Record<string, string> = {
  'Warm Spring': '#E8744A', 'Light Spring': '#F4A090', 'Warm Autumn': '#B84C20', 'Deep Autumn': '#8B2810',
  'Cool Summer': '#C49098', 'Light Summer': '#E8B0BC', 'Deep Winter': '#8C0028', 'Cool Winter': '#780060',
};

const PALETTE_COLOR_NAMES: Record<string, string> = {
  '#E8744A': 'Sunset Coral', '#F0A882': 'Peach Silk', '#F5C86A': 'Honey Glaze', '#C86430': 'Spiced Amber',
  '#F4A090': 'Pastel Tulip', '#F9C8A8': 'Apricot Cream', '#F4D878': 'Soft Daffodil', '#E8906A': 'Sunkissed Clay',
  '#B84C20': 'Burnt Terracotta', '#C8774A': 'Warm Sienna', '#8B6914': 'Olive Bronze', '#6B3A1F': 'Chestnut Cocoa',
  '#8B2810': 'Spiced Cider', '#A84020': 'Maple Crimson', '#5C3418': 'Dark Walnut', '#3A1C0C': 'Espresso Wood',
  '#C49098': 'Dusty Rose', '#A8B0C8': 'Periwinkle Ice', '#B898C0': 'Orchid Mist', '#786880': 'Plum Velvet',
  '#E8B0BC': 'Petal Pink', '#C8D4E0': 'Mist Blue', '#D8C0E0': 'Lilac Quartz', '#A09098': 'Heather Gray',
  '#8C0028': 'Deep Ruby', '#1A2B70': 'Midnight Navy', '#1A5C38': 'Emerald Forest', '#500080': 'Royal Violet',
  '#780060': 'Wild Magenta', '#2840A0': 'Cobalt Spark', '#007060': 'Teal Crystal', '#483060': 'Amethyst Velvet',
};

function getSeasonDescription(season: string) {
  if (season.includes('Autumn')) return 'Rich, warm, and muted. Honey, olive, and gold tones bring out your effortless elegance. 🍁';
  if (season.includes('Summer')) return 'Muted, cool, and soft. Lavenders, dusty roses, and slate blues make your skin glow. 💎';
  if (season.includes('Spring')) return 'Bright, fresh, and warm. Peaches, corals, and gold tones match your vibrant radiant energy. 🍊';
  return 'High-contrast, bold, and icy. Rich black, sapphire, and pure white make your eyes pop. ❄️';
}

function SlideSeason({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  const palette = SEASON_PALETTES[dna.colorSeason] ?? [];
  const displayPalette = palette.length >= 4 ? palette.slice(0, 4) : ['#F4A261', '#E76F51', '#2A9D8F', '#E9C46A'];

  // Timings and Anim state
  const introOp = useSharedValue(0);
  const introY = useSharedValue(20);
  const introScale = useSharedValue(0.93);

  // Spinner position & scale animation
  const spinnerOp = useSharedValue(0);
  const spinnerScale = useSharedValue(0.1);
  const spinnerRotation = useSharedValue(0);
  const spinnerY = useSharedValue(0); // Starts perfectly centered at 0

  const revealOp = useSharedValue(0);
  const revealY = useSharedValue(20);

  // 4 Staggered Color Chip animations
  const chipOp1 = useSharedValue(0);
  const chipOp2 = useSharedValue(0);
  const chipOp3 = useSharedValue(0);
  const chipOp4 = useSharedValue(0);

  const chipY1 = useSharedValue(15);
  const chipY2 = useSharedValue(15);
  const chipY3 = useSharedValue(15);
  const chipY4 = useSharedValue(15);

  // High-frequency color cycling for spinner quadrants while active
  const color1 = useSharedValue('#FF6B6B');
  const color2 = useSharedValue('#4ECDC4');
  const color3 = useSharedValue('#FFE66D');
  const color4 = useSharedValue('#FF8E53');

  useEffect(() => {
    // 1. Phase 1: Intro Hook Text (0ms - 3.6s)
    introOp.value = withSequence(
      withTiming(1, { duration: 1800 }),
      withDelay(1000, withTiming(0, { duration: 800 }))
    );
    introY.value = withSequence(
      withTiming(0, { duration: 2000, easing: Easing.bezier(0.1, 0.8, 0.2, 1) }),
      withDelay(800, withTiming(-20, { duration: 800 }))
    );
    introScale.value = withTiming(1.04, { duration: 3600, easing: Easing.out(Easing.quad) });

    // 2. Phase 2: Spinner Active Animation (Enlarge & Spin: 3.8s - 7.6s)
    // Appear at 3.8s
    spinnerOp.value = withDelay(3800, withTiming(1, { duration: 400 }));
    
    // Scale sequence: 0.1 -> 2.3 (massive center expand) -> settles down to 1.65 as it moves up
    spinnerScale.value = withSequence(
      withDelay(3800, withTiming(2.3, { duration: 1800, easing: Easing.bezier(0.1, 0.8, 0.2, 1) })),
      withTiming(1.65, { duration: 2000, easing: Easing.bezier(0.1, 0.7, 0.1, 1) })
    );

    // Rotation sequence: fast spin -> slow deceleration braking
    spinnerRotation.value = withSequence(
      withDelay(3800, withTiming(1440, { duration: 1800, easing: Easing.linear })),
      withTiming(1800, { duration: 2000, easing: Easing.out(Easing.quad) })
    );

    // Vertical Position sequence: stays in center (0) -> glides elegantly to top (-H * 0.15) on deceleration
    spinnerY.value = withSequence(
      withDelay(3800, withTiming(0, { duration: 1800 })),
      withTiming(-H * 0.15, { duration: 2000, easing: Easing.bezier(0.1, 0.8, 0.2, 1) })
    );

    // 3. Phase 3: Final Card & Staggered Swatch Reveal at stop (7.8s onwards)
    revealOp.value = withDelay(7800, withTiming(1, { duration: 1000 }));
    revealY.value = withDelay(7800, withSpring(0, { damping: 13, stiffness: 85 }));

    // Staggered pop-in animations for the 4 swatches below the spinner
    chipOp1.value = withDelay(7800, withTiming(1, { duration: 600 }));
    chipY1.value = withDelay(7800, withSpring(0, { damping: 12, stiffness: 90 }));

    chipOp2.value = withDelay(7920, withTiming(1, { duration: 600 }));
    chipY2.value = withDelay(7920, withSpring(0, { damping: 12, stiffness: 90 }));

    chipOp3.value = withDelay(8040, withTiming(1, { duration: 600 }));
    chipY3.value = withDelay(8040, withSpring(0, { damping: 12, stiffness: 90 }));

    chipOp4.value = withDelay(8160, withTiming(1, { duration: 600 }));
    chipY4.value = withDelay(8160, withSpring(0, { damping: 12, stiffness: 90 }));

    // High-frequency color cycling timer while spinner is active
    let intervalId: ReturnType<typeof setInterval>;
    
    const cycleTimer = setTimeout(() => {
      intervalId = setInterval(() => {
        color1.value = `hsl(${Math.random() * 360}, 85%, 65%)`;
        color2.value = `hsl(${Math.random() * 360}, 85%, 65%)`;
        color3.value = `hsl(${Math.random() * 360}, 85%, 65%)`;
        color4.value = `hsl(${Math.random() * 360}, 85%, 65%)`;
      }, 70); // rapid cycle every 70ms
    }, 3800);

    const stopCycleTimer = setTimeout(() => {
      clearInterval(intervalId);
      // Smoothly transition from the last random cycle color to the actual user's palette colors over 1.4s!
      color1.value = withTiming(displayPalette[0], { duration: 1400, easing: Easing.bezier(0.1, 0.8, 0.2, 1) });
      color2.value = withTiming(displayPalette[1], { duration: 1400, easing: Easing.bezier(0.1, 0.8, 0.2, 1) });
      color3.value = withTiming(displayPalette[2], { duration: 1400, easing: Easing.bezier(0.1, 0.8, 0.2, 1) });
      color4.value = withTiming(displayPalette[3], { duration: 1400, easing: Easing.bezier(0.1, 0.8, 0.2, 1) });
    }, 6200); // starts transitioning right as deceleration kicks in

    // Super physical satisfying haptic timeline synced exactly with decelerating slot-ticks
    const h1 = setTimeout(() => { if (!isLocked) Haptics.selectionAsync(); }, 5600);
    const h2 = setTimeout(() => { if (!isLocked) Haptics.selectionAsync(); }, 5800);
    const h3 = setTimeout(() => { if (!isLocked) Haptics.selectionAsync(); }, 6050);
    const h4 = setTimeout(() => { if (!isLocked) Haptics.selectionAsync(); }, 6350);
    const h5 = setTimeout(() => { if (!isLocked) Haptics.selectionAsync(); }, 6700);
    const h6 = setTimeout(() => { if (!isLocked) Haptics.selectionAsync(); }, 7100);
    
    // Snaps to a dead stop with a juicy success notification haptic!
    const h7 = setTimeout(() => { 
      if (!isLocked) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 7600);

    return () => {
      clearTimeout(cycleTimer);
      clearTimeout(stopCycleTimer);
      clearTimeout(h1);
      clearTimeout(h2);
      clearTimeout(h3);
      clearTimeout(h4);
      clearTimeout(h5);
      clearTimeout(h6);
      clearTimeout(h7);
      clearInterval(intervalId);
    };
  }, []);

  const introStyle = useAnimatedStyle(() => ({
    opacity: introOp.value,
    transform: [
      { translateY: introY.value },
      { scale: introScale.value }
    ],
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: spinnerOp.value,
    transform: [
      { translateY: spinnerY.value },
      { scale: spinnerScale.value },
      { rotate: `${spinnerRotation.value}deg` }
    ],
  }));

  const revealStyle = useAnimatedStyle(() => ({
    opacity: revealOp.value,
    transform: [{ translateY: revealY.value }],
    width: '100%',
    alignItems: 'center',
  }));

  const chipStyle1 = useAnimatedStyle(() => ({ opacity: chipOp1.value, transform: [{ translateY: chipY1.value }] }));
  const chipStyle2 = useAnimatedStyle(() => ({ opacity: chipOp2.value, transform: [{ translateY: chipY2.value }] }));
  const chipStyle3 = useAnimatedStyle(() => ({ opacity: chipOp3.value, transform: [{ translateY: chipY3.value }] }));
  const chipStyle4 = useAnimatedStyle(() => ({ opacity: chipOp4.value, transform: [{ translateY: chipY4.value }] }));

  const qStyle1 = useAnimatedStyle(() => ({ backgroundColor: isLocked ? '#555' : color1.value }));
  const qStyle2 = useAnimatedStyle(() => ({ backgroundColor: isLocked ? '#444' : color2.value }));
  const qStyle3 = useAnimatedStyle(() => ({ backgroundColor: isLocked ? '#333' : color3.value }));
  const qStyle4 = useAnimatedStyle(() => ({ backgroundColor: isLocked ? '#666' : color4.value }));

  const seasonColor = SWATCH_SEASON[dna.colorSeason] ?? '#8A95A5';

  return (
    <View style={[ds.page, { backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }]}>
      
      {/* ── PHASE 1: NARRATIVE HOOK (0s - 3.6s) ── */}
      <Animated.View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }, introStyle]} pointerEvents="none">
        <Text style={{
          fontFamily: 'Inter',
          fontSize: 22,
          fontWeight: '600',
          color: colors.text,
          textAlign: 'center',
          lineHeight: 30,
          letterSpacing: -0.5,
          marginBottom: 10,
        }}>
          Do you not know your color palette?
        </Text>
        <Text style={{
          fontFamily: 'Playfair Display',
          fontSize: 24,
          fontStyle: 'italic',
          color: colors.accent,
          textAlign: 'center',
        }}>
          Let's analyze your skin chemistry. ✦
        </Text>
      </Animated.View>

      {/* ── PHASE 2: THE SPINNER (3.8s onwards) ── */}
      <Animated.View style={[spinnerStyle, {
        width: 172, height: 172, borderRadius: 86,
        borderWidth: 3, borderColor: '#8A95A5', // Sleek Platinum/Silver instead of clunky gold!
        backgroundColor: '#100708',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.45, shadowRadius: 20, elevation: 12,
        position: 'absolute',
        top: H * 0.38, // Center vertically inside viewport
      }]} pointerEvents="none">
        
        {/* Quadrant split circular wheel */}
        <View style={{ width: 160, height: 160, borderRadius: 80, overflow: 'hidden', flexWrap: 'wrap', flexDirection: 'row' }}>
          <Animated.View style={[{ width: 80, height: 80 }, qStyle1]} />
          <Animated.View style={[{ width: 80, height: 80 }, qStyle2]} />
          <Animated.View style={[{ width: 80, height: 80 }, qStyle3]} />
          <Animated.View style={[{ width: 80, height: 80 }, qStyle4]} />
        </View>

        {/* Delicate platinum dividing lines */}
        <View style={{ position: 'absolute', top: 85.5, left: 0, right: 0, height: 1, backgroundColor: '#8A95A5', opacity: 0.4 }} />
        <View style={{ position: 'absolute', left: 85.5, top: 0, bottom: 0, width: 1, backgroundColor: '#8A95A5', opacity: 0.4 }} />

        {/* Central emblem */}
        <View style={{
          position: 'absolute', width: 34, height: 34, borderRadius: 17,
          backgroundColor: '#1C0F11', borderWidth: 1, borderColor: '#8A95A5',
          justifyContent: 'center', alignItems: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2,
        }}>
          <Text style={{ fontFamily: 'Playfair Display', fontStyle: 'italic', fontSize: 13, color: '#8A95A5', fontWeight: 'bold' }}>R</Text>
        </View>
      </Animated.View>

      {/* ── PHASE 3: CENTERED 2x2 PALETTE GRID (7.8s onwards, fills the middle space beautifully) ── */}
      <Animated.View style={[revealStyle, {
        position: 'absolute',
        top: H * 0.53, // Perfectly mathematically centered vertically with equal top/bottom padding
        width: W,
        alignItems: 'center',
        gap: 12,
      }]}>
        
        {/* Row 1 */}
        <View style={{ flexDirection: 'row', gap: 14, justifyContent: 'center', width: W }}>
          <Animated.View style={[chipStyle1, {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.65)',
            borderWidth: 1,
            borderColor: 'rgba(138, 149, 165, 0.25)',
            borderRadius: 24,
            width: W * 0.44, // Slightly wider to fit texts comfortably
            height: 52, // Slightly taller to fit two lines beautifully
            paddingHorizontal: 8,
            gap: 8,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05, shadowRadius: 3,
          }]}>
            <View style={{
              width: 34, height: 34, borderRadius: 17,
              backgroundColor: displayPalette[0],
              borderWidth: 1, borderColor: '#8A95A5',
              shadowColor: displayPalette[0], shadowOpacity: 0.25, shadowRadius: 4,
            }} />
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text numberOfLines={1} style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: '800', color: colors.text, marginBottom: 1 }}>
                {PALETTE_COLOR_NAMES[displayPalette[0]] ?? 'Warm Glow'}
              </Text>
              <Text style={{ fontFamily: 'Inter', fontSize: 8.5, color: colors.muted, letterSpacing: 0.5 }}>
                {displayPalette[0].toUpperCase()}
              </Text>
            </View>
          </Animated.View>

          <Animated.View style={[chipStyle2, {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.65)',
            borderWidth: 1,
            borderColor: 'rgba(138, 149, 165, 0.25)',
            borderRadius: 24,
            width: W * 0.44,
            height: 52,
            paddingHorizontal: 8,
            gap: 8,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05, shadowRadius: 3,
          }]}>
            <View style={{
              width: 34, height: 34, borderRadius: 17,
              backgroundColor: displayPalette[1],
              borderWidth: 1, borderColor: '#8A95A5',
              shadowColor: displayPalette[1], shadowOpacity: 0.25, shadowRadius: 4,
            }} />
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text numberOfLines={1} style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: '800', color: colors.text, marginBottom: 1 }}>
                {PALETTE_COLOR_NAMES[displayPalette[1]] ?? 'Soft Dew'}
              </Text>
              <Text style={{ fontFamily: 'Inter', fontSize: 8.5, color: colors.muted, letterSpacing: 0.5 }}>
                {displayPalette[1].toUpperCase()}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Row 2 */}
        <View style={{ flexDirection: 'row', gap: 14, justifyContent: 'center', width: W }}>
          <Animated.View style={[chipStyle3, {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.65)',
            borderWidth: 1,
            borderColor: 'rgba(138, 149, 165, 0.25)',
            borderRadius: 24,
            width: W * 0.44,
            height: 52,
            paddingHorizontal: 8,
            gap: 8,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05, shadowRadius: 3,
          }]}>
            <View style={{
              width: 34, height: 34, borderRadius: 17,
              backgroundColor: displayPalette[2],
              borderWidth: 1, borderColor: '#8A95A5',
              shadowColor: displayPalette[2], shadowOpacity: 0.25, shadowRadius: 4,
            }} />
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text numberOfLines={1} style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: '800', color: colors.text, marginBottom: 1 }}>
                {PALETTE_COLOR_NAMES[displayPalette[2]] ?? 'Rich Velvet'}
              </Text>
              <Text style={{ fontFamily: 'Inter', fontSize: 8.5, color: colors.muted, letterSpacing: 0.5 }}>
                {displayPalette[2].toUpperCase()}
              </Text>
            </View>
          </Animated.View>

          <Animated.View style={[chipStyle4, {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.65)',
            borderWidth: 1,
            borderColor: 'rgba(138, 149, 165, 0.25)',
            borderRadius: 24,
            width: W * 0.44,
            height: 52,
            paddingHorizontal: 8,
            gap: 8,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05, shadowRadius: 3,
          }]}>
            <View style={{
              width: 34, height: 34, borderRadius: 17,
              backgroundColor: displayPalette[3],
              borderWidth: 1, borderColor: '#8A95A5',
              shadowColor: displayPalette[3], shadowOpacity: 0.25, shadowRadius: 4,
            }} />
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text numberOfLines={1} style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: '800', color: colors.text, marginBottom: 1 }}>
                {PALETTE_COLOR_NAMES[displayPalette[3]] ?? 'Icy Spark'}
              </Text>
              <Text style={{ fontFamily: 'Inter', fontSize: 8.5, color: colors.muted, letterSpacing: 0.5 }}>
                {displayPalette[3].toUpperCase()}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Undertone Temperature Slider Panel (Fills the space beautifully!) */}
        <Animated.View style={[chipStyle4, { width: W - 56, marginTop: 12, paddingHorizontal: 12 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: colors.muted, textTransform: 'uppercase' }}>
              Undertone Temperature
            </Text>
            <Text style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: '800', color: dna.colorSeason.includes('Warm') || dna.colorSeason.includes('Autumn') || dna.colorSeason.includes('Spring') ? '#C8774A' : '#788FA0', textTransform: 'uppercase', letterSpacing: 1 }}>
              {dna.colorSeason.includes('Warm') || dna.colorSeason.includes('Autumn') || dna.colorSeason.includes('Spring') ? 'Warm Golden ☀️' : 'Cool Icy ❄️'}
            </Text>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(30, 37, 48, 0.08)', position: 'relative', justifyContent: 'center' }}>
            {/* Color Gradient Track */}
            <LinearGradient
              colors={['#A8C4D5', '#EFCFFF', '#FFD6C4', '#F4A261']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Active Pointer */}
            <View style={{
              position: 'absolute',
              left: dna.colorSeason.includes('Warm') || dna.colorSeason.includes('Autumn') || dna.colorSeason.includes('Spring') ? '82%' : '18%',
              width: 14, height: 14, borderRadius: 7,
              backgroundColor: '#FFFFFF',
              borderWidth: 2.5, borderColor: '#8A95A5',
              shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2, shadowRadius: 2,
            }} />
          </View>
        </Animated.View>
      </Animated.View>

      {/* ── PHASE 3: THE REVEAL CARD (7.8s onwards) ── */}
      <Animated.View style={[revealStyle, { position: 'absolute', bottom: 60 }]}>
        {/* Filled and Frosted Glass Card Wrapper (High Contrast Light mode layout) */}
        <View style={{ width: W - 56, alignSelf: 'center' }}>
          <View style={{
            borderWidth: 1,
            borderColor: 'rgba(30, 37, 48, 0.12)', // high-contrast dark border
            paddingVertical: 20,
            paddingHorizontal: 24,
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.65)', // light frosted card
            borderRadius: 4, // sharp, premium rectangle
          }}>
            <Text style={{
              fontFamily: 'Inter',
              fontSize: 12,
              fontWeight: '700',
              letterSpacing: 3,
              color: 'rgba(30, 37, 48, 0.55)', // elegant dark slate gray text
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Your Color Season
            </Text>
            
            {isLocked ? (
              <LockedValue size="md" color="rgba(30, 37, 48, 0.4)" />
            ) : (
              <>
                <Text style={{
                  fontFamily: 'Inter',
                  fontSize: 22,
                  fontWeight: '800',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: seasonColor,
                  textAlign: 'center',
                  marginBottom: 6,
                }}>
                  {dna.colorSeason}
                </Text>
                
                <Text style={{
                  fontFamily: 'Inter',
                  fontSize: 12,
                  color: 'rgba(30, 37, 48, 0.65)', // high contrast, soft dark slate description
                  textAlign: 'center',
                  lineHeight: 18,
                  paddingHorizontal: 8,
                }}>
                  {getSeasonDescription(dna.colorSeason)}
                </Text>
              </>
            )}
          </View>
        </View>
      </Animated.View>

    </View>
  );
}

// ── Slide: Face Shape ─────────────────────────────────────────────────────────

const GLYPHS: Record<string, string> = {
  Oval: '⬭', Round: '○', Heart: '♡', Square: '□', Oblong: '▭',
};

// ── Slide: Face Shape ─────────────────────────────────────────────────────────

const SHAPE_SVGS: Record<string, string> = {
  'Oval': 'M 50,16 C 68,16 82,32 82,54 C 82,76 68,92 50,92 C 32,92 18,76 18,54 C 18,32 32,16 50,16 Z', // Smooth egg oval
  'Round': 'M 50,18 A 37,37 0 1,1 49.9,18 Z', // Circular orbital aligned
  'Heart': 'M 50,26 Q 68,10 82,27 C 92,38 84,62 50,92 C 16,62 8,38 18,27 Q 32,10 50,26 Z', // Heart outline
  'Square': 'M 20,20 L 80,20 C 85,20 85,20 85,25 L 85,85 C 85,90 80,92 75,92 L 25,92 C 20,92 15,90 15,85 L 15,25 C 15,20 15,20 20,20 Z', // Rounded jaw frame
  'Diamond': 'M 50,16 L 85,54 L 50,92 L 15,54 Z', // Geometric diamond
};

const SHAPE_DETAILS: Record<string, { label: string; desc: string; icon: string }> = {
  'Oval': {
    label: 'CLASSIC OVAL ✦',
    desc: 'The gold standard of balanced symmetry. Your bone structure features beautifully rounded jaw profiles and soft, high cheek verticality that matches classic ideal proportions. Absolutely effortless for any beauty style.',
    icon: 'face-retouching-natural'
  },
  'Round': {
    label: 'ROUND HARMONY ✦',
    desc: 'Your facial features possess gorgeous, soft circular geometry and youthful structural fullness. Your balanced cheek planes convey timeless symmetry, capturing a soft-focus radiant beauty that projects timeless youth.',
    icon: 'face'
  },
  'Heart': {
    label: 'SCULPTED HEART ✦',
    desc: 'Breathtaking structural elegance. Your face shape tapers dramatically from high, sweeping cheekbones down to a delicate, contoured chin profile. This architectural slenderness provides high-contrast shadow definitions.',
    icon: 'favorite-border'
  },
  'Square': {
    label: 'STRUCTURAL SQUARE ✦',
    desc: 'Elite architectural definition. Your structural jaw alignment presents a strong, high-fashion statement with sharp 90-degree chin angles and bold structural presence. It projects extreme luxury, power, and editorial confidence.',
    icon: 'crop-free'
  },
  'Diamond': {
    label: 'ANGULAR DIAMOND ✦',
    desc: 'Striking, high-fashion geometric complexity. Your high-contrast cheek zygomatic arches expand beautifully, tapering into a slender forehead and a pristine, sculpted chin. Exudes a highly refined, cinematic presence.',
    icon: 'diamond'
  }
};

const SHAPE_METRICS: Record<string, { angularity: string; strategy: string }> = {
  'Oval': { angularity: 'Balanced / Soft', strategy: 'Classic Glow' },
  'Round': { angularity: 'Soft & Fluid', strategy: 'Temples Blend' },
  'Heart': { angularity: 'High / Sculpted', strategy: 'Cheek Sweep' },
  'Square': { angularity: 'Bold / Defined', strategy: 'Soft Jawline' },
  'Diamond': { angularity: 'Sharp / High', strategy: 'High Cheek' },
};

const SilhouetteFaint = require('../../assets/images/user-silhouette.png');
const SilhouetteActive = require('../../assets/images/user-silhouette-active.png');

function SlideFaceShape({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  const shape = dna.faceShape || 'Oval';
  const svgPath = SHAPE_SVGS[shape] || SHAPE_SVGS['Oval'];
  const pathLength = 1000;

  // Timings and Anim state
  const introOp = useSharedValue(0);
  const introY = useSharedValue(20);
  const introScale = useSharedValue(0.93);

  const silhouetteOp = useSharedValue(0);
  const silhouetteScale = useSharedValue(0.9);
  const silhouetteY = useSharedValue(0);

  // Scan Line animation
  const scanLineY = useSharedValue(-130); // Y-offset from top of silhouette frame
  const scanLineOp = useSharedValue(0);

  // Detected shape trace progress
  const traceProgress = useSharedValue(1); // 1 = hidden, 0 = fully drawn
  const traceOp = useSharedValue(0);

  // Final Reveal Card Animation
  const cardOp = useSharedValue(0);
  const cardY = useSharedValue(20);

  const descOp = useSharedValue(0);
  const descY = useSharedValue(10);

  const triggerLightHaptic = () => {
    if (!isLocked) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const triggerSuccessHaptic = () => {
    if (!isLocked) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  useEffect(() => {
    // 1. Phase 1: Intro Narrative Text (0ms to 3.6s)
    introOp.value = withSequence(
      withTiming(1, { duration: 1800 }),
      withDelay(1000, withTiming(0, { duration: 800 }))
    );
    introY.value = withSequence(
      withTiming(0, { duration: 2000, easing: Easing.bezier(0.1, 0.8, 0.2, 1) }),
      withDelay(800, withTiming(-20, { duration: 800 }))
    );
    introScale.value = withTiming(1.04, { duration: 3600, easing: Easing.out(Easing.quad) });

    // 2. Phase 2: Silhouette & Scanning entrance (3.8s to 7.6s)
    // Silhouette fades in at 3.8s
    silhouetteOp.value = withDelay(3800, withTiming(0.68, { duration: 500 }));
    silhouetteScale.value = withDelay(3800, withSpring(1.08, { damping: 14, stiffness: 45 }));

    // Scan Line appears at 3.8s
    scanLineOp.value = withDelay(3800, withTiming(1, { duration: 300 }));
    // Sweep scan line downwards cleanly once
    scanLineY.value = withDelay(3800, withTiming(130, {
      duration: 2500,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1)
    }, (finished) => {
      if (finished) {
        scanLineOp.value = withTiming(0, { duration: 400 });
        runOnJS(triggerSuccessHaptic)();
      }
    }));

    // Trigger synchronized haptic ticks as the scanning sweep descends (3.8s to 6.3s)
    let intervalId: ReturnType<typeof setInterval>;
    const scanTimer = setTimeout(() => {
      intervalId = setInterval(() => {
        if (scanLineY.value > -120 && scanLineY.value < 125) {
          runOnJS(triggerLightHaptic)();
        }
      }, 70);
    }, 3800);

    // 3. Phase 3: The Reveal Card + Lock-on Trace (7.8s onwards)
    // Silhouette glides slightly up to make room
    silhouetteY.value = withDelay(7800, withTiming(-H * 0.15, { duration: 1800, easing: Easing.bezier(0.1, 0.8, 0.2, 1) }));

    // Fade in active trace and trace the SVG outline over her face
    traceOp.value = withDelay(7800, withTiming(1, { duration: 500 }));
    traceProgress.value = withDelay(7800, withTiming(0, {
      duration: 2000,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1)
    }));

    // Results card slides up
    cardOp.value = withDelay(7800, withTiming(1, { duration: 1000 }));
    cardY.value = withDelay(7800, withSpring(0, { damping: 13, stiffness: 85 }));

    // Editorial description fades in
    descOp.value = withDelay(8400, withTiming(1, { duration: 800 }));
    descY.value = withDelay(8400, withSpring(0, { damping: 15, stiffness: 90 }));

    return () => {
      clearTimeout(scanTimer);
      clearInterval(intervalId);
    };
  }, []);

  const introStyle = useAnimatedStyle(() => ({
    opacity: introOp.value,
    transform: [
      { translateY: introY.value },
      { scale: introScale.value }
    ],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: silhouetteOp.value,
    transform: [
      { scale: silhouetteScale.value },
      { translateY: silhouetteY.value }
    ],
  }));

  const scanStyle = useAnimatedStyle(() => ({
    opacity: scanLineOp.value,
    transform: [
      { translateY: scanLineY.value + silhouetteY.value }
    ],
  }));

  const traceStyle = useAnimatedStyle(() => ({
    opacity: traceOp.value,
    transform: [
      { scale: silhouetteScale.value },
      { translateY: silhouetteY.value }
    ],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOp.value,
    transform: [{ translateY: cardY.value }],
  }));

  const descStyle = useAnimatedStyle(() => ({
    opacity: descOp.value,
    transform: [{ translateY: descY.value }],
  }));

  const viewfinderStyle = useAnimatedStyle(() => ({
    opacity: scanLineOp.value,
    transform: [
      { scale: silhouetteScale.value },
      { translateY: silhouetteY.value }
    ],
  }));

  const scanIndicatorStyle = useAnimatedStyle(() => ({
    opacity: scanLineOp.value,
    position: 'absolute',
    bottom: H * 0.14,
    alignItems: 'center',
    gap: 6,
  }));

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: traceProgress.value * pathLength,
  }));

  const details = SHAPE_DETAILS[shape] || SHAPE_DETAILS['Oval'];

  const metrics = SHAPE_METRICS[shape] || SHAPE_METRICS['Oval'];
  const displayAngularity = isLocked ? '••••••••' : metrics.angularity;
  const displayStrategy = isLocked ? '••••••••' : metrics.strategy;
  const displayDesc = isLocked 
    ? "Facial blueprints are unlocked under our premium, high-fidelity structural coaching. Tap to unlock your personalized bone architecture report."
    : details.desc;

  return (
    <View style={[ds.page, { backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }]}>
      
      {/* ── PHASE 1: INTRO NARRATIVE (0s - 3.6s) ── */}
      <Animated.View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }, introStyle]} pointerEvents="none">
        <Text style={{
          fontFamily: 'Inter',
          fontSize: 22,
          fontWeight: '600',
          color: colors.text,
          textAlign: 'center',
          lineHeight: 30,
          letterSpacing: -0.5,
          marginBottom: 10,
        }}>
          Every contour, angle, and jawline...
        </Text>
        <Text style={{
          fontFamily: 'Playfair Display',
          fontSize: 24,
          fontStyle: 'italic',
          color: colors.accent,
          textAlign: 'center',
        }}>
          Your facial architecture is a masterpiece. ✦
        </Text>
      </Animated.View>

      {/* ── PHASE 2: CENTRAL MAIN SUBJECT: CHIC FEMININE FACE SILHOUETTE ── */}
      <View style={{
        width: 280,
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        top: -H * 0.05, // Snug vertical alignment in upper middle
      }}>
        
        {/* Animated Faint Feminine Blueprint Base (Bigger!) */}
        <Animated.View style={[{ width: 215, height: 250, position: 'absolute' }, containerStyle]}>
          <Image 
            source={SilhouetteFaint} 
            style={{ width: 215, height: 250, resizeMode: 'contain' }} 
          />
        </Animated.View>

        {/* Aesthetic Viewfinder Brackets around her head */}
        <Animated.View style={[{
          position: 'absolute',
          width: 228,
          height: 258,
        }, viewfinderStyle]} pointerEvents="none">
          {/* Top-Left Bracket */}
          <View style={{ position: 'absolute', left: 0, top: 0, width: 22, height: 22, borderLeftWidth: 1.5, borderTopWidth: 1.5, borderColor: '#D98A96', opacity: 0.65 }} />
          {/* Top-Right Bracket */}
          <View style={{ position: 'absolute', right: 0, top: 0, width: 22, height: 22, borderRightWidth: 1.5, borderTopWidth: 1.5, borderColor: '#D98A96', opacity: 0.65 }} />
          {/* Bottom-Left Bracket */}
          <View style={{ position: 'absolute', left: 0, bottom: 0, width: 22, height: 22, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#D98A96', opacity: 0.65 }} />
          {/* Bottom-Right Bracket */}
          <View style={{ position: 'absolute', right: 0, bottom: 0, width: 22, height: 22, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#D98A96', opacity: 0.65 }} />
        </Animated.View>

        {/* ── THE DETECTED SHAPE ACTIVE OVERLAY ── */}
        <Animated.View style={[{ width: 180, height: 210, position: 'absolute', justifyContent: 'center', alignItems: 'center' }, traceStyle]}>
          {/* Subtle rose glow on active silhouette */}
          <Image 
            source={SilhouetteActive} 
            style={{ width: 180, height: 210, resizeMode: 'contain', opacity: 0.15, position: 'absolute' }} 
          />
          {/* Glowing laser-etched face shape outline aligned beautifully over her face */}
          <Svg width={142} height={142} viewBox="0 0 100 100" style={{ position: 'absolute', top: 22, transform: [{ translateX: 4.5 }] }}>
            <AnimatedPath
              d={svgPath}
              fill="none"
              stroke="#D98A96"
              strokeWidth="2.2"
              strokeDasharray={`${pathLength}`}
              animatedProps={animatedProps}
            />
          </Svg>
        </Animated.View>

        {/* ── THE NEON LASER SCANNING SWEEP LINE ── */}
        <Animated.View style={[scanStyle, {
          position: 'absolute',
          width: 245,
          height: 3,
          backgroundColor: '#D98A96',
          borderRadius: 2,
          shadowColor: '#D98A96',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.85,
          shadowRadius: 6,
          elevation: 5,
        }]} />
      </View>

      {/* ── PHASE 2 SCANNING INDICATOR (Visible only while laser scan sweeps!) ── */}
      <Animated.View style={scanIndicatorStyle} pointerEvents="none">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: '700', letterSpacing: 4, color: '#D98A96' }}>
            ● SCANNING FACIAL MATRIX...
          </Text>
        </View>
        <Text style={{ fontFamily: 'Inter', fontSize: 8.5, fontWeight: '500', color: colors.muted, letterSpacing: 1 }}>
          [ MAPPING YOUR BEAUTY BLUEPRINT ]
        </Text>
      </Animated.View>

      {/* ── PHASE 3: THE REVEAL CARD (7.8s onwards) ── */}
      <Animated.View style={[cardStyle, {
        position: 'absolute',
        top: H * 0.44,
        width: W,
        alignItems: 'center',
        paddingHorizontal: 28,
        gap: 16,
      }]}>
        
        {/* Frosted Capsule */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.65)',
          borderWidth: 1,
          borderColor: 'rgba(138, 149, 165, 0.22)',
          borderRadius: 28,
          width: '100%',
          paddingVertical: 24,
          paddingHorizontal: 24,
          alignItems: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.04, shadowRadius: 10,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <MaterialIcons name={details.icon as any} size={15} color={colors.accent} />
            <Text style={{
              fontFamily: 'Inter',
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 3,
              color: colors.muted,
              textTransform: 'uppercase',
            }}>
              {details.label}
            </Text>
          </View>

          <Text style={{
            fontFamily: 'Playfair Display',
            fontSize: 28,
            fontStyle: 'italic',
            color: colors.text,
            textAlign: 'center',
            marginBottom: 12,
          }}>
            {shape}
          </Text>

          {/* Delicate thin divider line */}
          <View style={{ width: '80%', height: 1, backgroundColor: 'rgba(138, 149, 165, 0.15)', marginBottom: 14 }} />

          {/* Metrics Grid */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 12 }}>
            <View style={{ alignItems: 'center', gap: 4, flex: 1 }}>
              <Text style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: '600', color: colors.muted, letterSpacing: 1 }}>
                ANGULARITY
              </Text>
              <Text style={{ fontFamily: 'Playfair Display', fontStyle: 'italic', fontSize: 18, color: colors.accent, textAlign: 'center' }}>
                {displayAngularity}
              </Text>
              <Text style={{ fontFamily: 'Inter', fontSize: 8.5, fontWeight: '500', color: '#D98A96', marginTop: 4 }}>
                ✦ CHIC PLANES
              </Text>
            </View>

            {/* Vertical separator */}
            <View style={{ width: 1, height: '100%', backgroundColor: 'rgba(138, 149, 165, 0.15)' }} />

            <View style={{ alignItems: 'center', gap: 4, flex: 1 }}>
              <Text style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: '600', color: colors.muted, letterSpacing: 1 }}>
                CONTOUR ZONE
              </Text>
              <Text style={{ fontFamily: 'Playfair Display', fontStyle: 'italic', fontSize: 18, color: colors.accent, textAlign: 'center' }}>
                {displayStrategy}
              </Text>
              <Text style={{ fontFamily: 'Inter', fontSize: 8.5, fontWeight: '500', color: '#D98A96', marginTop: 4 }}>
                ✦ PRO STRATEGY
              </Text>
            </View>
          </View>
        </View>

        {/* Dynamic description narrative box */}
        <Animated.View style={[descStyle, { width: '100%', paddingHorizontal: 10 }]}>
          <Text style={{
            fontFamily: 'Inter',
            fontSize: 12,
            color: colors.text,
            textAlign: 'center',
            lineHeight: 18,
            letterSpacing: -0.2,
          }}>
            {displayDesc}
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ── Slide: Brows ──────────────────────────────────────────────────────────────

function SlideBrows({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  // Timings and Anim state
  const introOp = useSharedValue(0);
  const introY = useSharedValue(20);
  const introScale = useSharedValue(0.93);

  const silhouetteOp = useSharedValue(0);
  const silhouetteScale = useSharedValue(0.9);

  // Brow drawing trace progress
  const traceProgress = useSharedValue(1); // 1 = hidden, 0 = fully drawn
  const traceOp = useSharedValue(0);
  const pathLength = 100;

  const triggerLightHaptic = () => {
    if (!isLocked) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const triggerSuccessHaptic = () => {
    if (!isLocked) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  useEffect(() => {
    // 1. Phase 1: Intro Narrative Text (0ms to 3.6s)
    introOp.value = withSequence(
      withTiming(1, { duration: 1800 }),
      withDelay(1000, withTiming(0, { duration: 800 }))
    );
    introY.value = withSequence(
      withTiming(0, { duration: 2000, easing: Easing.bezier(0.1, 0.8, 0.2, 1) }),
      withDelay(800, withTiming(-20, { duration: 800 }))
    );
    introScale.value = withTiming(1.04, { duration: 3600, easing: Easing.out(Easing.quad) });

    // 2. Phase 2: Silhouette & Eyebrow drawing entrance (3.8s onwards)
    // Silhouette fades in at 3.8s
    silhouetteOp.value = withDelay(3800, withTiming(0.68, { duration: 500 }));
    silhouetteScale.value = withDelay(3800, withSpring(1.08, { damping: 14, stiffness: 45 }));

    // Eyebrows trace overlay fades in at 3.8s
    traceOp.value = withDelay(3800, withTiming(1, { duration: 400 }));
    // Trace/draw the eyebrows dynamically over 2.4 seconds
    traceProgress.value = withDelay(4000, withTiming(0, {
      duration: 2400,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1)
    }, (finished) => {
      if (finished) {
        runOnJS(triggerSuccessHaptic)();
      }
    }));

    // Trigger synchronized haptic ticks as the eyebrows are being sketched
    let intervalId: ReturnType<typeof setInterval>;
    const scanTimer = setTimeout(() => {
      intervalId = setInterval(() => {
        if (traceProgress.value > 0.05 && traceProgress.value < 0.95) {
          runOnJS(triggerLightHaptic)();
        }
      }, 70);
    }, 4000);

    return () => {
      clearTimeout(scanTimer);
      clearInterval(intervalId);
    };
  }, []);

  const introStyle = useAnimatedStyle(() => ({
    opacity: introOp.value,
    transform: [
      { translateY: introY.value },
      { scale: introScale.value }
    ],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: silhouetteOp.value,
    transform: [{ scale: silhouetteScale.value }],
  }));

  const traceStyle = useAnimatedStyle(() => ({
    opacity: traceOp.value,
  }));

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: traceProgress.value * pathLength,
  }));

  // Define brow coordinates that match her front-facing portrait exactly
  const leftBrow = 'M 30,40 Q 37,33 44,38';
  const rightBrow = 'M 70,40 Q 63,33 56,38';

  return (
    <View style={[ds.page, { backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }]}>
      
      {/* ── PHASE 1: INTRO NARRATIVE (0s - 3.6s) ── */}
      <Animated.View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }, introStyle]} pointerEvents="none">
        <Text style={{
          fontFamily: 'Inter',
          fontSize: 22,
          fontWeight: '600',
          color: colors.text,
          textAlign: 'center',
          lineHeight: 30,
          letterSpacing: -0.5,
          marginBottom: 10,
        }}>
          Your brows do all the heavy lifting... 🎀
        </Text>
        <Text style={{
          fontFamily: 'Playfair Display',
          fontSize: 24,
          fontStyle: 'italic',
          color: colors.accent,
          textAlign: 'center',
        }}>
          They literally frame your entire face. ✨
        </Text>
      </Animated.View>

      {/* ── PHASE 2: SILHOUETTE & BROW DRAWING OVERLAY ── */}
      <View style={{
        width: 280,
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        top: -H * 0.05, // Snug vertical alignment in upper middle
      }}>
        
        {/* Animated Faint Feminine Silhouette Base (Large!) */}
        <Animated.View style={[{ width: 215, height: 250, position: 'absolute' }, containerStyle]}>
          <Image 
            source={SilhouetteFaint} 
            style={{ width: 215, height: 250, resizeMode: 'contain' }} 
          />
        </Animated.View>

        {/* ── HIGH-FASHION BROW ARCH DRAWING OVERLAY ── */}
        <Animated.View style={[{ width: 180, height: 210, position: 'absolute', justifyContent: 'center', alignItems: 'center' }, traceStyle]}>
          {/* Glowing laser-sketched eyebrows aligned beautifully over her face */}
          <Svg width={142} height={142} viewBox="0 0 100 100" style={{ position: 'absolute', top: 22, transform: [{ translateX: 4.5 }] }}>
            {/* Left Brow Base & Sketch */}
            <Path d={leftBrow} stroke="rgba(255, 255, 255, 0.06)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
            <AnimatedPath
              d={leftBrow}
              stroke="#D98A96"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={pathLength}
              animatedProps={animatedProps}
            />

            {/* Right Brow Base & Sketch */}
            <Path d={rightBrow} stroke="rgba(255, 255, 255, 0.06)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
            <AnimatedPath
              d={rightBrow}
              stroke="#D98A96"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={pathLength}
              animatedProps={animatedProps}
            />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

// ── Slide: Lashes ─────────────────────────────────────────────────────────────

function SlideLashes({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <View style={ds.bodyWrap}>
        <DropIn delay={0}>
          <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>LASH PROFILE ✨</Text>
        </DropIn>
        <RevealItem delay={350}>
          <Text style={[ds.narrativeHook, { color: colors.muted }]}>{'The perfect lash lift, formula, and length… 💅'}</Text>
        </RevealItem>
        <RevealItem delay={850}>
          <Text style={[ds.narrativePunch, { color: colors.text }]}>{'literally turns your natural lashes\ninto your signature slay. 💖'}</Text>
        </RevealItem>
        {/* Symmetrical fanned lash sweep vector */}
        <LashTracer color={colors.accent} />
        {isLocked
          ? <RevealItem delay={2050}><LockedValue size="lg" color={colors.muted} /></RevealItem>
          : <>
              <RevealItem delay={2050} fast>
                <Text style={[ds.revealLabel, { color: colors.muted }]}>Your lash coquette profile is</Text>
              </RevealItem>
              <RevealPop delay={2270}>
                <Text style={[ds.bigVal, { color: colors.accent }]}>{dna.lashProfile}</Text>
              </RevealPop>
            </>}
      </View>
    </View>
  );
}

// ── Slide: Eye Shape ──────────────────────────────────────────────────────────

function SlideEyeShape({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <View style={ds.bodyWrap}>
        <DropIn delay={100}>
          <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>EYE SHAPE & MAKEUP 🎀</Text>
        </DropIn>

        {/* Word-by-word kinetic headers */}
        <WordByWordReveal
          text="Your eyes have their own custom alignment and sweep…"
          style={[ds.narrativeHook, { color: colors.muted }]}
          delay={400}
        />
        <WordByWordReveal
          text="the perfect liner blueprint makes everything pop. ✨"
          style={[ds.narrativePunch, { color: colors.text }]}
          delay={1100}
        />

        {isLocked ? (
          <SpinIn delay={1500}>
            <Text style={[ds.shapeGlyph, { color: `${colors.text}99` }]}>○</Text>
          </SpinIn>
        ) : (
          <RevealItem delay={1500}>
            <HolographicTracer shape={dna.eyeShape ?? 'Almond Eye'} color={colors.accent} />
          </RevealItem>
        )}

        {isLocked ? (
          <RevealItem delay={2100}>
            <LockedValue size="lg" color={colors.muted} />
          </RevealItem>
        ) : (
          <>
            <RevealItem delay={2000}>
              <Text style={[ds.revealLabel, { color: colors.muted }]}>Your official eye shape:</Text>
            </RevealItem>
            <RevealPop delay={2100}>
              <Text style={[ds.bigVal, { color: colors.accent }]}>
                {dna.eyeShape ?? 'Almond Eye'}
              </Text>
            </RevealPop>
            <RevealItem delay={2600}>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.12)',
                marginTop: 18,
                width: W - 56,
                alignItems: 'center',
              }}>
                <Text style={{
                  fontFamily: tokens.fonts.regular,
                  fontSize: 14,
                  fontWeight: '700',
                  color: colors.text,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                }}>
                  ✨ Best Makeup Blueprint
                </Text>
                <Text style={{
                  fontFamily: tokens.fonts.regular,
                  fontSize: 13,
                  fontWeight: '400',
                  color: `${colors.text}aa`,
                  textAlign: 'center',
                  lineHeight: 18,
                }}>
                  {dna.eyeMakeup ?? 'Classic wing with highlighted crease.'}
                </Text>
              </View>
            </RevealItem>
          </>
        )}
      </View>
    </View>
  );
}

// ── Slide: Celebrity Match (Dedicated, Highly Kinetic lookalike reveal) ──
function SlideCelebrityMatch({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  const [matchPct, setMatchPct] = useState(0);
  const celebName = dna.celebrityLookalike ?? 'Kendall Jenner';
  
  // Get initials for portrait avatar placeholder
  const celebInitials = celebName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  useEffect(() => {
    if (isLocked) return;
    const target = 94 + Math.floor(Math.random() * 5); // 94% - 98% similarity
    let frame = 0;
    const totalFrames = 38;
    const id = setInterval(() => {
      frame++;
      const eased = 1 - Math.pow(1 - frame / totalFrames, 3);
      setMatchPct(Math.round(eased * target));
      if (frame % 3 === 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (frame >= totalFrames) {
        clearInterval(id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 60);
    return () => clearInterval(id);
  }, [isLocked]);

  // Portrait scanning radar sweep shared value
  const sweepY = useSharedValue(-90);
  useEffect(() => {
    sweepY.value = withRepeat(
      withSequence(
        withTiming(90, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(-90, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1, false
    );
  }, []);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sweepY.value }],
  }));

  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <View style={ds.bodyWrap}>
        <DropIn delay={0}>
          <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>CELEBRITY MATCH 💅</Text>
        </DropIn>

        {/* Word-by-word kinetic headers */}
        <WordByWordReveal
          text="The algorithm scanned your features against 500+ beauty icons…"
          style={[ds.narrativeHook, { color: colors.muted }]}
          delay={400}
        />
        <WordByWordReveal
          text="and we literally found your aesthetic twin. ✨"
          style={[ds.narrativePunch, { color: colors.text }]}
          delay={1200}
        />

        {/* Golden SVG Portrait Frame with Radar Scan Sweep */}
        <View style={{ width: 180, height: 180, alignItems: 'center', justifyContent: 'center', marginVertical: 10 }}>
          <PopIn delay={1800}>
            <View style={{
              width: 140, height: 140,
              borderRadius: 70,
              borderWidth: 2, borderColor: '#D4AF37',
              backgroundColor: 'rgba(255,255,255,0.03)',
              justifyContent: 'center', alignItems: 'center',
              overflow: 'hidden',
              shadowColor: '#D4AF37',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isLocked ? 0 : 0.28, shadowRadius: 16,
            }}>
              {/* Radar Scanner Line */}
              {!isLocked && (
                <Animated.View style={[sweepStyle, {
                  position: 'absolute',
                  width: 140, height: 2,
                  backgroundColor: '#D4AF37',
                  shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 8,
                  zIndex: 10,
                }]} />
              )}
              
              {/* Initials Placeholder */}
              <Text style={{
                fontFamily: 'Playfair Display',
                fontSize: 34,
                fontStyle: 'italic',
                fontWeight: 'bold',
                color: colors.text,
                letterSpacing: 2,
              }}>
                {isLocked ? '??' : celebInitials}
              </Text>
              
              {isLocked && <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />}
            </View>
          </PopIn>
        </View>

        {isLocked ? (
          <RevealItem delay={2600}>
            <LockedValue size="lg" color={colors.muted} />
          </RevealItem>
        ) : (
          <>
            <RevealItem delay={2400} fast>
              <Text style={{
                fontFamily: 'Inter',
                fontSize: 10,
                fontWeight: '500',
                color: colors.muted,
                textTransform: 'uppercase',
                letterSpacing: 2,
                textAlign: 'center',
                marginBottom: -4,
              }}>
                {`Scan match ... ${matchPct}% similarity`}
              </Text>
            </RevealItem>
            <RevealPop delay={2600}>
              <Text style={[ds.bigVal, { color: colors.accent }]}>{celebName}</Text>
            </RevealPop>
            <RevealItem delay={3100}>
              <Text style={{
                fontFamily: 'Inter',
                fontSize: 12,
                color: colors.muted,
                textAlign: 'center',
                lineHeight: 18,
                maxWidth: W - 100,
              }}>
                {`It's giving twins, bestie! You both share the exact same beautiful ${dna.eyeShape ?? 'Almond Eye'} outline and bone structure.`}
              </Text>
            </RevealItem>
          </>
        )}
      </View>
    </View>
  );
}

// ── Slide: Energy ─────────────────────────────────────────────────────────────

const POS_MAP: Record<string, number> = { Sharp: 0.1, Balanced: 0.5, Soft: 0.9 };

function SlideEnergy({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  const pos = isLocked ? 0.5 : (POS_MAP[dna.energy] ?? 0.5);
  // Dot shoots in from the far edge then bounces to its real position — heavy overshoot
  const dotX = useSharedValue((0.5 - pos) * TRACK_W * 1.4);
  const auraScale = useSharedValue(0.8);
  const auraOp = useSharedValue(0.4);

  useEffect(() => {
    dotX.value = withDelay(2100, withSpring(0, { damping: 5, stiffness: 55 }));
    
    // Smooth continuous aura pulse (heartbeat look)
    auraScale.value = withRepeat(
      withSequence(withTiming(1.7, { duration: 1500 }), withTiming(0.8, { duration: 1500 })),
      -1, true
    );
    auraOp.value = withRepeat(
      withSequence(withTiming(0.12, { duration: 1500 }), withTiming(0.4, { duration: 1500 })),
      -1, true
    );
  }, []);

  const dotSty = useAnimatedStyle(() => ({ transform: [{ translateX: dotX.value }] }));
  const auraSty = useAnimatedStyle(() => ({
    transform: [{ scale: auraScale.value }],
    opacity: auraOp.value,
  }));

  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <View style={ds.bodyWrap}>
        <DropIn delay={0}>
          <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>ENERGY TYPE 💫</Text>
        </DropIn>
        
        {/* Kinetic word-by-word headers */}
        <WordByWordReveal
          text="Leaning sharp and graphic, or soft and coquette… 💖"
          style={[ds.narrativeHook, { color: colors.muted }]}
          delay={500}
        />
        <WordByWordReveal
          text="your face shape has its own perfect aesthetic energy. ✨"
          style={[ds.narrativePunch, { color: colors.text }]}
          delay={1300}
        />

        {/* Labels slide in from their respective edges — Sharp from left, Soft from right */}
        <RevealItem delay={1800}>
          <View style={ds.spectrumWrap}>
            <SlideFromLeft delay={1900}>
              <Text style={[ds.spectrumEndLabel, { color: colors.muted }]}>Sharp</Text>
            </SlideFromLeft>
            <View style={[ds.spectrumTrack, { backgroundColor: `${colors.text}22` }]}>
              <LinearGradient
                colors={[`${colors.text}15`, `${colors.text}55`, `${colors.text}15`]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              {/* Pulsing cosmetic energy aura */}
              {!isLocked && (
                <Animated.View style={[{
                  position: 'absolute',
                  top: -19,
                  width: 38, height: 38, borderRadius: 19,
                  backgroundColor: colors.text,
                  left: `${pos * 100}%` as `${number}%`,
                  marginLeft: -19,
                  opacity: 0.35,
                }, auraSty, dotSty]} />
              )}
              <Animated.View style={[ds.spectrumDot, { left: `${pos * 100}%` as `${number}%`, backgroundColor: colors.text, shadowColor: colors.text, borderColor: colors.gradientBot }, dotSty]} />
            </View>
            <SlideFromRight delay={1900}>
              <Text style={[ds.spectrumEndLabel, { color: colors.muted }]}>Soft</Text>
            </SlideFromRight>
          </View>
        </RevealItem>
        {isLocked
          ? <RevealItem delay={2900}><LockedValue size="lg" color={colors.muted} /></RevealItem>
          : <>
              <RevealItem delay={2900} fast>
                <Text style={[ds.revealLabel, { color: colors.muted }]}>Your absolute energy:</Text>
              </RevealItem>
              <RevealPop delay={3100}>
                <Text style={[ds.bigVal, { color: colors.accent }]}>{dna.energy}</Text>
              </RevealPop>
            </>}
      </View>
    </View>
  );
}

// ── Slide: Archetype ──────────────────────────────────────────────────────────

function SlideArchetype({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  const glowAl = useSharedValue(0);
  const glowSc = useSharedValue(0.7);
  const [showConfetti, setShowConfetti] = useState(false);
  useEffect(() => {
    glowAl.value = withDelay(2400, withRepeat(
      withSequence(withTiming(0.22, { duration: 1000 }), withTiming(0.07, { duration: 1000 })),
      -1, true,
    ));
    glowSc.value = withDelay(2400, withRepeat(
      withSequence(withTiming(1.08, { duration: 1400 }), withTiming(0.92, { duration: 1400 })),
      -1, true,
    ));
    if (!isLocked) {
      const t = setTimeout(() => {
        setShowConfetti(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 2400);
      return () => clearTimeout(t);
    }
  }, [isLocked]);
  const glowSty = useAnimatedStyle(() => ({ opacity: glowAl.value, transform: [{ scale: glowSc.value }] }));

  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <Animated.View style={[ds.archetypeGlow, { backgroundColor: colors.accent, shadowColor: colors.accent }, glowSty]} />
      {showConfetti && <ConfettiBurst />}
      <View style={ds.bodyWrap}>
        <RevealItem delay={0}>
          <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>BEAUTY ARCHETYPE 🎀</Text>
        </RevealItem>
        
        {/* Word-by-word kinetic typography */}
        <WordByWordReveal
          text="Your season. Your shape. Your structure… ✨"
          style={[ds.narrativeHook, { color: colors.muted }]}
          delay={600}
        />
        <WordByWordReveal
          text="it literally all points to your ultimate aesthetic identity. 💅"
          style={[ds.narrativePunch, { color: colors.text }]}
          delay={1400}
        />

        {/* Premium Holographic ID Card Reveal */}
        <ArchetypeCard dna={dna} colors={colors} isLocked={isLocked} />

        {/* Burst dots fire outward when archetype name arrives */}
        {!isLocked && (
          <View style={{ alignItems: 'center', height: 0 }}>
            <BurstDots color={colors.accent} delay={2600} />
          </View>
        )}
        <RevealItem delay={3400}>
          <Text style={[ds.bodyTxt, { color: colors.muted }]}>
            {isLocked
              ? 'Your archetype ties face shape, season, and energy into one identity. It changes how you shop, apply, and express. Unlock yours.'
              : ARCHETYPE_DESCRIPTIONS[dna.archetype]}
          </Text>
        </RevealItem>
      </View>
    </View>
  );
}

// ── Slide: Lips ───────────────────────────────────────────────────────────────

const LIP_COLORS: Record<string, string> = {
  'Peach Gloss': '#E8A885', 'Nude Gloss': '#D9A9A0', 'Warm Satin': '#E8936A',
  'Berry Stain': '#B87080', 'Mauve Satin': '#D9A8B8', 'Sheer Pink': '#E8A8B8',
  'Deep Matte': '#8B3A3A', 'Nude Matte': '#C9A89A',
};

function SlideLips({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  const lipHex = dna.lipProfile ? (LIP_COLORS[dna.lipProfile] ?? '#E8A885') : '#E8A885';
  const lipShine = useSharedValue(-150);

  useEffect(() => {
    lipShine.value = withRepeat(
      withSequence(
        withTiming(150, { duration: 1500, easing: Easing.out(Easing.quad) }),
        withTiming(-150, { duration: 0 }),
        withDelay(3000, withTiming(-150, { duration: 0 })),
      ),
      -1, false
    );
  }, []);

  const lipShineSty = useAnimatedStyle(() => ({ transform: [{ translateX: lipShine.value }] }));

  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <View style={ds.bodyWrap}>
        <RevealItem delay={0}>
          <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>LIP TONE 💄</Text>
        </RevealItem>
        
        {/* Word-by-word kinetic typography */}
        <WordByWordReveal
          text="Out of hundreds of glossy lip colors… 👄"
          style={[ds.narrativeHook, { color: colors.muted }]}
          delay={350}
        />
        <WordByWordReveal
          text="this is the only one that actually slays your routine. 💅"
          style={[ds.narrativePunch, { color: colors.text }]}
          delay={950}
        />

        {/* Ripple rings emanate from the lip swatch */}
        <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
            <RippleRings color={lipHex} size={140} delay={1200} />
          </View>
          <PopIn delay={1400}>
            <View style={[ds.lipSwatch, { backgroundColor: lipHex, shadowColor: lipHex }]}>
              {!isLocked && (
                <Animated.View style={[lipShineSty, StyleSheet.absoluteFill, { width: '200%', pointerEvents: 'none' }]}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              )}
              {isLocked && <BlurView intensity={28} tint="light" style={[StyleSheet.absoluteFillObject, { borderRadius: 70 }]} />}
            </View>
          </PopIn>
        </View>
        {isLocked
          ? <RevealItem delay={2000}><LockedValue size="lg" color={colors.muted} /></RevealItem>
          : <>
              <RevealItem delay={2000} fast>
                <Text style={[ds.revealLabel, { color: colors.muted }]}>Your signature coquette lip tone:</Text>
              </RevealItem>
              <RevealPop delay={2200}>
                <Text style={[ds.bigVal, { color: colors.accent }]}>{dna.lipProfile || '—'}</Text>
              </RevealPop>
            </>}
      </View>
    </View>
  );
}

// ── Slide: Blush ──────────────────────────────────────────────────────────────

const BLUSH_COLORS: Record<string, string> = {
  'Warm Coral': '#F0A882', 'Soft Peach': '#F0B899', 'Bronze Flush': '#C8956A',
  'Bronze Warmth': '#D9956A', 'Cool Rose': '#E8A0AA', 'Soft Pink': '#E8B0B8',
  'Berry Flush': '#D98A96', 'Cool Berry': '#D985A0',
};

function SlideBlush({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  const blushHex = dna.blushProfile ? (BLUSH_COLORS[dna.blushProfile] ?? '#F0A882') : '#F0A882';

  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <View style={ds.bodyWrap}>
        <RevealItem delay={0}>
          <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>BLUSH 🌸</Text>
        </RevealItem>
        
        {/* Word-by-word kinetic typography */}
        <WordByWordReveal
          text="A bad blush shade ruins the vibe… 😭"
          style={[ds.narrativeHook, { color: colors.muted }]}
          delay={450}
        />
        <WordByWordReveal
          text="the right one literally lifts your cheekbones and completes the coquette look. ✨"
          style={[ds.narrativePunch, { color: colors.text }]}
          delay={1100}
        />

        {/* Three blush dots pop in one-two-three — like actual blush placement */}
        <BlushDots delay={1600} hex={blushHex} isLocked={isLocked} />
        {isLocked
          ? <RevealItem delay={2400}><LockedValue size="lg" color={colors.muted} /></RevealItem>
          : <>
              <RevealItem delay={2500} fast>
                <Text style={[ds.revealLabel, { color: colors.muted }]}>Your ultimate coquette blush:</Text>
              </RevealItem>
              <RevealPop delay={2750}>
                <Text style={[ds.bigVal, { color: colors.accent }]}>{dna.blushProfile || '—'}</Text>
              </RevealPop>
            </>}
      </View>
    </View>
  );
}

// ── Slide: Kit (per-category) ─────────────────────────────────────────────────

const PRICE_LABELS: Record<string, string> = { '$': 'Budget', '$$': 'Mid-range', '$$$': 'Premium' };

function KitItem({ rec, index }: { rec: ProductRec; index: number }) {
  const delay = 900 + index * 180;
  const op = useSharedValue(0);
  const ty = useSharedValue(16);
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 320 }));
    ty.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 180 }));
  }, []);
  const sty = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));

  const openSephora = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const query = encodeURIComponent(`${rec.brand} ${rec.product}`);
    Linking.openURL(`https://www.sephora.com/search?keyword=${query}`);
  };

  return (
    <Animated.View style={[sty, { width: '100%' }]}>
      <Pressable
        onPress={openSephora}
        style={({ pressed }) => [ds.kitCard, pressed && ds.kitCardPressed]}
      >
        {/* Top row: brand + price badge */}
        <View style={ds.kitCardTop}>
          <Text style={ds.kitBrand}>{rec.brand.toUpperCase()}</Text>
          <View style={ds.kitPricePill}>
            <Text style={ds.kitPriceLabel}>{PRICE_LABELS[rec.price]}</Text>
          </View>
        </View>

        {/* Product name */}
        <Text style={ds.kitProduct} numberOfLines={2}>{rec.product}</Text>

        {/* Why */}
        <Text style={ds.kitWhy} numberOfLines={2}>{rec.why}</Text>

        {/* Shop CTA */}
        <View style={ds.kitShopRow}>
          <Text style={ds.kitShopIcon}>🛍</Text>
          <Text style={ds.kitShopLabel}>Shop on Sephora</Text>
          <Text style={ds.kitShopArrow}>→</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function SlideKitCategory({ kit, isLocked, colors, slideNum, totalSlides }: {
  kit: CategoryKit;
  isLocked?: boolean;
  colors: SlideColors;
  slideNum: number;
  totalSlides: number;
}) {
  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <View style={ds.kitPageWrap}>

        {/* ── Header ── */}
        <Animated.View entering={FadeInUp.delay(0).duration(380)} style={ds.kitPageHeader}>
          <View style={ds.kitPageHeaderRow}>
            <Text style={[ds.kitCatTitle, { color: colors.text }]}>{kit.category}</Text>
            <Text style={[ds.kitCatCounter, { color: colors.eyebrow }]}>
              {slideNum}&nbsp;/&nbsp;{totalSlides}
            </Text>
          </View>
          <Text style={[ds.kitCatSubtitle, { color: colors.muted }]}>{kit.subtitle}</Text>
        </Animated.View>

        {/* ── Cards ── */}
        <View style={ds.kitCardsSection}>
          {isLocked ? (
            <>
              {[0, 1, 2].map((i) => (
                <Animated.View key={i} entering={FadeInUp.delay(300 + i * 120).duration(320)}>
                  <View style={ds.kitCardLocked}>
                    <View style={ds.kitCardTop}>
                      <View style={[ds.kitLockedBar, { width: '32%', height: 8, borderRadius: 4 }]} />
                      <View style={[ds.kitLockedPill, { width: 58, height: 18, borderRadius: 9 }]} />
                    </View>
                    <View style={[ds.kitLockedBar, { width: '75%', height: 12, borderRadius: 6 }]} />
                    <View style={[ds.kitLockedBar, { width: '90%', height: 8, borderRadius: 4 }]} />
                    <View style={ds.kitLockedShopRow}>
                      <View style={[ds.kitLockedBar, { width: '50%', height: 8, borderRadius: 4 }]} />
                    </View>
                  </View>
                </Animated.View>
              ))}
              <Animated.Text
                entering={FadeInUp.delay(700).duration(300)}
                style={[ds.kitUnlockHint, { color: colors.muted }]}
              >
                Unlock to see your {kit.category.toLowerCase()} picks.
              </Animated.Text>
            </>
          ) : (
            kit.picks.map((rec, i) => (
              <KitItem key={rec.product} rec={rec} index={i} />
            ))
          )}
        </View>

      </View>
    </View>
  );
}

// ── Slide: Summary ────────────────────────────────────────────────────────────

// ── Finale palette bar (stagger up from bottom) ───────────────────────────────

function FinaleBar({ index, hex, isLocked, fallback }: {
  index: number; hex: string | null; isLocked: boolean; fallback: string;
}) {
  const ty = useSharedValue(100);
  const op = useSharedValue(0);
  useEffect(() => {
    ty.value = withDelay(index * 65, withSpring(0, { damping: 14, stiffness: 110 }));
    op.value = withDelay(index * 65, withTiming(1, { duration: 100 }));
  }, []);
  const sty = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }], opacity: op.value }));
  const bg = isLocked || !hex ? `${fallback}1A` : hex;
  const sc = isLocked || !hex ? 'transparent' : hex;
  return (
    <Animated.View style={[ds.fnBar, { backgroundColor: bg, shadowColor: sc }, sty]} />
  );
}

function SlideSummary({ dna, isLocked, onShare, colors }: { dna: DnaResult; isLocked?: boolean; onShare: () => void; colors: SlideColors }) {
  const palette = SEASON_PALETTES[dna.colorSeason] ?? [];
  const shades = isLocked ? null : findShades(dna.skinToneHex);
  const [showConfetti, setShowConfetti] = useState(false);
  const ctaScale  = useSharedValue(1);
  const heroScale = useSharedValue(0.82);
  const heroOp    = useSharedValue(0);

  useEffect(() => {
    heroOp.value    = withDelay(180, withTiming(1, { duration: 460 }));
    heroScale.value = withDelay(180, withSpring(1, { damping: 11, stiffness: 80 }));
    const t = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowConfetti(true);
    }, 1100);
    ctaScale.value = withDelay(5000, withRepeat(
      withSequence(withTiming(1.03, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1, true,
    ));
    return () => clearTimeout(t);
  }, []);

  const heroSty = useAnimatedStyle(() => ({
    opacity: heroOp.value,
    transform: [{ scale: heroScale.value }],
  }));
  const ctaSty = useAnimatedStyle(() => ({ transform: [{ scale: ctaScale.value }] }));

  const STATS = [
    { label: 'FACE SHAPE', value: dna.faceShape },
    { label: 'ENERGY',     value: dna.energy },
    { label: 'LIP TONE',   value: dna.lipProfile  || '—' },
    { label: 'BLUSH TONE', value: dna.blushProfile || '—' },
  ];

  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      {showConfetti && <ConfettiBurst count={60} />}

      <ScrollView
        style={{ flex: 1, width: W }}
        contentContainerStyle={[ds.fnWrap2, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Eyebrow ── */}
        <Animated.View entering={FadeIn.delay(0).duration(360)} style={ds.fnHeaderRow}>
          <View style={[ds.fnHairline, { backgroundColor: `${colors.accent}40` }]} />
          <Text style={[ds.fnEyebrow, { color: colors.accent, letterSpacing: 5 }]}>✦  BEAUTY DNA  ✦</Text>
          <View style={[ds.fnHairline, { backgroundColor: `${colors.accent}40` }]} />
        </Animated.View>

        {/* ── Hero archetype name ── */}
        <Animated.View style={[ds.fnHeroWrap, heroSty]}>
          <Text style={[ds.fnYouAre, { color: `${colors.text}60` }]}>YOU ARE</Text>
          {isLocked
            ? <Text style={[ds.fnArchNameHero, { color: `${colors.accent}30`, letterSpacing: 10 }]}>● ● ●</Text>
            : <Text style={[ds.fnArchNameHero, { color: colors.accent }]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.55}>
                {dna.archetype}
              </Text>
          }
          <Animated.Text
            entering={FadeInUp.delay(900).duration(300)}
            style={[ds.fnSeasonLabel, { color: `${colors.text}55`, marginTop: 4 }]}
          >
            {isLocked ? '— · · · —' : `— ${dna.colorSeason} —`}
          </Animated.Text>
        </Animated.View>

        {/* ── Palette swatch strip ── */}
        <Animated.View entering={FadeInUp.delay(1100).duration(320)} style={ds.fnSwatchStrip}>
          {(palette.length > 0 ? palette.slice(0, 6) : Array(6).fill(null)).map((hex, i) => {
            const h = hex as string | null;
            return (
              <View
                key={i}
                style={[
                  ds.fnSwatchDot,
                  { backgroundColor: isLocked || !h ? `${colors.text}16` : h },
                  !isLocked && h ? { shadowColor: h, shadowOpacity: 0.7, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } } : undefined,
                ]}
              />
            );
          })}
        </Animated.View>

        {/* ── Divider ── */}
        <Animated.View entering={FadeIn.delay(1500).duration(400)} style={[ds.fnDivider, { backgroundColor: `${colors.text}18` }]} />

        {/* ── Stat grid 2×2 ── */}
        <Animated.View entering={FadeInUp.delay(1700).duration(300)} style={ds.fnStatPillGrid}>
          {STATS.map(({ label, value }) => (
            <View key={label} style={[ds.fnStatPill, { backgroundColor: `${colors.text}0D`, borderColor: `${colors.text}16` }]}>
              <Text style={[ds.fnStatBlockLabel, { color: colors.eyebrow }]}>{label}</Text>
              {isLocked
                ? <Text style={[ds.fnStatBlocked, { color: `${colors.text}20` }]}>● ●</Text>
                : <Text style={[ds.fnStatBlockValue2, { color: colors.text }]}>{value}</Text>
              }
            </View>
          ))}
        </Animated.View>

        {/* ── Canvas / skin tone ── */}
        <Animated.View
          entering={FadeInUp.delay(2100).duration(300)}
          style={[ds.fnCanvasRow, { borderColor: `${colors.text}14` }]}
        >
          <View style={[ds.fnCanvasDot, { backgroundColor: dna.skinToneHex, shadowColor: dna.skinToneHex }]} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[ds.fnStatBlockLabel, { color: colors.eyebrow }]}>CANVAS</Text>
            <Text style={[ds.fnStatBlockValue2, { color: colors.text }]}>
              {isLocked ? '● ● ● ●' : dna.skinToneHex.toUpperCase()}
            </Text>
          </View>
          {shades && !isLocked && (
            <Text style={[ds.fnShadeHint, { color: `${colors.text}55` }]}>
              {`Fenty ${shades.Fenty}\nMAC ${shades.MAC}`}
            </Text>
          )}
        </Animated.View>

        {/* ── Description blurb ── */}
        <Animated.View entering={FadeInUp.delay(2500).duration(320)}>
          <Text style={[ds.fnArchDesc, { color: `${colors.text}60`, textAlign: 'center', lineHeight: 20 }]}>
            {isLocked
              ? 'Unlock to reveal your full beauty identity and curated picks.'
              : (ARCHETYPE_DESCRIPTIONS[dna.archetype] ?? '')}
          </Text>
        </Animated.View>

        {/* ── CTA — share only; unlock is handled by the persistent bottom strip ── */}
        {!isLocked && (
          <Animated.View entering={FadeInUp.delay(3200).duration(380)} style={{ width: '100%' }}>
            <Animated.View style={ctaSty}>
              <Pressable
                style={({ pressed }) => [ds.fnCta, { backgroundColor: colors.accent }, pressed && { opacity: 0.85 }]}
                onPress={onShare}
              >
                <Text style={[ds.fnCtaTxt, { color: colors.gradientBot }]}>
                  {'✦  Share your Beauty DNA  ✦'}
                </Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Welcome + Opening slides (matching Beauty Wrapped style) ─────────────────

function DnaSlideWelcome({ name }: { name?: string }) {
  const greeting = name ? `Hi ${name} 👋` : 'Hi there 👋';
  const op = useSharedValue(0);
  const sc = useSharedValue(0.88);
  useEffect(() => {
    op.value = withDelay(500, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    sc.value = withDelay(500, withSpring(1, { damping: 12, stiffness: 100 }));
  }, []);
  const textStyle = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ scale: sc.value }] }));
  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', gap: 16 }]}>
      <Animated.Text entering={FadeInUp.delay(80).duration(500)} style={ds.welcomeHi}>{greeting}</Animated.Text>
      <Animated.View style={textStyle}>
        <Text style={ds.welcomeReady}>{'Your Beauty\nWrapped is ready.'}</Text>
      </Animated.View>
      <Animated.Text entering={FadeIn.delay(1200).duration(600)} style={ds.welcomeHint}>tap to begin  →</Animated.Text>
    </View>
  );
}

function DnaSlideOpening() {
  // Shared values for high-fidelity animations
  const sloganY = useSharedValue(-40);
  const sloganOp = useSharedValue(0);

  const yourY = useSharedValue(-30);
  const yourRot = useSharedValue(-15);
  const yourOp = useSharedValue(0);

  const beautyScale = useSharedValue(0.6);
  const beautyY = useSharedValue(20);
  const beautyOp = useSharedValue(0);

  const dnaRot = useSharedValue(12);
  const dnaScale = useSharedValue(0.7);
  const dnaOp = useSharedValue(0);

  const hereY = useSharedValue(25);
  const hereOp = useSharedValue(0);

  useEffect(() => {
    // 1. Slogan slides down softly
    sloganY.value = withDelay(100, withTiming(0, { duration: 700, easing: Easing.bezier(0.16, 1, 0.3, 1) }));
    sloganOp.value = withDelay(100, withTiming(1, { duration: 600 }));

    // 2. "Your" swings in elegantly
    yourY.value = withDelay(250, withTiming(0, { duration: 800, easing: Easing.bezier(0.16, 1, 0.3, 1) }));
    yourRot.value = withDelay(250, withSpring(0, { damping: 12, stiffness: 90 }));
    yourOp.value = withDelay(250, withTiming(1, { duration: 600 }));

    // 3. "BEAUTY" snaps in with a bouncy, satisfying spring
    beautyScale.value = withDelay(450, withSpring(1, { damping: 10, stiffness: 80 }));
    beautyY.value = withDelay(450, withSpring(0, { damping: 10, stiffness: 80 }));
    beautyOp.value = withDelay(450, withTiming(1, { duration: 500 }));

    // 4. "DNA" does a 3D-tilt slide and seals
    dnaScale.value = withDelay(650, withSpring(1, { damping: 11, stiffness: 85 }));
    dnaRot.value = withDelay(650, withSpring(0, { damping: 11, stiffness: 85 }));
    dnaOp.value = withDelay(650, withTiming(1, { duration: 500 }));

    // 5. "is here." glides up softly at the end
    hereY.value = withDelay(950, withTiming(0, { duration: 700, easing: Easing.bezier(0.16, 1, 0.3, 1) }));
    hereOp.value = withDelay(950, withTiming(1, { duration: 600 }));
  }, []);

  const sloganStyle = useAnimatedStyle(() => ({
    opacity: sloganOp.value,
    transform: [{ translateY: sloganY.value }],
  }));

  const yourStyle = useAnimatedStyle(() => ({
    opacity: yourOp.value,
    transform: [
      { translateY: yourY.value },
      { rotate: `${yourRot.value}deg` }
    ],
  }));

  const beautyStyle = useAnimatedStyle(() => ({
    opacity: beautyOp.value,
    transform: [
      { translateY: beautyY.value },
      { scale: beautyScale.value }
    ],
  }));

  const dnaStyle = useAnimatedStyle(() => ({
    opacity: dnaOp.value,
    transform: [
      { rotate: `${dnaRot.value}deg` },
      { scale: dnaScale.value }
    ],
  }));

  const hereStyle = useAnimatedStyle(() => ({
    opacity: hereOp.value,
    transform: [{ translateY: hereY.value }],
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      {/* Subtle Checkered Background Overlay */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="checkerboard" width="60" height="60" patternUnits="userSpaceOnUse">
            {/* Checkerboard squares */}
            <Rect width="30" height="30" fill="rgba(255,255,255,0.04)" />
            <Rect x="30" y="30" width="30" height="30" fill="rgba(255,255,255,0.04)" />
            {/* Fine-line grid wires */}
            <Rect width="60" height="60" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#checkerboard)" />
      </Svg>

      {/* Slogan at the Top */}
      <Animated.Text 
        style={[ds.openingSlogan, sloganStyle, { position: 'absolute', top: 120 }]}
      >
        YOUR FACE. YOUR BLUEPRINT.
      </Animated.Text>

      {/* Main Stacked Hero in the Middle */}
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Animated.Text style={[ds.openingMainYour, yourStyle]}>
          Your
        </Animated.Text>
        <View style={{ alignItems: 'center', marginVertical: 4 }}>
          <Animated.Text style={[ds.openingMainBeauty, beautyStyle]}>
            BEAUTY
          </Animated.Text>
          <Animated.Text style={[ds.openingMainDna, dnaStyle]}>
            DNA
          </Animated.Text>
        </View>
        <Animated.Text style={[ds.openingMainHere, hereStyle]}>
          is here.
        </Animated.Text>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

const KIT_CATEGORY_COUNT = 6;

function renderSlide(idx: number, dna: DnaResult, locked: boolean, onShare: () => void, name?: string) {
  const colors = SLIDE_COLORS[idx] ?? SLIDE_COLORS[0];
  // Opening slide is index 0
  if (idx === 0) return <DnaSlideOpening />;
  // Kit slides are indices 12 to 17
  if (idx >= 12 && idx <= 17) {
    const kits = getKitForDna(dna.archetype);
    const kit = kits[idx - 12] ?? kits[0];
    return (
      <SlideKitCategory
        kit={kit}
        isLocked={locked}
        colors={colors}
        slideNum={idx - 11}
        totalSlides={KIT_CATEGORY_COUNT}
      />
    );
  }
  // Existing content slides shifted down by 1
  switch (idx) {
    case 1:  return <SlideCanvas dna={dna} isLocked={locked} colors={colors} />;
    case 2:  return <SlideSeason dna={dna} isLocked={locked} colors={colors} />;
    case 3:  return <SlideFaceShape dna={dna} isLocked={locked} colors={colors} />;
    case 4:  return <SlideBrows dna={dna} isLocked={locked} colors={colors} />;
    case 5:  return <SlideLashes dna={dna} isLocked={locked} colors={colors} />;
    case 6:  return <SlideEyeShape dna={dna} isLocked={locked} colors={colors} />;
    case 7:  return <SlideCelebrityMatch dna={dna} isLocked={locked} colors={colors} />;
    case 8:  return <SlideEnergy dna={dna} isLocked={locked} colors={colors} />;
    case 9:  return <SlideArchetype dna={dna} isLocked={locked} colors={colors} />;
    case 10: return <SlideLips dna={dna} isLocked={locked} colors={colors} />;
    case 11: return <SlideBlush dna={dna} isLocked={locked} colors={colors} />;
    case 18: return <SlideSummary dna={dna} isLocked={locked} onShare={onShare} colors={colors} />;
    default: return null;
  }
}

export default function DnaRevealScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ dna?: string; bypass?: string }>();
  const [dna, setDna] = useState<DnaResult | null>(null);
  const [slideState, slideDispatch] = useReducer(slideReducer, { current: 0, outgoing: null, dir: 1 as const, uid: 0 });
  const { current } = slideState;
  const colors = SLIDE_COLORS[current] ?? SLIDE_COLORS[0];
  const clearOutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareCardRef = useRef<View>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const { isPro: ctxPro } = useSubscription();
  const { user } = useAuth();
  const isPro = ctxPro || (__DEV__ && params.bypass === '1');

  useEffect(() => {
    if (!isPro) {
      router.replace('/(main)/paywall');
    }
  }, [isPro]);

  const displayName = (() => {
    const raw = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? '';
    const first = raw.replace(/[^a-zA-Z ]/g, ' ').trim().split(' ')[0];
    return first ? first.charAt(0).toUpperCase() + first.slice(1) : undefined;
  })();
  const progress = useSharedValue(0);

  // Background morph state — drives MorphingBackground and PersistentAmbient
  const morphProgress = useSharedValue(0);
  const [bgFrom, setBgFrom] = useState(0);
  const [bgTo, setBgTo] = useState(0);

  useEffect(() => {
    let active = true;
    const loadDna = async () => {
      // 1. Try route params first
      if (params.dna) {
        try {
          const parsed = JSON.parse(params.dna) as DnaResult;
          if (active) {
            setDna(parsed);
            await AsyncStorage.setItem('dna_result', params.dna);
          }
          return;
        } catch (e) {
          console.warn('[DNA Reveal] Failed to parse params.dna:', e);
        }
      }

      // 2. Try AsyncStorage for instant offline load
      let cachedDna: DnaResult | null = null;
      try {
        const raw = await AsyncStorage.getItem('dna_result');
        if (raw) {
          cachedDna = JSON.parse(raw) as DnaResult;
          if (active) setDna(cachedDna);
        }
      } catch (e) {
        console.warn('[DNA Reveal] Failed to load AsyncStorage cache:', e);
      }

      // 3. Sync from Supabase to guarantee freshness
      if (user?.id) {
        try {
          const supabase = createClient() as any;
          const { data, error } = await supabase
            .from('profiles')
            .select('dna_result')
            .eq('id', user.id)
            .maybeSingle();
          
          if (!error && data?.dna_result) {
            const dbDna = data.dna_result as DnaResult;
            if (JSON.stringify(dbDna) !== JSON.stringify(cachedDna)) {
              if (active) setDna(dbDna);
              await AsyncStorage.setItem('dna_result', JSON.stringify(dbDna));
            }
          }
        } catch (e) {
          console.warn('[DNA Reveal] Failed to sync from Supabase:', e);
        }
      }
    };

    loadDna();
    return () => { active = false; };
  }, [params.dna, user?.id]);

  const preloadRef = useRef<Audio.Sound | null>(null);

  // Mount: start the journey track immediately.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
        const { sound } = await Audio.Sound.createAsync(MUSIC_JOURNEY, { isLooping: true, volume: MUSIC_VOL });
        if (!mounted) { sound.unloadAsync(); return; }
        soundRef.current = sound;
        await sound.playAsync();
      } catch {}
    })();
    return () => {
      mounted = false;
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
      preloadRef.current?.unloadAsync().catch(() => {});
      preloadRef.current = null;
    };
  }, []);

  // Slide-aware: preload reveal track at slide 3, crossfade to it at slide 6.
  // Preload plays at volume 0 so it's fully buffered — zero silence on crossfade.
  useEffect(() => {
    if (current === MUSIC_PRELOAD_SLIDE && !preloadRef.current) {
      (async () => {
        try {
          await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
          const { sound } = await Audio.Sound.createAsync(MUSIC_REVEAL, { isLooping: true, volume: 0 });
          preloadRef.current = sound;
          await sound.playAsync(); // silently buffering in background
        } catch {}
      })();
    }

    if (current === MUSIC_REVEAL_SLIDE) {
      const prev = soundRef.current;
      const next = preloadRef.current;
      if (!prev || !next) return;

      preloadRef.current = null;
      soundRef.current = next;

      // Overlap crossfade: ramp next up while ramping prev down simultaneously.
      (async () => {
        for (let i = 1; i <= CROSSFADE_STEPS; i++) {
          const pct = i / CROSSFADE_STEPS;
          await Promise.allSettled([
            next.setVolumeAsync(MUSIC_VOL * pct),
            prev.setVolumeAsync(MUSIC_VOL * (1 - pct)),
          ]);
          await new Promise<void>(r => setTimeout(r, CROSSFADE_STEP_MS));
        }
        try { await prev.unloadAsync(); } catch {}
      })();
    }
  }, [current]);

  const navigateTo = useCallback((to: number, from: number) => {
    setBgFrom(from);
    setBgTo(to);
    morphProgress.value = withTiming(1, { duration: 380, easing: Easing.bezier(0.4, 0, 0.2, 1) }, (finished) => {
      if (finished) {
        runOnJS(setBgFrom)(to);
      }
    });
    slideDispatch({ type: 'go', to });
    if (clearOutRef.current) clearTimeout(clearOutRef.current);
    clearOutRef.current = setTimeout(() => slideDispatch({ type: 'done' }), 210);
  }, [morphProgress]);

  useEffect(() => {
    if (bgFrom === bgTo) {
      morphProgress.value = 0;
    }
  }, [bgFrom, bgTo]);

  const advanceCurrent = useCallback(() => {
    navigateTo(Math.min(current + 1, SLIDE_COUNT - 1), current);
  }, [current, navigateTo]);

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    const duration = current === 1 ? 14000 : current === 2 ? 13000 : current === 3 ? 15500 : SLIDE_DURATION; // Slide 2 (Shade) is 14s, Slide 3 (Season) is 13s, Slide 4 (Face Shape) is 15.5s
    progress.value = withTiming(1, { duration }, (finished) => {
      if (finished && current < SLIDE_COUNT - 1) runOnJS(advanceCurrent)();
    });
    return () => { cancelAnimation(progress); };
  }, [current, advanceCurrent]);

  const tap = useCallback((x: number) => {
    Haptics.selectionAsync();
    const to = x < W * 0.28 ? Math.max(current - 1, 0) : Math.min(current + 1, SLIDE_COUNT - 1);
    navigateTo(to, current);
  }, [current, navigateTo]);

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const uri = await captureRef(shareCardRef, { format: 'png', quality: 0.95 });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your Beauty DNA' });
    } catch (e) {
      console.warn('[Share] capture failed:', e);
    }
  };

  const handleClose = () => router.replace('/(main)/home');
  const handleUnlock = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(main)/paywall');
  };

  // Free users see their real DNA on all analysis slides (0-11).
  // Product pick slides (12-17) are the hard paywall — locked for free users.
  const displayDna = dna ?? PLACEHOLDER_DNA;
  const isProductSlide = (idx: number) => idx >= 12 && idx <= 17;
  const locked = !isPro && isProductSlide(current);

  return (
    <View style={ds.root}>
      {/* Persistent world — never remounts */}
      <MorphingBackground fromIdx={bgFrom} toIdx={bgTo} morphProgress={morphProgress} />
      <PersistentAmbient fromIdx={bgFrom} toIdx={bgTo} morphProgress={morphProgress} />
      <GrainOverlay />
      <DnaPulseOrb colors={colors} />

      {/* Content only — dissolves out then in */}
      {slideState.outgoing && (
        <OutgoingContent key={`out-${slideState.outgoing.uid}`}>
          {renderSlide(slideState.outgoing.idx, displayDna, !isPro && isProductSlide(slideState.outgoing.idx), handleShare, displayName)}
        </OutgoingContent>
      )}
      {slideState.uid === 0 ? (
        <View key="init" style={StyleSheet.absoluteFill}>
          {renderSlide(current, displayDna, locked, handleShare, displayName)}
        </View>
      ) : (
        <IncomingContent key={`in-${slideState.uid}`} dir={slideState.dir}>
          {renderSlide(current, displayDna, locked, handleShare, displayName)}
        </IncomingContent>
      )}

      {/* Tap zones */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]} pointerEvents="box-none">
        <Pressable style={ds.tapLeft} onPress={() => tap(0)} />
        <Pressable style={ds.tapRight} onPress={() => tap(W)} />
      </View>

      {/* Header */}
      <View style={[ds.header, { paddingTop: insets.top + 10 }]}>
        <View style={ds.barsRow}>
          {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
            <ProgressSeg 
              key={i} 
              i={i} 
              current={current} 
              progress={progress} 
              textColor={colors.text} 
              trackColor={colors.text === '#FFFFFF' || colors.text === '#FFEEDD' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'}
            />
          ))}
        </View>
        <Pressable hitSlop={12} style={[ds.closeBtn, { backgroundColor: colors.text === '#FFFFFF' || colors.text === '#FFEEDD' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} onPress={handleClose}>
          <Text style={[ds.closeTxt, { color: colors.text }]}>✕</Text>
        </Pressable>
      </View>

      {/* Unlock strip — only on product pick slides for free users */}
      {!isPro && isProductSlide(current) && (
        <Animated.View
          entering={FadeIn.delay(400).duration(500)}
          style={[ds.unlockWrap, { paddingBottom: insets.bottom + 20 }]}
          pointerEvents="box-none"
        >
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <Pressable
            style={({ pressed }) => [ds.unlockBtn, pressed && { opacity: 0.87 }]}
            onPress={handleUnlock}
          >
            <Text style={ds.unlockTxt}>Unlock Everything</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#09090B" />
          </Pressable>
          <Text style={ds.unlockNote}>7-day free trial · Cancel anytime</Text>
        </Animated.View>
      )}

      {/* Off-screen share card */}
      <View pointerEvents="none" style={ds.shareCardHost}>
        <View ref={shareCardRef} collapsable={false} style={{ width: CARD_W, height: CARD_H }}>
          <DnaShareCard dna={displayDna} />
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const ds = StyleSheet.create({
  root: { flex: 1 },
  shareCardHost: { position: 'absolute', opacity: 0, top: 0, left: 0 },

  page: { width: W, flex: 1, justifyContent: 'center', alignItems: 'center' },
  bodyWrap: { alignItems: 'center', paddingHorizontal: 28, gap: 20, paddingBottom: 60, paddingTop: 40, width: W },
  kitBodyWrap: { gap: 8, paddingBottom: 60 },

  // Kit page — left-aligned shopping layout
  kitPageWrap: {
    flex: 1,
    width: W,
    paddingHorizontal: 24,
    paddingTop: 108,
    paddingBottom: 116,
    justifyContent: 'center',
    gap: 20,
  },
  kitPageHeader: { gap: 6 },
  kitPageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  kitCatTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 36,
    fontStyle: 'italic',
    lineHeight: 42,
  },
  kitCatCounter: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    paddingBottom: 5,
  },
  kitCatSubtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  kitCardsSection: { gap: 10 },
  kitUnlockHint: {
    fontFamily: 'Inter',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
  },
  summaryBodyWrap: { gap: 16, paddingBottom: 100 },

  // Header
  header: {
    position: 'absolute', left: 0, right: 0, top: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SEG_PAD, paddingBottom: 10, gap: 8, zIndex: 30,
  },
  barsRow: { flex: 1, flexDirection: 'row', gap: SEG_GAP, alignItems: 'center' },
  segTrack: { flex: 1, height: 2.5, borderRadius: 1.5, backgroundColor: 'rgba(255,249,247,0.2)', overflow: 'hidden' },
  segFill: { height: '100%', backgroundColor: '#FFF9F7', borderRadius: 1.5 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center',
  },
  closeTxt: { color: '#FFF9F7', fontSize: 13 },

  // Welcome + Opening slides
  welcomeHi: {
    fontFamily: 'Playfair Display', fontSize: 24, fontStyle: 'italic',
    color: 'rgba(255,245,249,0.85)', textAlign: 'center', lineHeight: 30,
  },
  welcomeReady: {
    fontFamily: 'Playfair Display', fontSize: 38, fontStyle: 'italic',
    color: '#FFF5F9', textAlign: 'center', lineHeight: 46,
    textShadowColor: 'rgba(232,57,154,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 16,
  },
  welcomeHint: {
    fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,170,217,0.5)',
    letterSpacing: 1.5,
  },
  openingSlogan: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 4,
    color: 'rgba(15,3,17,0.55)',
    textTransform: 'uppercase',
  },
  openingMainYour: {
    fontFamily: 'Playfair Display',
    fontSize: 32,
    fontStyle: 'italic',
    color: '#0F0311',
  },
  openingMainBeauty: {
    fontFamily: 'Inter',
    fontSize: 72,
    fontWeight: '900',
    color: '#0F0311',
    lineHeight: 74,
    letterSpacing: -2,
    textAlign: 'center',
  },
  openingMainDna: {
    fontFamily: 'Inter',
    fontSize: 72,
    fontWeight: '900',
    color: '#0F0311',
    lineHeight: 74,
    letterSpacing: -1,
    textAlign: 'center',
  },
  openingMainHere: {
    fontFamily: 'Playfair Display',
    fontSize: 36,
    fontStyle: 'italic',
    color: '#0F0311',
  },
  openingYear: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 10,
    color: '#D4AF37',
  },

  // Tap zones
  tapLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: W * 0.28 },
  tapRight: { position: 'absolute', right: 0, top: 0, bottom: 0, left: W * 0.28 },

  // Unlock
  unlockWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    zIndex: 30, alignItems: 'center', gap: 10,
    paddingTop: 60, paddingHorizontal: 28,
  },
  unlockBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, width: '100%', paddingVertical: 16, borderRadius: 50, backgroundColor: '#FFFFFF',
  },
  unlockTxt: { fontFamily: 'Inter', fontSize: 15, fontWeight: '700', color: '#09090B', letterSpacing: 0.2 },
  unlockNote: { fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.2 },

  // Typography
  eyebrow: {
    fontFamily: 'Inter', fontSize: 10, fontWeight: '500',
    letterSpacing: 4, textTransform: 'uppercase', marginBottom: -6,
  },
  title: {
    fontFamily: 'Playfair Display', fontSize: 32, fontStyle: 'italic',
    textAlign: 'center', lineHeight: 38, marginBottom: 4, letterSpacing: 0.5
  },
  bigVal: {
    fontFamily: 'Playfair Display', fontSize: 38, fontStyle: 'italic',
    textAlign: 'center', lineHeight: 44, letterSpacing: 0.5
  },
  bodyTxt: { fontFamily: 'Inter', fontSize: 14, textAlign: 'center', lineHeight: 24, maxWidth: W - 80 },
  accent: { fontStyle: 'italic', fontWeight: '600' },
  lockedRow: { flexDirection: 'row', alignItems: 'center' },
  lockedDots: { fontFamily: 'Inter' },

  // Canvas
  canvasGlow: {
    position: 'absolute', width: W * 0.8, height: W * 0.8, borderRadius: W * 0.4,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 80,
  },
  canvasSwatch: {
    width: 220, height: 220, borderRadius: 110, overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.65, shadowRadius: 48,
  },
  hexCode: { fontFamily: 'Inter', fontSize: 24, fontWeight: '400', letterSpacing: 2 },
  shadesCard: {
    borderWidth: 1, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 18, gap: 8, width: '100%',
  },
  shadesRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  shadeBrand: { fontFamily: 'Inter', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  shadeName: { fontFamily: 'Inter', fontSize: 11, fontWeight: '600' },
  shadeSep: { fontFamily: 'Inter', fontSize: 11 },

  // Season
  seasonGrid: { flexDirection: 'row', gap: 10, marginVertical: 4 },
  seasonCard: {
    alignItems: 'center', gap: 10, paddingVertical: 18, paddingHorizontal: 10,
    borderRadius: 18, borderWidth: 1.5,
    width: (W - 56 - 30) / 4,
  },
  seasonSwatch: { width: 52, height: 52, borderRadius: 26 },
  seasonSwatchActive: { shadowColor: '#C8956A', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10 },
  seasonLabel: { fontFamily: 'Inter', fontSize: 10, fontWeight: '500' },
  paletteRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  paletteDot: { width: 34, height: 34, borderRadius: 17, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 6 },

  // Face shape
  shapeGlyph: { fontSize: 130, lineHeight: 140 },

  // Lash
  lashGlyph: { fontSize: 80, lineHeight: 90 },

  // Brows
  browRing: {
    width: 180, height: 180, borderRadius: 90, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 24,
  },
  browRingInner: {
    width: 140, height: 140, borderRadius: 70, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center', gap: 4,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 16,
  },
  browPct: { fontFamily: 'Playfair Display', fontSize: 40, fontStyle: 'italic', lineHeight: 46, letterSpacing: 0.5 },
  browLabel: { fontFamily: 'Inter', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },

  // Energy
  spectrumWrap: { flexDirection: 'row', alignItems: 'center', gap: 16, width: W - 80 },
  spectrumEndLabel: { fontFamily: 'Inter', fontSize: 11, width: 36, textAlign: 'center' },
  spectrumTrack: { flex: 1, height: 4, borderRadius: 2, position: 'relative', overflow: 'visible' },
  spectrumDot: {
    position: 'absolute', top: -7, width: 18, height: 18, borderRadius: 9,
    borderWidth: 2.5, marginLeft: -9,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 8,
  },

  // Archetype
  youAre: { fontFamily: 'Inter', fontSize: 13, fontWeight: '400', letterSpacing: 2, textTransform: 'uppercase', marginBottom: -10 },
  archetypeNameWrap: { overflow: 'hidden', borderRadius: 12 },
  archetypeHero: { fontFamily: 'Playfair Display', fontSize: 44, fontStyle: 'italic', textAlign: 'center', lineHeight: 50, letterSpacing: 0.5 },
  archetypeGlow: {
    position: 'absolute', width: W * 0.9, height: W * 0.9, borderRadius: W * 0.45,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 80,
  },

  // Lips / Blush
  lipSwatch: { width: 140, height: 140, borderRadius: 70, overflow: 'hidden', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 24 },
  blushSwatch: { width: 140, height: 140, borderRadius: 70, overflow: 'hidden', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 24 },

  // Kit — shopping card (white, full-width, tappable)
  kitCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  kitCardPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  kitCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kitCardBody: { flex: 1, gap: 2, minWidth: 0 },
  kitIndex: {
    fontFamily: 'Inter', fontSize: 11, fontWeight: '600',
    letterSpacing: 0.5, flexShrink: 0, width: 20, textAlign: 'center',
  },
  kitDividerV: { width: StyleSheet.hairlineWidth, height: 28, flexShrink: 0 },
  kitBrand: {
    fontFamily: 'Inter', fontSize: 10, fontWeight: '700',
    letterSpacing: 1.6, color: '#999', textTransform: 'uppercase',
  },
  kitProduct: {
    fontFamily: 'Inter', fontSize: 15, fontWeight: '600',
    color: '#1A1A1A', lineHeight: 21,
  },
  kitWhy: {
    fontFamily: 'Inter', fontSize: 12, fontWeight: '400',
    color: '#888', lineHeight: 17,
  },
  kitPricePill: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
    flexShrink: 0,
  },
  kitPriceLabel: {
    fontFamily: 'Inter', fontSize: 10, fontWeight: '600',
    color: '#666', letterSpacing: 0.3,
  },
  kitShopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EBEBEB',
  },
  kitShopIcon: { fontSize: 13 },
  kitShopLabel: {
    fontFamily: 'Inter', fontSize: 12, fontWeight: '600',
    color: '#1A1A1A', flex: 1, letterSpacing: 0.1,
  },
  kitShopArrow: {
    fontFamily: 'Inter', fontSize: 14, fontWeight: '400', color: '#999',
  },

  // Locked state — same shape as real card, frosted white, compact height
  kitCardLocked: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  kitLockedBar: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  kitLockedPill: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  kitLockedShopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.10)',
  },

  // legacy refs
  kitCardTop2: {},
  kitCatBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  kitCatText: { fontFamily: 'Inter', fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  kitPickNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kitPickNumText: { fontFamily: 'Inter', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  kitPrice: { fontFamily: 'Inter', fontSize: 11, letterSpacing: 1.5, flexShrink: 0 },

  // Summary (legacy — kept so no existing ref breaks)
  summaryCard: { width: '100%', borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  summaryLabel: { fontFamily: 'Inter', fontSize: 12, letterSpacing: 0.3 },
  summaryValue: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600' },
  summaryLockedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryLockedDots: { fontFamily: 'Inter', fontSize: 10, letterSpacing: 2 },
  shareBtn: { width: '100%', paddingVertical: 15, alignItems: 'center', borderRadius: 50 },
  shareBtnText: { fontFamily: 'Inter', fontSize: 14, fontWeight: '700' },

  // Final reveal — new design
  fnWrap2: {
    alignItems: 'center', paddingHorizontal: 22,
    gap: 16, paddingTop: 108,
  },
  fnHeroWrap: { alignItems: 'center', gap: 4, width: '100%' },
  fnArchNameHero: {
    fontFamily: 'Playfair Display', fontSize: 42, fontStyle: 'italic',
    textAlign: 'center', lineHeight: 48, width: '100%', letterSpacing: 0.5,
  },
  fnSwatchStrip: {
    flexDirection: 'row', gap: 8, justifyContent: 'center',
    width: '100%', paddingVertical: 4,
  },
  fnSwatchDot: {
    width: 36, height: 36, borderRadius: 18,
  },
  fnStatPillGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%',
  },
  fnStatPill: {
    width: '47%', borderRadius: 14, borderWidth: 1,
    paddingVertical: 12, paddingHorizontal: 14, gap: 4,
  },
  fnStatBlockValue2: {
    fontFamily: 'Inter', fontSize: 14, fontWeight: '800', letterSpacing: 0.2, textTransform: 'uppercase',
  },
  fnCanvasRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 14, width: '100%',
  },
  fnCanvasDot: {
    width: 32, height: 32, borderRadius: 16,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 8,
    flexShrink: 0,
  },
  fnShadeHint: {
    fontFamily: 'Inter', fontSize: 10, letterSpacing: 0.4, textAlign: 'right', lineHeight: 15,
  },

  // Legacy summary (kept to avoid breaking FinaleBar refs)
  fnWrap: {
    flex: 1, width: W, alignItems: 'center',
    paddingHorizontal: 24, gap: 14,
    paddingTop: 110, paddingBottom: 108,
  },
  fnHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  fnHairline: { flex: 1, height: StyleSheet.hairlineWidth },
  fnEyebrow: { fontFamily: 'Inter', fontSize: 9, fontWeight: '700', letterSpacing: 4, textTransform: 'uppercase' },
  fnBarsRow: { flexDirection: 'row', gap: 5, width: '100%' },
  fnBar: { flex: 1, height: 68, borderRadius: 10, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12 },
  fnSeasonLabel: { fontFamily: 'Inter', fontSize: 13, fontWeight: '800', letterSpacing: 2, textAlign: 'center', textTransform: 'uppercase' },
  fnArchWrap: { alignItems: 'center', gap: 8, width: '100%' },
  fnYouAre: { fontFamily: 'Inter', fontSize: 9, letterSpacing: 5, textTransform: 'uppercase', marginBottom: -4 },
  fnArchName: { fontFamily: 'Playfair Display', fontSize: 40, fontStyle: 'italic', textAlign: 'center', lineHeight: 46, letterSpacing: 0.5 },
  fnArchDesc: { fontFamily: 'Inter', fontSize: 12, fontStyle: 'italic', textAlign: 'center', lineHeight: 18, maxWidth: W - 80 },
  fnCard: { width: '100%', borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  fnStatRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11 },
  fnFoundRow: { gap: 10 },
  fnStatLabel: { fontFamily: 'Inter', fontSize: 9, fontWeight: '700', letterSpacing: 1.8, flex: 1 },
  fnStatValue: { fontFamily: 'Inter', fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  fnStatBlocked: { fontFamily: 'Inter', fontSize: 10, letterSpacing: 3 },
  fnFoundDot: { width: 14, height: 14, borderRadius: 7, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.65, shadowRadius: 4 },
  fnCta: { width: '100%', paddingVertical: 16, borderRadius: 50, alignItems: 'center' },
  fnCtaTxt: { fontFamily: 'Inter', fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },

  // Narrative reveal typography
  narrativeHook: {
    fontFamily: 'Playfair Display', fontSize: 22, fontStyle: 'italic',
    textAlign: 'center', lineHeight: 28,
  },
  narrativePunch: {
    fontFamily: 'Inter', fontSize: 18, fontWeight: '500',
    textAlign: 'center', lineHeight: 24, marginTop: 4,
  },
  revealLabel: {
    fontFamily: 'Playfair Display', fontSize: 14, fontStyle: 'italic',
    textAlign: 'center', marginBottom: -4,
  },
  kitRedactBar: { height: 10, borderRadius: 5, marginVertical: 2 },

  // Summary editorial grid
  fnStatGrid2: { flexDirection: 'row', width: '100%', gap: 0 },
  fnStatCol: { flex: 1, gap: 16, paddingHorizontal: 4 },
  fnStatBlock: { gap: 4 },
  fnStatBlockLabel: { fontFamily: 'Inter', fontSize: 9, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase' },
  fnStatBlockValue: { fontFamily: 'Inter', fontSize: 14, fontWeight: '800', letterSpacing: 0.2, textTransform: 'uppercase' },
  fnDivider: { width: '100%', height: StyleSheet.hairlineWidth },
  fnVertDivider: { width: StyleSheet.hairlineWidth, marginVertical: 4 },
  fnSkinRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, width: '100%' },

  // Spotify Wrapped high-energy cards
  spotifyCardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: W,
    height: 190,
    position: 'relative',
    marginVertical: 15,
  },
  spotifyCardWhite: {
    position: 'absolute',
    left: 28,
    width: W * 0.44,
    height: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    transform: [{ rotate: '-6deg' }, { translateY: -10 }],
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2, shadowRadius: 15, elevation: 8,
  },
  spotifyCardBlack: {
    position: 'absolute',
    right: 28,
    width: W * 0.44,
    height: 150,
    backgroundColor: '#0E020A',
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    transform: [{ rotate: '5deg' }, { translateY: 15 }],
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22, shadowRadius: 15, elevation: 8,
    borderWidth: 1.5, borderColor: '#E8399A',
  },
  spotifyCardIconBg: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'flex-start',
  },
  spotifyCardLbl: {
    fontFamily: 'Inter', fontSize: 10, fontWeight: '700',
    color: '#999', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  spotifyCardVal: {
    fontFamily: 'Inter', fontSize: 24, fontWeight: '900',
    color: '#111', textTransform: 'uppercase', letterSpacing: -1,
  },
});
