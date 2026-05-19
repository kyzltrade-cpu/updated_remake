import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  FadeIn, FadeInUp,
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withDelay, withRepeat, withSequence,
  cancelAnimation, runOnJS,
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
import { getRecsForDna, type ProductRec } from '@/lib/api/recommendations';

const { width: W, height: H } = Dimensions.get('window');
const SLIDE_COUNT = 11;
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
  // 9 — Kit: warm mocha/sienna
  { gradientTop: '#906050', gradientBot: '#402010', blobA: '#C08860', blobB: '#A06840', text: '#FFF4EE', muted: 'rgba(255,244,238,0.62)', eyebrow: 'rgba(255,244,238,0.45)', accent: '#D0A888' },
  // 10 — Summary: midnight wine
  { gradientTop: '#4A1830', gradientBot: '#180408', blobA: '#A840B0', blobB: '#FF60A8', text: '#FFE8F4', muted: 'rgba(255,232,244,0.62)', eyebrow: 'rgba(255,232,244,0.45)', accent: '#FFB0D8' },
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

function ConfettiBurst() {
  const [pieces] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      angle: (i / 20) * Math.PI * 2,
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

// ── Content transitions — dissolve, no x-axis movement ───────────────────────

function OutgoingContent({ children }: { children: React.ReactNode }) {
  const op = useSharedValue(1);
  const ty = useSharedValue(0);
  useEffect(() => {
    op.value = withTiming(0, { duration: 220 });
    ty.value = withTiming(-24, { duration: 280 });
  }, []);
  const sty = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));
  return <Animated.View style={[StyleSheet.absoluteFill, sty]}>{children}</Animated.View>;
}

