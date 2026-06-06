import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withTiming, withDelay, withRepeat, withSequence, withSpring,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_KEY } from '../_layout';
import { analyzeDna } from '@/lib/api/dna';
import { getOnboardingData } from '@/lib/onboarding-store';
import type { PriorityCategory } from '@/lib/onboarding-store';
import { saveDnaResult } from '@/lib/api/scan-storage';
import { useAuth } from '@/contexts/AuthContext';
import { tokens } from '@/components/theme';

const { width: W, height: H } = Dimensions.get('window');

const PHASES = [
  'Reading your face shape…',
  'Mapping your skin undertones…',
  'Finding your colour season…',
  'Calibrating your brow blueprint…',
  'Building your archetype…',
  'Revealing your Beauty DNA…',
];

// ─── Floating sparks ─────────────────────────────────────────────────────────

const SPARK_CHARS  = ['✦', '✧', '◉', '♡', '★', '✿'];
const SPARK_COLORS = [
  'rgba(232,57,154,0.35)', 'rgba(255,200,230,0.20)',
  'rgba(212,175,55,0.30)',  'rgba(255,170,217,0.25)',
];

function FloatSpark({ x, y, delay, color, char, size }: {
  x: number; y: number; delay: number; color: string; char: string; size: number;
}) {
  const ty = useSharedValue(0);
  const op = useSharedValue(0);
  useEffect(() => {
    ty.value = withDelay(delay, withRepeat(
      withTiming(-H * 0.55, { duration: 3200, easing: Easing.out(Easing.quad) }),
      -1, false,
    ));
    op.value = withDelay(delay, withRepeat(
      withSequence(withTiming(0.9, { duration: 400 }), withTiming(0, { duration: 2800 })),
      -1, false,
    ));
  }, []);
  const sty = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }], opacity: op.value,
  }));
  return (
    <Animated.Text style={[{ position: 'absolute', left: x, top: y, fontSize: size, color }, sty]}>
      {char}
    </Animated.Text>
  );
}

function FloatingSparks() {
  const [sparks] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      x: 20 + (W - 40) * (i / 11),
      y: H * 0.15 + (H * 0.55) * ((i * 137) % 100) / 100,
      delay: i * 180,
      color: SPARK_COLORS[i % SPARK_COLORS.length],
      char: SPARK_CHARS[i % SPARK_CHARS.length],
      size: 10 + (i % 3) * 4,
    }))
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {sparks.map((s, i) => <FloatSpark key={i} {...s} />)}
    </View>
  );
}

// ─── Animated scan ring ───────────────────────────────────────────────────────

const RING_SIZE = W * 0.56;
const RING_R    = (RING_SIZE - 8) / 2;
const RING_CIRC = 2 * Math.PI * RING_R;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ScanRing() {
  const rotation  = useSharedValue(0);
  const progress  = useSharedValue(0);
  const innerPulse = useSharedValue(0.6);

  useEffect(() => {
    // Continuous rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: 3200, easing: Easing.linear }),
      -1, false,
    );
    // Fill from 0 to ~85% over the loading duration
    progress.value = withTiming(0.85, { duration: 5200, easing: Easing.out(Easing.quad) });
    // Inner orb pulse
    innerPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.out(Easing.sin) }),
        withTiming(0.6, { duration: 1100, easing: Easing.in(Easing.sin) }),
      ),
      -1, false,
    );
  }, []);

  const rotStyle    = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  const innerStyle  = useAnimatedStyle(() => ({ opacity: innerPulse.value }));
  const arcProps    = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRC * (1 - progress.value),
  }));

  const cx = RING_SIZE / 2;

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow behind ring */}
      <Animated.View style={[ls.ringGlow, innerStyle]} />

      {/* Static track */}
      <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
        <Circle
          cx={cx} cy={cx} r={RING_R}
          stroke="rgba(232,57,154,0.10)"
          strokeWidth={2}
          fill="none"
        />
      </Svg>

      {/* Animated arc — rotates */}
      <Animated.View style={[StyleSheet.absoluteFill, rotStyle]}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Defs />
          <AnimatedCircle
            cx={cx} cy={cx} r={RING_R}
            stroke={tokens.colors.pinkDeep}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={RING_CIRC}
            animatedProps={arcProps}
            rotation={-90}
            originX={cx}
            originY={cx}
          />
        </Svg>
      </Animated.View>

      {/* Centre icon */}
      <Animated.View style={[ls.ringCenter, innerStyle]}>
        <Text style={ls.ringIcon}>✦</Text>
      </Animated.View>
    </View>
  );
}

