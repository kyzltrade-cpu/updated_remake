import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView, Linking } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  FadeIn, FadeInUp,
  useSharedValue, useAnimatedStyle,
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
import Svg, { Defs, Filter, FeTurbulence, FeColorMatrix, Rect } from 'react-native-svg';
import type { DnaResult } from '@/lib/api/dna';
import { SEASON_DESCRIPTIONS, ARCHETYPE_DESCRIPTIONS, SEASON_PALETTES } from '@/lib/api/dna';
import { useSubscription } from '@/contexts/subscription-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { DnaShareCard, CARD_W, CARD_H } from '@/components/dna-share-card';
import { findShades } from '@/lib/api/shades';
import { getKitForDna, type CategoryKit, type ProductRec } from '@/lib/api/recommendations';

const { width: W, height: H } = Dimensions.get('window');
const SLIDE_COUNT = 16;
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
// Preload the reveal track on slide 3 so the crossfade is instant with no silence.
const MUSIC_JOURNEY = require('../../assets/sounds/t5.mp3');  // energetic build
const MUSIC_REVEAL  = require('../../assets/sounds/tf.mp3');  // peak energy, archetype reveal
const MUSIC_VOL = 0.75;
const CROSSFADE_STEPS = 20;
const CROSSFADE_STEP_MS = 55; // 20 × 55ms = 1.1s crossfade
const MUSIC_REVEAL_SLIDE = 6;
const MUSIC_PRELOAD_SLIDE = 3;

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
  // 0 — Canvas: warm champagne ivory
  { gradientTop: '#F2E4D0', gradientBot: '#C49A6A', blobA: '#E0C088', blobB: '#C8A870', text: '#1E0C04', muted: 'rgba(30,12,4,0.55)', eyebrow: 'rgba(30,12,4,0.4)', accent: '#7A4010' },
  // 1 — Season: dusty rose blush
  { gradientTop: '#F7CDD6', gradientBot: '#C8607C', blobA: '#F0AABB', blobB: '#E88A9C', text: '#280510', muted: 'rgba(40,5,16,0.55)', eyebrow: 'rgba(40,5,16,0.4)', accent: '#7A2038' },
  // 2 — Face Shape: warm terracotta
  { gradientTop: '#F0C4A4', gradientBot: '#C07848', blobA: '#E8AC80', blobB: '#D09060', text: '#1E0800', muted: 'rgba(30,8,0,0.55)', eyebrow: 'rgba(30,8,0,0.4)', accent: '#7A3010' },
  // 3 — Brows: deep wine/burgundy
  { gradientTop: '#9A2848', gradientBot: '#3E0818', blobA: '#D04878', blobB: '#AA2850', text: '#FFE8EE', muted: 'rgba(255,232,238,0.62)', eyebrow: 'rgba(255,232,238,0.45)', accent: '#FFB0CC' },
  // 4 — Lashes: deep aubergine/plum
  { gradientTop: '#5C2060', gradientBot: '#1C0824', blobA: '#9C40B0', blobB: '#7820A0', text: '#F8EEFF', muted: 'rgba(248,238,255,0.62)', eyebrow: 'rgba(248,238,255,0.45)', accent: '#D0A0E0' },
  // 5 — Energy: rust/burnt sienna
  { gradientTop: '#D86838', gradientBot: '#8A2810', blobA: '#F09060', blobB: '#E07040', text: '#FFF0E8', muted: 'rgba(255,240,232,0.62)', eyebrow: 'rgba(255,240,232,0.45)', accent: '#FFB890' },
  // 6 — Archetype: electric magenta (THE REVEAL)
  { gradientTop: '#F02888', gradientBot: '#920040', blobA: '#FF70C0', blobB: '#FF40A8', text: '#FFF0F8', muted: 'rgba(255,240,248,0.72)', eyebrow: 'rgba(255,240,248,0.5)', accent: '#FFFFFF' },
  // 7 — Lips: deep berry/raspberry
  { gradientTop: '#A83868', gradientBot: '#400820', blobA: '#D870A0', blobB: '#B84880', text: '#FFE8F0', muted: 'rgba(255,232,240,0.62)', eyebrow: 'rgba(255,232,240,0.45)', accent: '#FFB0C8' },
  // 8 — Blush: warm coral rose
  { gradientTop: '#E88878', gradientBot: '#B83840', blobA: '#F0ACA0', blobB: '#E08078', text: '#FFF4F0', muted: 'rgba(255,244,240,0.62)', eyebrow: 'rgba(255,244,240,0.45)', accent: '#FFCAB8' },
  // 9 — Foundation: warm mocha/sienna
  { gradientTop: '#906050', gradientBot: '#402010', blobA: '#C08860', blobB: '#A06840', text: '#FFF4EE', muted: 'rgba(255,244,238,0.62)', eyebrow: 'rgba(255,244,238,0.45)', accent: '#D0A888' },
  // 10 — Blush recs: soft clay peach
  { gradientTop: '#D4897A', gradientBot: '#8C3828', blobA: '#E8B0A0', blobB: '#D07868', text: '#FFF6F4', muted: 'rgba(255,246,244,0.65)', eyebrow: 'rgba(255,246,244,0.45)', accent: '#FFD0C0' },
  // 11 — Mascara: deep charcoal night
  { gradientTop: '#2C2840', gradientBot: '#0A0814', blobA: '#5C5080', blobB: '#402868', text: '#F0EEF8', muted: 'rgba(240,238,248,0.62)', eyebrow: 'rgba(240,238,248,0.42)', accent: '#C0B0E0' },
  // 12 — Eye: rich forest emerald
  { gradientTop: '#244830', gradientBot: '#061808', blobA: '#3A7848', blobB: '#286038', text: '#EEFAF2', muted: 'rgba(238,250,242,0.62)', eyebrow: 'rgba(238,250,242,0.42)', accent: '#A0E8B8' },
  // 13 — Lip: deep crimson velvet
  { gradientTop: '#8C2038', gradientBot: '#300810', blobA: '#C04868', blobB: '#A02848', text: '#FFF0F4', muted: 'rgba(255,240,244,0.65)', eyebrow: 'rgba(255,240,244,0.45)', accent: '#FFB0C8' },
  // 14 — Skincare: sage mist
  { gradientTop: '#5A7860', gradientBot: '#1A3820', blobA: '#8AB898', blobB: '#6A9878', text: '#F0F8F2', muted: 'rgba(240,248,242,0.62)', eyebrow: 'rgba(240,248,242,0.42)', accent: '#C0E8CC' },
  // 15 — Summary: deep midnight gold (finale)
  { gradientTop: '#1C0838', gradientBot: '#060108', blobA: '#D4AF37', blobB: '#C8906A', text: '#FFEEDD', muted: 'rgba(255,238,221,0.6)', eyebrow: 'rgba(255,238,221,0.4)', accent: '#D4AF37' },
];