function IncomingContent({ children }: { children: React.ReactNode }) {
  const op = useSharedValue(0);
  const ty = useSharedValue(28);
  useEffect(() => {
    op.value = withDelay(160, withTiming(1, { duration: 300 }));
    ty.value = withDelay(160, withSpring(0, { damping: 22, stiffness: 180 }));
  }, []);
  const sty = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
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

// ── Slide: Canvas ─────────────────────────────────────────────────────────────

function SlideCanvas({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  const sc = useSharedValue(0.55);
  const glAl = useSharedValue(0.1);
  const shades = isLocked ? null : findShades(dna.skinToneHex);
  useEffect(() => {
    sc.value = withSpring(1, { damping: 10, stiffness: 88 });
    glAl.value = withRepeat(
      withSequence(withTiming(0.18, { duration: 1200 }), withTiming(0.06, { duration: 1200 })),
      -1, true,
    );
  }, []);
  const swSty = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  const glSty = useAnimatedStyle(() => ({ opacity: glAl.value }));

  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <Animated.View style={[ds.canvasGlow, { backgroundColor: dna.skinToneHex, shadowColor: dna.skinToneHex }, glSty]} />
      <Animated.View entering={FadeInUp.delay(80).duration(400)} style={ds.bodyWrap}>
        <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>YOUR CANVAS</Text>
        <Animated.View style={[ds.canvasSwatch, { backgroundColor: dna.skinToneHex, shadowColor: dna.skinToneHex }, swSty]}>
          {isLocked && <BlurView intensity={28} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 110 }]} />}
        </Animated.View>
        {isLocked ? <LockedValue size="lg" color={colors.muted} /> : <Text style={[ds.hexCode, { color: colors.text }]}>{dna.skinToneHex.toUpperCase()}</Text>}
        <Text style={[ds.title, { color: colors.text }]}>Foundation Shade</Text>
        {shades && (
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
        )}
        <Text style={[ds.bodyTxt, { color: colors.muted }]}>Your perfect foundation match — the shade that makes your skin glow instead of fight.</Text>
      </Animated.View>
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
      <Animated.View entering={FadeInUp.delay(80).duration(400)} style={ds.bodyWrap}>
        <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>COLOUR SEASON</Text>
        <Text style={[ds.title, { color: colors.text }]}>Your Season</Text>
        <View style={ds.seasonGrid}>
          {allSeasons.map((s, i) => {
            const active = !isLocked && s === userSeason;
            return (
              <Animated.View key={s} entering={FadeInUp.delay(200 + i * 70).duration(400)} style={[ds.seasonCard, { borderColor: `${colors.text}18`, backgroundColor: 'rgba(0,0,0,0.12)' }, active && { borderColor: colors.text, backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <View style={[ds.seasonSwatch, { backgroundColor: isLocked ? SWATCH_SEASON[s] + '55' : SWATCH_SEASON[s] }, active && ds.seasonSwatchActive]} />
                <Text style={[ds.seasonLabel, { color: colors.muted }, active && { color: colors.text, fontWeight: '700' }]}>{s}</Text>
              </Animated.View>
            );
          })}
        </View>
        {isLocked ? <LockedValue size="md" color={colors.muted} /> : (
          <>
            <View style={ds.paletteRow}>
              {SEASON_PALETTES[dna.colorSeason].map((hex, i) => (
                <Animated.View key={i} entering={FadeIn.delay(450 + i * 60).duration(300)} style={[ds.paletteDot, { backgroundColor: hex, shadowColor: hex }]} />
              ))}
            </View>
            <Text style={[ds.bodyTxt, { color: colors.muted }]}>
              You are a <Text style={[ds.accent, { color: colors.text }]}>{dna.colorSeason}</Text>.
              {'\n'}{SEASON_DESCRIPTIONS[dna.colorSeason]}
            </Text>
          </>
        )}
      </Animated.View>
    </View>
  );
}

// ── Slide: Face Shape ─────────────────────────────────────────────────────────

const GLYPHS: Record<string, string> = {
  Oval: '⬭', Round: '○', Heart: '♡', Square: '□', Oblong: '▭',
};

function SlideFaceShape({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  const sc = useSharedValue(0.35);
  const rot = useSharedValue(-12);
  useEffect(() => {
    sc.value = withDelay(150, withSpring(1, { damping: 9, stiffness: 80 }));
    rot.value = withDelay(150, withSpring(0, { damping: 9, stiffness: 80 }));
  }, []);
  const glyphSty = useAnimatedStyle(() => ({
    transform: [{ scale: sc.value }, { rotate: `${rot.value}deg` }],
  }));

  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <Animated.View entering={FadeInUp.delay(80).duration(400)} style={ds.bodyWrap}>
        <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>FACE SHAPE</Text>
        <Animated.Text style={[ds.shapeGlyph, { color: `${colors.text}99` }, glyphSty]}>
          {isLocked ? '⬭' : (GLYPHS[dna.faceShape] ?? '⬭')}
        </Animated.Text>
        <Text style={[ds.title, { color: colors.text }]}>Your Face Shape</Text>
        {isLocked ? <LockedValue size="lg" color={colors.muted} /> : <Text style={[ds.bigVal, { color: colors.accent }]}>{dna.faceShape}</Text>}
        <Text style={[ds.bodyTxt, { color: colors.muted }]}>
          {isLocked
            ? 'Your face shape sets every rule — brow placement, highlight zones, contour map. Unlock to see yours.'
            : `Your ${dna.faceShape.toLowerCase()} face has its own blueprint. Your coaching is built around it.`}
        </Text>
      </Animated.View>
    </View>
  );
}

// ── Slide: Brows ──────────────────────────────────────────────────────────────

function SlideBrows({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  const ringSc = useSharedValue(0);
  const [displayPct, setDisplayPct] = useState(0);
  useEffect(() => {
    ringSc.value = withSpring(1, { damping: 10, stiffness: 75 });
    if (isLocked) return;
    const target = dna.browSymmetryPct;
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      setDisplayPct(Math.round((frame / 30) * target));
      if (frame >= 30) clearInterval(id);
    }, 33);
    return () => clearInterval(id);
  }, []);
  const ringSty = useAnimatedStyle(() => ({ transform: [{ scale: ringSc.value }] }));

  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <Animated.View entering={FadeInUp.delay(80).duration(400)} style={ds.bodyWrap}>
        <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>BROW BLUEPRINT</Text>
        <Animated.View style={[ds.browRing, { borderColor: `${colors.text}30`, shadowColor: colors.text }, ringSty]}>
          <View style={[ds.browRingInner, { borderColor: colors.text, shadowColor: colors.text }]}>
            {isLocked
              ? <MaterialIcons name="lock" size={32} color={colors.muted} />
              : <>
                  <Text style={[ds.browPct, { color: colors.text }]}>{displayPct}%</Text>
                  <Text style={[ds.browLabel, { color: colors.muted }]}>symmetry</Text>
                </>}
          </View>
        </Animated.View>
        <Text style={[ds.title, { color: colors.text }]}>Your Brows</Text>
        {isLocked ? <LockedValue size="lg" color={colors.muted} /> : <Text style={[ds.bigVal, { color: colors.accent }]}>{dna.browShape}</Text>}
        <Text style={[ds.bodyTxt, { color: colors.muted }]}>
          {isLocked
            ? 'Brow adjustments create the single biggest visible shift in your face. Unlock your blueprint.'
            : `${dna.browShape} shape — small changes here, massive visible shift.`}
        </Text>
      </Animated.View>
    </View>
  );
}