// ─── Phase text ───────────────────────────────────────────────────────────────

function PhaseText({ text }: { text: string }) {
  const op = useSharedValue(0);
  const ty = useSharedValue(6);
  useEffect(() => {
    op.value = withTiming(1, { duration: 280 });
    ty.value = withSpring(0, { damping: 16, stiffness: 140 });
    return () => { op.value = withTiming(0, { duration: 180 }); };
  }, []);
  const sty = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: ty.value }] }));
  return <Animated.Text style={[ls.phase, sty]}>{text}</Animated.Text>;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ duration = 5000 }: { duration?: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(W - 80, { duration, easing: Easing.out(Easing.cubic) });
  }, []);
  const sty = useAnimatedStyle(() => ({ width: w.value }));
  return (
    <View style={ls.progressTrack}>
      <Animated.View style={[ls.progressFill, sty]} />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DnaLoadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [phaseIdx, setPhaseIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPhaseIdx(i => (i + 1) % PHASES.length);
    }, 1100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const run = async () => {
      if (params.uri) {
        await AsyncStorage.setItem('pending_dna_uri', params.uri);
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        await new Promise<void>(resolve => setTimeout(resolve, 3400));
        router.replace('/(main)/home');
        return;
      }
      try {
        const pendingUri = await AsyncStorage.getItem('pending_dna_uri');
        if (!pendingUri) {
          await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
          router.replace('/(main)/home');
          return;
        }
        const { priorityCategory } = await getOnboardingData();
        const dna = await analyzeDna({
          imageUri: pendingUri,
          priorityCategory: (priorityCategory ?? 'Blending') as PriorityCategory,
        });
        await AsyncStorage.setItem('dna_result', JSON.stringify(dna));
        if (user?.id) saveDnaResult(user.id, dna).catch(() => null);
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        router.replace('/(main)/home');
      } catch {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        router.replace('/(main)/home');
      }
    };
    run();
  }, []);

  return (
    <View style={ls.root}>
      <LinearGradient
        colors={['#1A0D14', '#2D0A1E', '#08010C']}
        locations={[0, 0.5, 1]}
        start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <FloatingSparks />

      <View style={[ls.body, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 44 }]}>

        {/* Top: eyebrow + headline */}
        <View style={ls.top}>
          <Text style={ls.eyebrow}>BEAUTY DNA</Text>
          <Text style={ls.headline}>{'Building\nyour profile.'}</Text>
        </View>

        {/* Centre: scan ring */}
        <View style={ls.ringWrap}>
          <ScanRing />
        </View>

        {/* Bottom: phase + progress */}
        <View style={ls.bottom}>
          <PhaseText key={phaseIdx} text={PHASES[phaseIdx]} />
          <ProgressBar duration={5200} />
        </View>

      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ls = StyleSheet.create({
  root: { flex: 1 },
  body: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
  },

  top: { alignItems: 'center', gap: 10 },
  eyebrow: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '700',
    letterSpacing: 3.5, textTransform: 'uppercase',
    color: 'rgba(232,57,154,0.55)',
  },
  headline: {
    fontFamily: tokens.fonts.serif, fontSize: 42, fontStyle: 'italic',
    color: '#FFF5F9', lineHeight: 50, textAlign: 'center', letterSpacing: 0.2,
  },

  // Ring
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ringGlow: {
    position: 'absolute',
    width: RING_SIZE * 0.65,
    height: RING_SIZE * 0.65,
    borderRadius: RING_SIZE * 0.325,
    backgroundColor: tokens.colors.pinkDeep,
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: RING_SIZE * 0.18,
    elevation: 0,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringIcon: {
    fontSize: 28,
    color: 'rgba(255,200,230,0.65)',
  },

  // Phase + progress
  bottom: { alignItems: 'center', gap: 20, width: '100%' },
  phase: {
    fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '300',
    color: 'rgba(255,232,255,0.5)', letterSpacing: 0.3, textAlign: 'center',
    lineHeight: 20,
  },
  progressTrack: {
    height: 1.5, width: W - 80, borderRadius: 1,
    backgroundColor: 'rgba(232,57,154,0.12)', overflow: 'hidden',
    alignSelf: 'center',
  },
  progressFill: {
    height: '100%', borderRadius: 1,
    backgroundColor: tokens.colors.pinkDeep,
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
