import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withTiming, withRepeat, withSequence, withDelay, withSpring,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { tokens } from './theme';

const { width: W } = Dimensions.get('window');

const SCAN_PHASES = [
  'analysing skin barrier health... 🌸',
  'detecting pore-cloggers... 💅',
  'evaluating complexion symmetry... ✨',
  'grading makeup colour harmony... 🎀',
  'generating custom coachings... 💫',
  'cooking your beauty DNA... 💕',
];

const RING_SIZE = 220;
const IMAGE_SIZE = 176;
const RING_R = (RING_SIZE - 12) / 2;
const RING_CIRC = 2 * Math.PI * RING_R;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScanLoadingScreenProps {
  imageUri: string;
}

export function ScanLoadingScreen({ imageUri }: ScanLoadingScreenProps) {
  const [phaseIdx, setPhaseIdx] = useState(0);

  // Ring and glow animations
  const rot = useSharedValue(0);
  const fill = useSharedValue(0);
  const pulse = useSharedValue(0.72);

  // Laser scanner sweep
  const sweepY = useSharedValue(-88);

  // Progress bar width
  const progressW = useSharedValue(0);

  useEffect(() => {
    // Phases cycle
    const phaseInterval = setInterval(() => {
      setPhaseIdx(i => (i + 1) % SCAN_PHASES.length);
    }, 1300);

    // Animations kickoff
    rot.value = withRepeat(
      withTiming(360, { duration: 3200, easing: Easing.linear }),
      -1,
      false
    );
    
    fill.value = withTiming(0.9, { duration: 7500, easing: Easing.out(Easing.quad) });
    
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.7, { duration: 1200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    sweepY.value = withRepeat(
      withSequence(
        withTiming(88, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(-88, { duration: 1600, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );

    progressW.value = withTiming(W - 80, { duration: 7500, easing: Easing.out(Easing.cubic) });

    return () => clearInterval(phaseInterval);
  }, []);

  const rotStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 1 + (pulse.value - 0.7) * 0.2 }],
  }));

  const laserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sweepY.value }],
  }));

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRC * (1 - fill.value),
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: progressW.value,
  }));

  const cx = RING_SIZE / 2;

  return (
    <View style={ls.root}>
      {/* Top Header */}
      <View style={ls.top}>
        <Text style={ls.eyebrow}>Beauty DNA</Text>
        <Text style={ls.headline}>
          {'decoding\nyour look... 💫'}
        </Text>
      </View>

      {/* Holographic Laser Scanning Area */}
      <View style={ls.ringWrap}>
        {/* Soft radial background glow */}
        <Animated.View style={[ls.ringGlow, glowStyle]} />

        {/* Outer static Svg circle track */}
        <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
          <Circle cx={cx} cy={cx} r={RING_R} stroke="rgba(232, 57, 154, 0.15)" strokeWidth={3} fill="none" />
        </Svg>

        {/* Outer animated sweep ring */}
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

        {/* Rounded Scanned Selfie Frame */}
        <View style={ls.imageContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={ls.selfie} />
          ) : (
            <View style={ls.avatarPlaceholder} />
          )}

          {/* Glowing laser line overlay */}
          <Animated.View style={[ls.laserLine, laserStyle]}>
            <View style={ls.laserLineGlow} />
          </Animated.View>
        </View>
      </View>

      {/* Bottom Progress details */}
      <View style={ls.bottom}>
        {/* Animated fade-in phase labels */}
        <Animated.Text entering={FadeIn.duration(250)} key={phaseIdx} style={ls.phase}>
          {SCAN_PHASES[phaseIdx]}
        </Animated.Text>
        
        {/* Dots row */}
        <View style={ls.dotRow}>
          {[0, 1, 2].map(i => (
            <DotPulse key={i} index={i} />
          ))}
        </View>

        {/* Horizontal progress bar */}
        <View style={ls.progressTrack}>
          <Animated.View style={[ls.progressFill, progressStyle]} />
        </View>
      </View>
    </View>
  );
}

// Micro pulsing dot component
function DotPulse({ index }: { index: number }) {
  const sc = useSharedValue(0.5);
  useEffect(() => {
    sc.value = withDelay(
      index * 180,
      withRepeat(
        withSequence(withTiming(1, { duration: 350 }), withTiming(0.5, { duration: 350 })),
        -1,
        false
      )
    );
  }, []);
  const sty = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  return <Animated.View style={[ls.dot, sty]} />;
}

const ls = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.cream,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 84,
    paddingBottom: 64,
  },
  top: {
    alignItems: 'center',
    gap: 8,
  },
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: tokens.colors.pinkDeep,
  },
  headline: {
    fontFamily: tokens.fonts.serif,
    fontSize: 40,
    fontStyle: 'italic',
    color: tokens.colors.text,
    lineHeight: 48,
    textAlign: 'center',
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringGlow: {
    position: 'absolute',
    width: RING_SIZE * 0.72,
    height: RING_SIZE * 0.72,
    borderRadius: (RING_SIZE * 0.72) / 2,
    backgroundColor: tokens.colors.blush,
    opacity: 0.22,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: tokens.colors.white,
    backgroundColor: tokens.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  selfie: {
    width: '100%',
    height: '100%',
    borderRadius: IMAGE_SIZE / 2,
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: tokens.colors.pinkLight,
  },
  laserLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: tokens.colors.pinkDeep,
    zIndex: 5,
  },
  laserLineGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -4,
    height: 11,
    backgroundColor: tokens.colors.pinkDeep,
    opacity: 0.35,
    borderRadius: 6,
  },
  bottom: {
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  phase: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '500',
    color: tokens.colors.gray,
    letterSpacing: 0.2,
    textAlign: 'center',
    lineHeight: 18,
    minHeight: 20,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.pinkDeep,
    opacity: 0.55,
  },
  progressTrack: {
    height: 2,
    width: W - 80,
    borderRadius: 1,
    backgroundColor: tokens.colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
    backgroundColor: tokens.colors.pinkDeep,
  },
});