// ── Slide: Lashes ─────────────────────────────────────────────────────────────

function SlideLashes({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  const sc = useSharedValue(0.5);
  const rot = useSharedValue(20);
  useEffect(() => {
    sc.value = withDelay(120, withSpring(1, { damping: 8, stiffness: 82 }));
    rot.value = withDelay(120, withSpring(0, { damping: 8, stiffness: 82 }));
  }, []);
  const glyphSty = useAnimatedStyle(() => ({
    transform: [{ scale: sc.value }, { rotate: `${rot.value}deg` }],
  }));

  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <Animated.View entering={FadeInUp.delay(80).duration(400)} style={ds.bodyWrap}>
        <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>LASH PROFILE</Text>
        <Animated.Text style={[ds.lashGlyph, { color: `${colors.text}99` }, glyphSty]}>✦</Animated.Text>
        <Text style={[ds.title, { color: colors.text }]}>Your Lashes</Text>
        {isLocked ? <LockedValue size="lg" color={colors.muted} /> : <Text style={[ds.bigVal, { color: colors.accent }]}>{dna.lashProfile}</Text>}
        <Text style={[ds.bodyTxt, { color: colors.muted }]}>
          {isLocked
            ? 'The right mascara technique transforms your natural profile into your signature feature. Unlock to find yours.'
            : `${dna.lashProfile} — the formula and technique that matches your profile exactly.`}
        </Text>
      </Animated.View>
    </View>
  );
}

// ── Slide: Energy ─────────────────────────────────────────────────────────────

const POS_MAP: Record<string, number> = { Sharp: 0.1, Balanced: 0.5, Soft: 0.9 };

