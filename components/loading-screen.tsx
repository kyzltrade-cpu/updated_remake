import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withRepeat, withSequence, withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: W, height: H } = Dimensions.get('window');

const PHASES = [
  'Reading colour season…',
  'Mapping face geometry…',
  'Calibrating brow blueprint…',
  'Analysing lip profile…',
  'Identifying energy type…',
  'Revealing your archetype…',
];

const SPARK_CHARS = ['✦', '✧', '◉', '✿', '★', '♡'];
const SPARK_COLORS = [
  'rgba(200,144,130,0.5)', 'rgba(255,232,255,0.25)',
  'rgba(180,120,200,0.4)', 'rgba(255,180,120,0.35)',
];

function FloatSpark({ x, y, delay, color, char, size }: {
  x: number; y: number; delay: number; color: string; char: string; size: number;
}) {
  const ty = useSharedValue(0);
  const op = useSharedValue(0);
  useEffect(() => {
    ty.value = withDelay(delay, withRepeat(withTiming(-120, { duration: 2600, easing: Easing.out(Easing.quad) }), -1, false));
    op.value = withDelay(delay, withRepeat(
      withSequence(withTiming(0.85, { duration: 320 }), withTiming(0, { duration: 2280 })),
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

function LoadingSparks() {
  const [sparks] = useState(() =>
    Array.from({ length: 10 }, (_, i) => ({
      x: 24 + Math.random() * (W - 48),
      y: H * 0.12 + Math.random() * H * 0.6,
      delay: Math.floor(Math.random() * 1400),
      color: SPARK_COLORS[i % SPARK_COLORS.length],
      char: SPARK_CHARS[i % SPARK_CHARS.length],
      size: 10 + Math.floor(Math.random() * 12),
    }))
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {sparks.map((s, i) => <FloatSpark key={i} {...s} />)}
    </View>
  );
}

function PulseOrb() {
  const sc = useSharedValue(1);
  const al = useSharedValue(0.14);
  useEffect(() => {
    sc.value = withRepeat(withSequence(withTiming(1.12, { duration: 1600 }), withTiming(0.9, { duration: 1400 })), -1, true);
    al.value = withRepeat(withSequence(withTiming(0.28, { duration: 1200 }), withTiming(0.08, { duration: 1600 })), -1, true);
  }, []);
  const sty = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }], opacity: al.value }));
  return <Animated.View style={[ls.orb, sty]} />;
}

function PhaseText({ text }: { text: string }) {
  const op = useSharedValue(0);
  const ty = useSharedValue(8);
  useEffect(() => {
    op.value = withTiming(1, { duration: 300 });
    ty.value = withSpring(0, { damping: 14, stiffness: 120 });
    return () => { op.value = withTiming(0, { duration: 200 }); };
  }, []);
  const sty = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: ty.value }] }));
  return <Animated.Text style={[ls.phase, sty]}>{text}</Animated.Text>;
}

function ProgressBar({ duration = 10000 }: { duration?: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(W - 56, { duration, easing: Easing.out(Easing.cubic) });
  }, []);
  const sty = useAnimatedStyle(() => ({ width: w.value }));
  return (
    <View style={ls.progressTrack}>
      <Animated.View style={[ls.progressFill, sty]} />
    </View>
  );
}

function Dot({ index }: { index: number }) {
  const sc = useSharedValue(0.5);
  useEffect(() => {
    sc.value = withDelay(index * 220, withRepeat(
      withSequence(withTiming(1, { duration: 380 }), withTiming(0.5, { duration: 380 })),
      -1, false,
    ));
  }, []);
  const sty = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  return <Animated.View style={[ls.dot, sty]} />;
}

export function LoadingScreen() {
  const insets = useSafeAreaInsets();
  const [phaseIdx, setPhaseIdx] = useState(0);
  const titleOp = useSharedValue(0);
  const titleSc = useSharedValue(0.82);

  useEffect(() => {
    titleOp.value = withTiming(1, { duration: 500 });
    titleSc.value = withSpring(1, { damping: 14, stiffness: 100 });
    const id = setInterval(() => {
      setPhaseIdx(i => (i + 1) % PHASES.length);
    }, 1700);
    return () => clearInterval(id);
  }, []);

  const titleSty = useAnimatedStyle(() => ({
    opacity: titleOp.value, transform: [{ scale: titleSc.value }],
  }));

  return (
    <View style={ls.root}>
      <LinearGradient
        colors={['#1A0530', '#340824', '#06010E']}
        locations={[0, 0.4, 1]}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <PulseOrb />
      <LoadingSparks />

      <View style={[ls.body, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
        <View style={ls.top}>
          <Text style={ls.eyebrow}>BEAUTY DNA</Text>
          <Animated.Text style={[ls.headline, titleSty]}>
            {'Analysing\nyour face.'}
          </Animated.Text>
        </View>

        <View style={ls.middle}>
          <PhaseText key={phaseIdx} text={PHASES[phaseIdx]} />
          <View style={ls.dotRow}>
            {[0, 1, 2].map(i => <Dot key={i} index={i} />)}
          </View>
        </View>

        <View style={ls.bottom}>
          <ProgressBar duration={10000} />
          <Text style={ls.hint}>This takes a few seconds</Text>
        </View>
      </View>
    </View>
  );
}

const ls = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 28 },
  orb: {
    position: 'absolute',
    width: W * 0.85, height: W * 0.85, borderRadius: W * 0.425,
    top: H * 0.1, left: W * 0.075,
    backgroundColor: '#8820C8',
    shadowColor: '#C040FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 80,
  },
  top: { gap: 18 },
  eyebrow: {
    fontFamily: 'Inter', fontSize: 10, fontWeight: '700',
    letterSpacing: 3.5, textTransform: 'uppercase',
    color: 'rgba(255,232,255,0.4)',
  },
  headline: {
    fontFamily: 'Playfair Display', fontSize: 56, fontStyle: 'italic',
    color: '#FFE8FF', lineHeight: 64,
  },
  middle: { alignItems: 'center', gap: 24 },
  phase: {
    fontFamily: 'Inter', fontSize: 14, fontWeight: '400',
    color: 'rgba(255,232,255,0.5)', letterSpacing: 0.3, textAlign: 'center',
  },
  dotRow: { flexDirection: 'row', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(200,140,220,0.6)' },
  bottom: { gap: 12 },
  progressTrack: {
    height: 1.5, width: W - 56, borderRadius: 1,
    backgroundColor: 'rgba(255,232,255,0.1)', overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 1, backgroundColor: 'rgba(220,160,255,0.7)' },
  hint: {
    fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,232,255,0.28)',
    textAlign: 'center', letterSpacing: 0.2,
  },
});
