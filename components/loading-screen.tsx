import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withTiming, withRepeat, withSequence, withDelay, withSpring,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { tokens } from './theme';

const { width: W, height: H } = Dimensions.get('window');

const PHASES = [
  'Mapping your skin tone…',
  'Reading your face shape…',
  'Analysing colour harmony…',
  'Calibrating your archetype…',
  'Building your Beauty DNA…',
  'Almost ready…',
];

// ─── Scan ring ────────────────────────────────────────────────────────────────

const RING_SIZE = W * 0.52;
const RING_R    = (RING_SIZE - 10) / 2;
const RING_CIRC = 2 * Math.PI * RING_R;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ScanRing() {
  const rot  = useSharedValue(0);
  const fill = useSharedValue(0);
  const pulse = useSharedValue(0.7);

  useEffect(() => {
    rot.value   = withRepeat(withTiming(360, { duration: 2800, easing: Easing.linear }), -1, false);
    fill.value  = withTiming(0.8, { duration: 5500, easing: Easing.out(Easing.quad) });
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 1100 }), withTiming(0.7, { duration: 1100 })),
      -1, false,
    );
  }, []);

  const rotStyle   = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  const glowStyle  = useAnimatedStyle(() => ({ opacity: pulse.value }));
  const arcProps   = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRC * (1 - fill.value),
  }));

  const cx = RING_SIZE / 2;

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Soft centre glow */}
      <Animated.View style={[ls.ringGlow, glowStyle]} />

      {/* Track */}
      <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
        <Circle cx={cx} cy={cx} r={RING_R} stroke={tokens.colors.border} strokeWidth={3} fill="none" />
      </Svg>

      {/* Animated arc */}
      <Animated.View style={[StyleSheet.absoluteFill, rotStyle]}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <AnimatedCircle
            cx={cx} cy={cx} r={RING_R}
            stroke={tokens.colors.pinkDeep}
            strokeWidth={3}
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

      {/* Centre */}
      <Animated.View style={[ls.ringCenter, glowStyle]}>
        <Text style={ls.ringIcon}>✦</Text>
      </Animated.View>
    </View>
  );
}

// ─── Phase text ───────────────────────────────────────────────────────────────

function PhaseText({ text }: { text: string }) {
  const op = useSharedValue(0);
  const ty = useSharedValue(5);
  useEffect(() => {
    op.value = withTiming(1, { duration: 280 });
    ty.value = withSpring(0, { damping: 18, stiffness: 150 });
    return () => { op.value = withTiming(0, { duration: 180 }); };
  }, []);
  const sty = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: ty.value }] }));
  return <Animated.Text style={[ls.phase, sty]}>{text}</Animated.Text>;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar() {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(W - 80, { duration: 5500, easing: Easing.out(Easing.cubic) });
  }, []);
  const sty = useAnimatedStyle(() => ({ width: w.value }));
  return (
    <View style={ls.progressTrack}>
      <Animated.View style={[ls.progressFill, sty]} />
    </View>
  );
}

// ─── Pulsing dots ─────────────────────────────────────────────────────────────

function Dot({ index }: { index: number }) {
  const sc = useSharedValue(0.5);
  useEffect(() => {
    sc.value = withDelay(index * 200, withRepeat(
      withSequence(withTiming(1, { duration: 380 }), withTiming(0.5, { duration: 380 })),
      -1, false,
    ));
  }, []);
  const sty = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  return <Animated.View style={[ls.dot, sty]} />;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LoadingScreen() {
  const [phaseIdx, setPhaseIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPhaseIdx(i => (i + 1) % PHASES.length), 1100);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={ls.root}>
      {/* Top */}
      <View style={ls.top}>
        <Text style={ls.eyebrow}>BEAUTY DNA</Text>
        <Text style={ls.headline}>{'Building\nyour profile.'}</Text>
      </View>

      {/* Ring */}
      <View style={ls.ringWrap}>
        <ScanRing />
      </View>

      {/* Bottom */}
      <View style={ls.bottom}>
        <PhaseText key={phaseIdx} text={PHASES[phaseIdx]} />
        <View style={ls.dotRow}>
          {[0, 1, 2].map(i => <Dot key={i} index={i} />)}
        </View>
        <ProgressBar />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ls = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.cream,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 60,
  },

  top: { alignItems: 'center', gap: 10 },
  eyebrow: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '700',
    letterSpacing: 3.5, textTransform: 'uppercase',
    color: tokens.colors.pinkDeep,
  },
  headline: {
    fontFamily: tokens.fonts.serif, fontSize: 42, fontStyle: 'italic',
    color: tokens.colors.text, lineHeight: 50,
    textAlign: 'center', letterSpacing: 0.2,
  },

  // Ring
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ringGlow: {
    position: 'absolute',
    width: RING_SIZE * 0.55, height: RING_SIZE * 0.55,
    borderRadius: RING_SIZE * 0.275,
    backgroundColor: tokens.colors.blush,
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.20,
    shadowRadius: RING_SIZE * 0.15,
  },
  ringCenter: { position: 'absolute' },
  ringIcon: { fontSize: 24, color: tokens.colors.pinkDeep },

  // Bottom
  bottom: { alignItems: 'center', gap: 14, width: '100%' },
  phase: {
    fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '300',
    color: tokens.colors.gray, letterSpacing: 0.3,
    textAlign: 'center', lineHeight: 20,
  },
  dotRow: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: tokens.colors.pinkDeep,
    opacity: 0.5,
  },
  progressTrack: {
    height: 2, width: W - 80, borderRadius: 1,
    backgroundColor: tokens.colors.border, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 1,
    backgroundColor: tokens.colors.pinkDeep,
  },
});