function SlideEnergy({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  const pos = isLocked ? 0.5 : (POS_MAP[dna.energy] ?? 0.5);
  const dotX = useSharedValue((0.5 - pos) * TRACK_W);
  useEffect(() => {
    dotX.value = withDelay(300, withSpring(0, { damping: 12, stiffness: 80 }));
  }, []);
  const dotSty = useAnimatedStyle(() => ({ transform: [{ translateX: dotX.value }] }));

  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <Animated.View entering={FadeInUp.delay(80).duration(400)} style={ds.bodyWrap}>
        <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>ENERGY TYPE</Text>
        <Text style={[ds.title, { color: colors.text }]}>Your Energy</Text>
        <View style={ds.spectrumWrap}>
          <Text style={[ds.spectrumEndLabel, { color: colors.muted }]}>Sharp</Text>
          <View style={[ds.spectrumTrack, { backgroundColor: `${colors.text}22` }]}>
            <LinearGradient
              colors={[`${colors.text}15`, `${colors.text}55`, `${colors.text}15`]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Animated.View style={[ds.spectrumDot, { left: `${pos * 100}%` as `${number}%`, backgroundColor: colors.text, shadowColor: colors.text, borderColor: colors.gradientBot }, dotSty]} />
          </View>
          <Text style={[ds.spectrumEndLabel, { color: colors.muted }]}>Soft</Text>
        </View>
        {isLocked ? <LockedValue size="lg" color={colors.muted} /> : <Text style={[ds.bigVal, { color: colors.accent }]}>{dna.energy}</Text>}
        <Text style={[ds.bodyTxt, { color: colors.muted }]}>
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

// ── Slide: Archetype ──────────────────────────────────────────────────────────

function SlideArchetype({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  const nameSc = useSharedValue(0.3);
  const glowAl = useSharedValue(0);
  const glowSc = useSharedValue(0.7);
  const [showConfetti, setShowConfetti] = useState(false);
  useEffect(() => {
    nameSc.value = withDelay(100, withSpring(1, { damping: 5, stiffness: 75 }, (finished) => {
      if (finished) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
        runOnJS(setShowConfetti)(true);
      }
    }));
    glowAl.value = withDelay(350, withRepeat(
      withSequence(withTiming(0.22, { duration: 1000 }), withTiming(0.07, { duration: 1000 })),
      -1, true,
    ));
    glowSc.value = withDelay(350, withRepeat(
      withSequence(withTiming(1.08, { duration: 1400 }), withTiming(0.92, { duration: 1400 })),
      -1, true,
    ));
  }, []);
  const nameSty = useAnimatedStyle(() => ({ transform: [{ scale: nameSc.value }] }));
  const glowSty = useAnimatedStyle(() => ({ opacity: glowAl.value, transform: [{ scale: glowSc.value }] }));

  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <Animated.View style={[ds.archetypeGlow, { backgroundColor: colors.accent, shadowColor: colors.accent }, glowSty]} />
      {showConfetti && <ConfettiBurst />}
      <Animated.View entering={FadeInUp.delay(80).duration(400)} style={ds.bodyWrap}>
        <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>BEAUTY ARCHETYPE</Text>
        <Text style={[ds.youAre, { color: colors.muted }]}>You are</Text>
        <Animated.View style={[ds.archetypeNameWrap, nameSty]}>
          <Text style={[ds.archetypeHero, { color: colors.accent }]}>{dna.archetype}</Text>
          {isLocked && (
            <BlurView intensity={30} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 12 }]} />
          )}
        </Animated.View>
        <Text style={[ds.bodyTxt, { color: colors.muted }]}>
          {isLocked
            ? 'Your archetype ties face shape, season, and energy into one identity. It changes how you shop, apply, and express. Unlock yours.'
            : ARCHETYPE_DESCRIPTIONS[dna.archetype]}
        </Text>
      </Animated.View>
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
  const sc = useSharedValue(0.55);
  useEffect(() => { sc.value = withSpring(1, { damping: 10, stiffness: 88 }); }, []);
  const swSty = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  const lipHex = dna.lipProfile ? (LIP_COLORS[dna.lipProfile] ?? '#E8A885') : '#E8A885';

  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <Animated.View entering={FadeInUp.delay(80).duration(400)} style={ds.bodyWrap}>
        <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>LIP TONE</Text>
        <Animated.View style={[ds.lipSwatch, { backgroundColor: lipHex, shadowColor: lipHex }, swSty]}>
          {isLocked && <BlurView intensity={28} tint="light" style={[StyleSheet.absoluteFillObject, { borderRadius: 70 }]} />}
        </Animated.View>
        <Text style={[ds.title, { color: colors.text }]}>Your Lip Tone</Text>
        {isLocked ? <LockedValue size="lg" color={colors.muted} /> : <Text style={[ds.bigVal, { color: colors.accent }]}>{dna.lipProfile || '—'}</Text>}
        <Text style={[ds.bodyTxt, { color: colors.muted }]}>
          {isLocked
            ? 'The lip shade that makes your face glow and completes your archetype. Unlock to discover yours.'
            : `${dna.lipProfile} — the exact formula that harmonizes with your season and energy.`}
        </Text>
      </Animated.View>
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
  const sc = useSharedValue(0.55);
  useEffect(() => { sc.value = withSpring(1, { damping: 10, stiffness: 88 }); }, []);
  const swSty = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  const blushHex = dna.blushProfile ? (BLUSH_COLORS[dna.blushProfile] ?? '#F0A882') : '#F0A882';

  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <Animated.View entering={FadeInUp.delay(80).duration(400)} style={ds.bodyWrap}>
        <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>BLUSH</Text>
        <Animated.View style={[ds.blushSwatch, { backgroundColor: blushHex, shadowColor: blushHex }, swSty]}>
          {isLocked && <BlurView intensity={28} tint="light" style={[StyleSheet.absoluteFillObject, { borderRadius: 70 }]} />}
        </Animated.View>
        <Text style={[ds.title, { color: colors.text }]}>Your Blush</Text>
        {isLocked ? <LockedValue size="lg" color={colors.muted} /> : <Text style={[ds.bigVal, { color: colors.accent }]}>{dna.blushProfile || '—'}</Text>}
        <Text style={[ds.bodyTxt, { color: colors.muted }]}>
          {isLocked
            ? 'The blush that brings dimension and life to your face. Unlock your perfect flush.'
            : `${dna.blushProfile} — placement and intensity tuned to your face shape and energy.`}
        </Text>
      </Animated.View>
    </View>
  );
}