// ── Grain overlay (iOS renders, Android gracefully skips) ─────────────────────

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

  const blobFromStyle = useAnimatedStyle(() => ({ opacity: (1 - morphProgress.value) * 0.22 }));
  const blobToStyle = useAnimatedStyle(() => ({ opacity: morphProgress.value * 0.22 }));

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
  return <Animated.View style={[StyleSheet.absoluteFill, sty]}>{children}</Animated.View>;
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

function ProgressSeg({ i, current, progress }: { i: number; current: number; progress: SharedValue<number> }) {
  const fillStyle = useAnimatedStyle(() => ({
    width: i < current ? SEG_W : i === current ? progress.value * SEG_W : 0,
  }));
  return (
    <View style={[ds.segTrack, { width: SEG_W }]}>
      <Animated.View style={[ds.segFill, fillStyle]} />
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

// ── Slide: Canvas ─────────────────────────────────────────────────────────────

function SlideCanvas({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  const glAl = useSharedValue(0.1);
  const shades = isLocked ? null : findShades(dna.skinToneHex);
  useEffect(() => {
    glAl.value = withRepeat(
      withSequence(withTiming(0.18, { duration: 1200 }), withTiming(0.06, { duration: 1200 })),
      -1, true,
    );
  }, []);
  const glSty = useAnimatedStyle(() => ({ opacity: glAl.value }));

  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <Animated.View style={[ds.canvasGlow, { backgroundColor: dna.skinToneHex, shadowColor: dna.skinToneHex }, glSty]} />
      <View style={ds.bodyWrap}>
        <DropIn delay={0}>
          <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>YOUR CANVAS</Text>
        </DropIn>
        <RevealItem delay={600}>
          <Text style={[ds.narrativeHook, { color: colors.muted }]}>{'There are thousands of foundation shades\nout there.'}</Text>
        </RevealItem>
        <RevealItem delay={1400}>
          <Text style={[ds.narrativePunch, { color: colors.text }]}>{'Yours is the only one\nthat matters.'}</Text>
        </RevealItem>
        {/* Ripple rings radiate from behind the swatch */}
        <View style={{ width: 240, height: 240, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
            <RippleRings color={dna.skinToneHex} size={220} delay={1700} />
          </View>
          <PopIn delay={2100}>
            <View style={[ds.canvasSwatch, { backgroundColor: dna.skinToneHex, shadowColor: dna.skinToneHex }]}>
              {isLocked && <BlurView intensity={28} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 110 }]} />}
            </View>
          </PopIn>
        </View>
        {isLocked
          ? <RevealItem delay={3000}><LockedValue size="lg" color={colors.muted} /></RevealItem>
          : <RevealPop delay={3000}><Text style={[ds.hexCode, { color: colors.text }]}>{dna.skinToneHex.toUpperCase()}</Text></RevealPop>}
        {shades && (
          <RevealItem delay={3500}>
            <View style={[ds.shadesCard, { borderColor: `${colors.text}22`, backgroundColor: 'rgba(0,0,0,0.08)' }]}>
              <View style={ds.shadesRow}>
                <Text style={[ds.shadeBrand, { color: colors.eyebrow }]}>Fenty</Text><Text style={[ds.shadeName, { color: colors.text }]}>{shades.Fenty}</Text>
                <Text style={[ds.shadeSep, { color: `${colors.text}33` }]}>·</Text>
                <Text style={[ds.shadeBrand, { color: colors.eyebrow }]}>MAC</Text><Text style={[ds.shadeName, { color: colors.text }]}>{shades.MAC}</Text>
                <Text style={[ds.shadeSep, { color: `${colors.text}33` }]}>·</Text>
                <Text style={[ds.shadeBrand, { color: colors.eyebrow }]}>Maybelline</Text><Text style={[ds.shadeName, { color: colors.text }]}>{shades.Maybelline}</Text>
              </View>
              <View style={ds.shadesRow}>
                <Text style={[ds.shadeBrand, { color: colors.eyebrow }]}>L'Oréal</Text><Text style={[ds.shadeName, { color: colors.text }]}>{shades["L'Oréal"]}</Text>
                <Text style={[ds.shadeSep, { color: `${colors.text}33` }]}>·</Text>
                <Text style={[ds.shadeBrand, { color: colors.eyebrow }]}>NARS</Text><Text style={[ds.shadeName, { color: colors.text }]}>{shades.NARS}</Text>
              </View>
            </View>
          </RevealItem>
        )}
      </View>
    </View>
  );
}

// ── Slide: Season ─────────────────────────────────────────────────────────────

const SWATCH_SEASON: Record<string, string> = {
  Spring: '#F4A261', Summer: '#A8C4D5', Autumn: '#C8956A', Winter: '#7A8FBF',
};

function SlideSeason({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  const allSeasons = ['Spring', 'Summer', 'Autumn', 'Winter'];
  const userSeason = dna.colorSeason.split(' ').pop()!;
  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <View style={ds.bodyWrap}>
        <RevealItem delay={0}>
          <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>COLOUR SEASON</Text>
        </RevealItem>
        <RevealItem delay={700}>
          <Text style={[ds.narrativeHook, { color: colors.muted }]}>{'Most people spend years wearing\ncolours that fight their face.'}</Text>
        </RevealItem>
        <RevealItem delay={1500}>
          <Text style={[ds.narrativePunch, { color: colors.text }]}>{"You won't anymore."}</Text>
        </RevealItem>
        {/* Animated bar chart — each season grows to its height, active season tallest + glowing */}
        <View style={{ flexDirection: 'row', gap: 10, height: 164, alignItems: 'flex-end', paddingHorizontal: 8, width: W - 56 }}>
          {allSeasons.map((s, i) => (
            <SeasonBar
              key={s}
              name={s}
              color={SWATCH_SEASON[s] ?? '#CCC'}
              targetH={!isLocked && s === userSeason ? 140 : [72, 90, 116, 100][i]}
              isActive={!isLocked && s === userSeason}
              index={i}
              isLocked={isLocked}
              textColor={colors.text}
              mutedColor={colors.muted}
            />
          ))}
        </View>
        {isLocked
          ? <RevealItem delay={2800}><LockedValue size="md" color={colors.muted} /></RevealItem>
          : <>
              <RevealItem delay={3000} fast>
                <Text style={[ds.revealLabel, { color: colors.muted }]}>Your colour season is</Text>
              </RevealItem>
              <RevealPop delay={3200}>
                <Text style={[ds.bigVal, { color: colors.accent }]}>{dna.colorSeason}</Text>
              </RevealPop>
            </>}
      </View>
    </View>
  );
}

// ── Slide: Face Shape ─────────────────────────────────────────────────────────

const GLYPHS: Record<string, string> = {
  Oval: '⬭', Round: '○', Heart: '♡', Square: '□', Oblong: '▭',
};

function SlideFaceShape({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <View style={ds.bodyWrap}>
        {/* Glyph spins in — rotation makes it feel completely different from any other slide */}
        <SpinIn delay={0}>
          <Text style={[ds.shapeGlyph, { color: `${colors.text}99` }]}>
            {isLocked ? '⬭' : (GLYPHS[dna.faceShape] ?? '⬭')}
          </Text>
        </SpinIn>
        <DropIn delay={600}>
          <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>FACE SHAPE</Text>
        </DropIn>
        <RevealItem delay={1100}>
          <Text style={[ds.narrativeHook, { color: colors.muted }]}>{'Brow arch, highlight zones,\ncontour map —'}</Text>
        </RevealItem>
        <RevealItem delay={1800}>
          <Text style={[ds.narrativePunch, { color: colors.text }]}>{'all of it is built\naround this.'}</Text>
        </RevealItem>
        {isLocked
          ? <RevealItem delay={2500}><LockedValue size="lg" color={colors.muted} /></RevealItem>
          : <>
              <RevealItem delay={2500} fast>
                <Text style={[ds.revealLabel, { color: colors.muted }]}>Your face shape is</Text>
              </RevealItem>
              <RevealPop delay={2700}>
                <Text style={[ds.bigVal, { color: colors.accent }]}>{dna.faceShape}</Text>
              </RevealPop>
            </>}
      </View>
    </View>
  );
}

// ── Slide: Brows ──────────────────────────────────────────────────────────────

function SlideBrows({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  const [displayPct, setDisplayPct] = useState(0);
  useEffect(() => {
    if (isLocked) return;
    const target = dna.browSymmetryPct;
    let frame = 0;
    // Ease-out counter — fast start, slows into final number
    const totalFrames = 36;
    const id = setInterval(() => {
      frame++;
      const eased = 1 - Math.pow(1 - frame / totalFrames, 3);
      setDisplayPct(Math.round(eased * target));
      if (frame >= totalFrames) clearInterval(id);
    }, 48);
    return () => clearInterval(id);
  }, [isLocked]);

  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <View style={ds.bodyWrap}>
        <DropIn delay={0}>
          <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>BROW BLUEPRINT</Text>
        </DropIn>
        <RevealItem delay={600}>
          <Text style={[ds.narrativeHook, { color: colors.muted }]}>{'Nothing rewrites your face\nfaster than your brows.'}</Text>
        </RevealItem>
        <RevealItem delay={1400}>
          <Text style={[ds.narrativePunch, { color: colors.text }]}>{"Here's your blueprint."}</Text>
        </RevealItem>
        {/* Ring bounces in with overshoot, counter eases out to final number */}
        <PopIn delay={2100}>
          <View style={[ds.browRing, { borderColor: `${colors.text}30`, shadowColor: colors.text }]}>
            <View style={[ds.browRingInner, { borderColor: colors.text, shadowColor: colors.text }]}>
              {isLocked
                ? <MaterialIcons name="lock" size={32} color={colors.muted} />
                : <>
                    <Text style={[ds.browPct, { color: colors.text }]}>{displayPct}%</Text>
                    <Text style={[ds.browLabel, { color: colors.muted }]}>symmetry</Text>
                  </>}
            </View>
          </View>
        </PopIn>
        {/* Two bars extending symmetrically from centre — mirrors the symmetry concept */}
        <SymmetryBars color={colors.text} />
        {isLocked
          ? <RevealItem delay={2900}><LockedValue size="lg" color={colors.muted} /></RevealItem>
          : <>
              <RevealItem delay={2900} fast>
                <Text style={[ds.revealLabel, { color: colors.muted }]}>Your brow shape is</Text>
              </RevealItem>
              <RevealPop delay={3100}>
                <Text style={[ds.bigVal, { color: colors.accent }]}>{dna.browShape}</Text>
              </RevealPop>
            </>}
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
          <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>LASH PROFILE</Text>
        </DropIn>
        <RevealItem delay={350}>
          <Text style={[ds.narrativeHook, { color: colors.muted }]}>{'The right formula and technique\nturns your natural lashes'}</Text>
        </RevealItem>
        <RevealItem delay={850}>
          <Text style={[ds.narrativePunch, { color: colors.text }]}>{'into your signature.'}</Text>
        </RevealItem>
        {/* Stars scatter from centre — each one arrives from a different direction */}
        <LashStars delay={1350} color={`${colors.text}88`} />
        {isLocked
          ? <RevealItem delay={2050}><LockedValue size="lg" color={colors.muted} /></RevealItem>
          : <>
              <RevealItem delay={2050} fast>
                <Text style={[ds.revealLabel, { color: colors.muted }]}>Your lash profile is</Text>
              </RevealItem>
              <RevealPop delay={2270}>
                <Text style={[ds.bigVal, { color: colors.accent }]}>{dna.lashProfile}</Text>
              </RevealPop>
            </>}
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
  useEffect(() => {
    dotX.value = withDelay(2100, withSpring(0, { damping: 5, stiffness: 55 }));
  }, []);
  const dotSty = useAnimatedStyle(() => ({ transform: [{ translateX: dotX.value }] }));

  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <View style={ds.bodyWrap}>
        <DropIn delay={0}>
          <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>ENERGY TYPE</Text>
        </DropIn>
        <RevealItem delay={500}>
          <Text style={[ds.narrativeHook, { color: colors.muted }]}>{'Every face leans one of two ways —\nsharp and graphic,'}</Text>
        </RevealItem>
        <RevealItem delay={1100}>
          <Text style={[ds.narrativePunch, { color: colors.text }]}>{'or soft and blended.'}</Text>
        </RevealItem>
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
                <Text style={[ds.revealLabel, { color: colors.muted }]}>Your energy type is</Text>
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
          <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>BEAUTY ARCHETYPE</Text>
        </RevealItem>
        <RevealItem delay={800}>
          <Text style={[ds.narrativeHook, { color: colors.muted }]}>{'Your season. Your shape.\nYour energy.'}</Text>
        </RevealItem>
        <RevealItem delay={1800}>
          <Text style={[ds.narrativePunch, { color: colors.text }]}>{'They all point to one identity.'}</Text>
        </RevealItem>
        <RevealItem delay={2300} fast>
          <Text style={[ds.youAre, { color: colors.muted }]}>You are</Text>
        </RevealItem>
        <RevealPop delay={2500}>
          <View style={ds.archetypeNameWrap}>
            {isLocked
              ? <Text style={[ds.archetypeHero, { color: `${colors.accent}40`, letterSpacing: 8 }]}>{'●●●●●●●'}</Text>
              : <Text style={[ds.archetypeHero, { color: colors.accent }]}>{dna.archetype}</Text>}
          </View>
        </RevealPop>
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

  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <View style={ds.bodyWrap}>
        <RevealItem delay={0}>
          <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>LIP TONE</Text>
        </RevealItem>
        <RevealItem delay={350}>
          <Text style={[ds.narrativeHook, { color: colors.muted }]}>{'There are hundreds of lip shades.\nMost will wash you out.'}</Text>
        </RevealItem>
        <RevealItem delay={750}>
          <Text style={[ds.narrativePunch, { color: colors.text }]}>{"Yours won't."}</Text>
        </RevealItem>
        {/* Ripple rings emanate from the lip swatch */}
        <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
            <RippleRings color={lipHex} size={140} delay={1200} />
          </View>
          <PopIn delay={1400}>
            <View style={[ds.lipSwatch, { backgroundColor: lipHex, shadowColor: lipHex }]}>
              {isLocked && <BlurView intensity={28} tint="light" style={[StyleSheet.absoluteFillObject, { borderRadius: 70 }]} />}
            </View>
          </PopIn>
        </View>
        {isLocked
          ? <RevealItem delay={2000}><LockedValue size="lg" color={colors.muted} /></RevealItem>
          : <>
              <RevealItem delay={2000} fast>
                <Text style={[ds.revealLabel, { color: colors.muted }]}>Your lip tone is</Text>
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
          <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>BLUSH</Text>
        </RevealItem>
        <RevealItem delay={450}>
          <Text style={[ds.narrativeHook, { color: colors.muted }]}>{'Blush in the wrong tone\nfights your face.'}</Text>
        </RevealItem>
        <RevealItem delay={1000}>
          <Text style={[ds.narrativePunch, { color: colors.text }]}>{'In the right tone, it lifts everything.'}</Text>
        </RevealItem>
        {/* Three blush dots pop in one-two-three — like actual blush placement */}
        <BlushDots delay={1600} hex={blushHex} isLocked={isLocked} />
        {isLocked
          ? <RevealItem delay={2400}><LockedValue size="lg" color={colors.muted} /></RevealItem>
          : <>
              <RevealItem delay={2500} fast>
                <Text style={[ds.revealLabel, { color: colors.muted }]}>Your blush is</Text>
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

// ── Main screen ───────────────────────────────────────────────────────────────

const KIT_CATEGORY_COUNT = 6;

function renderSlide(idx: number, dna: DnaResult, locked: boolean, onShare: () => void) {
  const colors = SLIDE_COLORS[idx] ?? SLIDE_COLORS[0];
  if (idx >= 9 && idx <= 14) {
    const kits = getKitForDna(dna.archetype);
    const kit = kits[idx - 9] ?? kits[0];
    return (
      <SlideKitCategory
        kit={kit}
        isLocked={locked}
        colors={colors}
        slideNum={idx - 8}
        totalSlides={KIT_CATEGORY_COUNT}
      />
    );
  }
  switch (idx) {
    case 0: return <SlideCanvas dna={dna} isLocked={locked} colors={colors} />;
    case 1: return <SlideSeason dna={dna} isLocked={locked} colors={colors} />;
    case 2: return <SlideFaceShape dna={dna} isLocked={locked} colors={colors} />;
    case 3: return <SlideBrows dna={dna} isLocked={locked} colors={colors} />;
    case 4: return <SlideLashes dna={dna} isLocked={locked} colors={colors} />;
    case 5: return <SlideEnergy dna={dna} isLocked={locked} colors={colors} />;
    case 6: return <SlideArchetype dna={dna} isLocked={locked} colors={colors} />;
    case 7: return <SlideLips dna={dna} isLocked={locked} colors={colors} />;
    case 8: return <SlideBlush dna={dna} isLocked={locked} colors={colors} />;
    case 15: return <SlideSummary dna={dna} isLocked={locked} onShare={onShare} colors={colors} />;
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
  const clearOutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareCardRef = useRef<View>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const { subscription } = useSubscription();
  const isPro = subscription?.plan === 'pro' || (__DEV__ && params.bypass === '1');
  const progress = useSharedValue(0);

  // Background morph state — drives MorphingBackground and PersistentAmbient
  const morphProgress = useSharedValue(0);
  const [bgFrom, setBgFrom] = useState(0);
  const [bgTo, setBgTo] = useState(0);

  useEffect(() => {
    if (params.dna) {
      try { setDna(JSON.parse(params.dna) as DnaResult); return; } catch { /* fall through */ }
    }
    AsyncStorage.getItem('dna_result').then(raw => {
      if (raw) try { setDna(JSON.parse(raw) as DnaResult); } catch { /* ignore */ }
    });
  }, [params.dna]);

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
        morphProgress.value = 0;
      }
    });
    slideDispatch({ type: 'go', to });
    if (clearOutRef.current) clearTimeout(clearOutRef.current);
    clearOutRef.current = setTimeout(() => slideDispatch({ type: 'done' }), 210);
  }, [morphProgress]);

  const advanceCurrent = useCallback(() => {
    navigateTo(Math.min(current + 1, SLIDE_COUNT - 1), current);
  }, [current, navigateTo]);

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withTiming(1, { duration: SLIDE_DURATION }, (finished) => {
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

  const displayDna = (isPro ? dna : null) ?? PLACEHOLDER_DNA;
  const locked = !isPro;

  return (
    <View style={ds.root}>
      {/* Persistent world — never remounts */}
      <MorphingBackground fromIdx={bgFrom} toIdx={bgTo} morphProgress={morphProgress} />
      <GrainOverlay />
      <PersistentAmbient fromIdx={bgFrom} toIdx={bgTo} morphProgress={morphProgress} />

      {/* Content only — dissolves out then in */}
      {slideState.outgoing && (
        <OutgoingContent key={`out-${slideState.outgoing.uid}`}>
          {renderSlide(slideState.outgoing.idx, displayDna, locked, handleShare)}
        </OutgoingContent>
      )}
      {slideState.uid === 0 ? (
        <View key="init" style={StyleSheet.absoluteFill}>
          {renderSlide(current, displayDna, locked, handleShare)}
        </View>
      ) : (
        <IncomingContent key={`in-${slideState.uid}`} dir={slideState.dir}>
          {renderSlide(current, displayDna, locked, handleShare)}
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
            <ProgressSeg key={i} i={i} current={current} progress={progress} />
          ))}
        </View>
        <Pressable hitSlop={12} style={ds.closeBtn} onPress={handleClose}>
          <Text style={ds.closeTxt}>✕</Text>
        </Pressable>
      </View>

      {/* Unlock strip */}
      {locked && (
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
  bodyWrap: { alignItems: 'center', paddingHorizontal: 28, gap: 20, paddingBottom: 160, width: W },
  kitBodyWrap: { gap: 8, paddingBottom: 160 },

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
  segTrack: { height: 2.5, borderRadius: 1.5, backgroundColor: 'rgba(255,249,247,0.2)', overflow: 'hidden' },
  segFill: { height: '100%', backgroundColor: '#FFF9F7', borderRadius: 1.5 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center',
  },
  closeTxt: { color: '#FFF9F7', fontSize: 13 },

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
    fontFamily: 'Inter', fontSize: 10, fontWeight: '700',
    letterSpacing: 3, textTransform: 'uppercase', marginBottom: -6,
  },
  title: { fontFamily: 'Playfair Display', fontSize: 42, textAlign: 'center', lineHeight: 50, marginBottom: 4 },
  bigVal: { fontFamily: 'Playfair Display', fontSize: 50, fontStyle: 'italic', textAlign: 'center', lineHeight: 58 },
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
  hexCode: { fontFamily: 'Playfair Display', fontSize: 36, letterSpacing: 3 },
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
  browPct: { fontFamily: 'Playfair Display', fontSize: 44, lineHeight: 50 },
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
  archetypeHero: { fontFamily: 'Playfair Display', fontSize: 68, textAlign: 'center', lineHeight: 76 },
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
    fontFamily: 'Playfair Display', fontSize: 68, fontStyle: 'italic',
    textAlign: 'center', lineHeight: 76, width: '100%',
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
    fontFamily: 'Playfair Display', fontSize: 15, fontStyle: 'italic', letterSpacing: 0.2,
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
  fnSeasonLabel: { fontFamily: 'Playfair Display', fontSize: 13, fontStyle: 'italic', letterSpacing: 2, textAlign: 'center' },
  fnArchWrap: { alignItems: 'center', gap: 8, width: '100%' },
  fnYouAre: { fontFamily: 'Inter', fontSize: 9, letterSpacing: 5, textTransform: 'uppercase', marginBottom: -4 },
  fnArchName: { fontFamily: 'Playfair Display', fontSize: 62, fontStyle: 'italic', textAlign: 'center', lineHeight: 68 },
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
    fontFamily: 'Inter', fontSize: 20, fontWeight: '400',
    textAlign: 'center', lineHeight: 28,
  },
  narrativePunch: {
    fontFamily: 'Playfair Display', fontSize: 22, fontStyle: 'italic',
    textAlign: 'center', lineHeight: 28, marginTop: -4,
  },
  revealLabel: {
    fontFamily: 'Inter', fontSize: 12, fontWeight: '400',
    textAlign: 'center', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: -8,
  },
  kitRedactBar: { height: 10, borderRadius: 5, marginVertical: 2 },

  // Summary editorial grid
  fnStatGrid2: { flexDirection: 'row', width: '100%', gap: 0 },
  fnStatCol: { flex: 1, gap: 16, paddingHorizontal: 4 },
  fnStatBlock: { gap: 4 },
  fnStatBlockLabel: { fontFamily: 'Inter', fontSize: 9, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase' },
  fnStatBlockValue: { fontFamily: 'Playfair Display', fontSize: 16, fontStyle: 'italic', letterSpacing: 0.2 },
  fnDivider: { width: '100%', height: StyleSheet.hairlineWidth },
  fnVertDivider: { width: StyleSheet.hairlineWidth, marginVertical: 4 },
  fnSkinRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, width: '100%' },
});
