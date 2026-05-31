import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { tokens } from '@/components/theme';

const SIZE = 148;
const STROKE = 2;
const RADIUS = (SIZE - STROKE * 2) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const TIERS = {
  flawless: { word: 'Flawless', pct: 0.95 },
  strong: { word: 'Strong', pct: 0.80 },
  refine: { word: 'Refine', pct: 0.65 },
};

interface ScoreRingProps {
  tier?: 'flawless' | 'strong' | 'refine';
  score?: number; // 0–100, overrides tier pct
  visible?: boolean;
}

export function ScoreRing({ tier = 'strong', score, visible = true }: ScoreRingProps) {
  const { word, pct } = TIERS[tier] || TIERS.strong;
  // Use explicit score if provided, otherwise fall back to tier pct
  const targetPct = score !== undefined ? score / 100 : pct;
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
      scale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
      progress.value = withDelay(100, withTiming(targetPct, { duration: 1400, easing: Easing.out(Easing.cubic) }));
    } else {
      opacity.value = 0;
      scale.value = 0.92;
      progress.value = 0;
    }
  }, [visible, targetPct]);

  const containerStyle = useAnimatedProps(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const strokeDashoffset = CIRCUMFERENCE * (1 - progress.value);

  const filledCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: visible ? CIRCUMFERENCE * (1 - progress.value) : CIRCUMFERENCE,
  }));

  return (
    <Animated.View style={[styles.container, { opacity: visible ? 1 : 0 }]}>
      <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={tokens.colors.cream}
          strokeWidth={STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={tokens.colors.pinkDeep}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={filledCircleProps}
        />
      </Svg>
      <View style={styles.wordContainer}>
        <Text style={styles.word}>{word}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    position: 'relative',
  },
  wordContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  word: {
    fontFamily: tokens.fonts.serif,
    fontSize: 22,
    fontWeight: '400',
    fontStyle: 'italic',
    color: tokens.colors.text,
    letterSpacing: 0.02,
  },
});