// ── Slide: Kit ────────────────────────────────────────────────────────────────

function KitCard({ rec, index, colors }: { rec: ProductRec; index: number; colors: SlideColors }) {
  const priceDots = rec.price === '$' ? '●' : rec.price === '$$' ? '●●' : '●●●';
  return (
    <Animated.View entering={FadeInUp.delay(200 + index * 100).duration(350)} style={[ds.kitCard, { borderColor: `${colors.text}18`, backgroundColor: 'rgba(0,0,0,0.15)' }]}>
      <View style={ds.kitCardTop}>
        <View style={[ds.kitCatBadge, { backgroundColor: `${colors.text}20` }]}><Text style={[ds.kitCatText, { color: colors.eyebrow }]}>{rec.category.toUpperCase()}</Text></View>
        <Text style={[ds.kitPrice, { color: colors.muted }]}>{priceDots}</Text>
      </View>
      <Text style={[ds.kitProduct, { color: colors.text }]}><Text style={[ds.kitBrand, { color: colors.accent }]}>{rec.brand} </Text>{rec.product}</Text>
      <Text style={[ds.kitWhy, { color: colors.muted }]} numberOfLines={2}>{rec.why}</Text>
    </Animated.View>
  );
}

function SlideKit({ dna, isLocked, colors }: { dna: DnaResult; isLocked?: boolean; colors: SlideColors }) {
  const recs = getRecsForDna(dna.archetype);
  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <Animated.View entering={FadeInUp.delay(80).duration(400)} style={[ds.bodyWrap, ds.kitBodyWrap]}>
        <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>YOUR KIT</Text>
        <Text style={[ds.title, { color: colors.text }]}>What to Reach For</Text>
        {isLocked ? (
          <>
            {['BASE', 'BLUSH', 'LIP', 'MASCARA'].map((cat, i) => (
              <View key={cat} style={[ds.kitCard, { borderColor: `${colors.text}18`, backgroundColor: 'rgba(0,0,0,0.15)' }]}>
                <View style={ds.kitCardTop}>
                  <View style={[ds.kitCatBadge, { backgroundColor: `${colors.text}20` }]}><Text style={[ds.kitCatText, { color: colors.eyebrow }]}>{cat}</Text></View>
                  <Text style={[ds.kitPrice, { color: colors.muted }]}>{'●'.repeat(3 - (i % 2))}</Text>
                </View>
                <LockedValue size="md" color={colors.muted} />
                <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 14 }]} />
              </View>
            ))}
            <Text style={[ds.bodyTxt, { color: colors.muted }]}>Your archetype-matched kit is waiting. Unlock to see the exact products curated for your DNA.</Text>
          </>
        ) : recs.map((rec, i) => <KitCard key={rec.product} rec={rec} index={i} colors={colors} />)}
      </Animated.View>
    </View>
  );
}

// ── Slide: Summary ────────────────────────────────────────────────────────────

function SlideSummary({ dna, isLocked, onShare, colors }: { dna: DnaResult; isLocked?: boolean; onShare: () => void; colors: SlideColors }) {
  const rows = [
    { label: 'Foundation Tone', value: dna.skinToneHex.toUpperCase() },
    { label: 'Colour Season', value: dna.colorSeason },
    { label: 'Face Shape', value: dna.faceShape },
    { label: 'Brow Shape', value: dna.browShape },
    { label: 'Lash Profile', value: dna.lashProfile },
    { label: 'Lip Tone', value: dna.lipProfile || '—' },
    { label: 'Blush', value: dna.blushProfile || '—' },
    { label: 'Archetype', value: dna.archetype },
  ];
  return (
    <View style={[ds.page, { backgroundColor: 'transparent' }]}>
      <Animated.View entering={FadeInUp.delay(80).duration(400)} style={[ds.bodyWrap, ds.summaryBodyWrap]}>
        <Text style={[ds.eyebrow, { color: colors.eyebrow }]}>ALL RESULTS</Text>
        <Text style={[ds.title, { color: colors.text }]}>Beauty Wrapped</Text>
        <Animated.View entering={FadeInUp.delay(250).duration(350)} style={[ds.summaryCard, { borderColor: `${colors.text}15`, backgroundColor: 'rgba(0,0,0,0.18)' }]}>
          {rows.map((row, i) => (
            <View key={row.label} style={[ds.summaryRow, { borderBottomColor: `${colors.text}12` }, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={[ds.summaryLabel, { color: colors.muted }]}>{row.label}</Text>
              {isLocked
                ? <View style={ds.summaryLockedRow}>
                    <MaterialIcons name="lock" size={9} color={colors.muted} />
                    <Text style={[ds.summaryLockedDots, { color: colors.muted }]}>●●●●</Text>
                  </View>
                : <Text style={[ds.summaryValue, { color: colors.text }]}>{row.value}</Text>}
            </View>
          ))}
        </Animated.View>
        {!isLocked && (
          <Animated.View entering={FadeInUp.delay(650).duration(300)} style={{ width: '100%' }}>
            <Pressable style={[ds.shareBtn, { backgroundColor: colors.text }]} onPress={onShare}>
              <Text style={[ds.shareBtnText, { color: colors.gradientBot }]}>Share your Beauty Card ↗</Text>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

function renderSlide(idx: number, dna: DnaResult, locked: boolean, onShare: () => void) {
  const colors = SLIDE_COLORS[idx] ?? SLIDE_COLORS[0];
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
    case 9: return <SlideKit dna={dna} isLocked={locked} colors={colors} />;
    case 10: return <SlideSummary dna={dna} isLocked={locked} onShare={onShare} colors={colors} />;
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

  const navigateTo = useCallback((to: number, from: number) => {
    setBgFrom(from);
    setBgTo(to);
    morphProgress.value = withTiming(1, { duration: 500 }, (finished) => {
      if (finished) {
        runOnJS(setBgFrom)(to);
        morphProgress.value = 0;
      }
    });
    slideDispatch({ type: 'go', to });
    if (clearOutRef.current) clearTimeout(clearOutRef.current);
    clearOutRef.current = setTimeout(() => slideDispatch({ type: 'done' }), 320);
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
        <IncomingContent key={`in-${slideState.uid}`}>
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
  kitBodyWrap: { gap: 12, paddingBottom: 180 },
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

  // Kit
  kitCard: {
    width: '100%', borderRadius: 14, borderWidth: 1,
    paddingVertical: 12, paddingHorizontal: 16, gap: 5,
  },
  kitCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kitCatBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  kitCatText: { fontFamily: 'Inter', fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  kitPrice: { fontFamily: 'Inter', fontSize: 10, letterSpacing: 1 },
  kitProduct: { fontFamily: 'Inter', fontSize: 13, fontWeight: '500' },
  kitBrand: { fontWeight: '700' },
  kitWhy: { fontFamily: 'Inter', fontSize: 11, lineHeight: 16 },

  // Summary
  summaryCard: { width: '100%', borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  summaryLabel: { fontFamily: 'Inter', fontSize: 12, letterSpacing: 0.3 },
  summaryValue: { fontFamily: 'Inter', fontSize: 14, fontWeight: '600' },
  summaryLockedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryLockedDots: { fontFamily: 'Inter', fontSize: 10, letterSpacing: 2 },
  shareBtn: { width: '100%', paddingVertical: 15, alignItems: 'center', borderRadius: 50 },
  shareBtnText: { fontFamily: 'Inter', fontSize: 14, fontWeight: '700' },
});
