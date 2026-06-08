import { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: W } = Dimensions.get('window');
const TRACE_SIZE = W * 0.55;

const AnimatedPath = Animated.createAnimatedComponent(Path);

// SVG path descriptions for each face shape and eye shape
const PATH_DATA: Record<string, string> = {
  // ── Face Shapes ──
  Oval: 'M 50 15 C 25 15, 20 50, 20 65 C 20 80, 35 90, 50 90 C 65 90, 80 80, 80 65 C 80 50, 75 15, 50 15 Z',
  Round: 'M 50 15 C 22 15, 18 38, 18 55 C 18 72, 22 95, 50 95 C 78 95, 82 72, 82 55 C 82 38, 78 15, 50 15 Z',
  Heart: 'M 50 20 C 35 12, 18 20, 18 45 C 18 68, 38 85, 50 92 C 62 85, 82 68, 82 45 C 82 20, 65 12, 50 20 Z',
  Square: 'M 22 18 L 78 18 C 82 18, 82 22, 82 26 L 82 78 C 82 85, 75 92, 50 92 C 25 92, 18 85, 18 78 L 18 26 C 18 22, 18 18, 22 18 Z',
  Oblong: 'M 50 10 C 30 10, 26 30, 26 55 C 26 80, 30 90, 50 90 C 70 90, 74 80, 74 55 C 74 30, 70 10, 50 10 Z',

  // ── Eye Shapes ──
  'Siren Eye': 'M 10 50 C 30 38, 65 34, 90 44 C 95 47, 95 53, 90 56 C 65 66, 30 62, 10 50 Z',
  'Doe Eye': 'M 15 50 C 30 20, 70 20, 85 50 C 70 80, 30 80, 15 50 Z',
  'Almond Eye': 'M 12 50 C 30 26, 70 26, 88 50 C 70 74, 30 74, 12 50 Z',
  'Hooded Eye': 'M 12 53 C 30 32, 70 32, 88 53 C 70 68, 30 68, 12 53 Z M 15 42 C 32 25, 68 25, 85 42',
  'Monolid Eye': 'M 12 52 C 32 36, 68 36, 88 52 C 68 62, 32 62, 12 52 Z',
  'Dove Eye': 'M 15 48 C 30 24, 70 30, 85 52 C 70 78, 30 72, 15 48 Z',
};

interface HolographicTracerProps {
  shape: string;
  color?: string;
}

export function HolographicTracer({ shape, color = '#D98A96' }: HolographicTracerProps) {
  const drawProgress = useSharedValue(1); // 1 = hidden, 0 = fully traced
  const pathLength = 320; // Arbitrary coordinate scale path length representation

  const playHapticsSeq = () => {
    let tickCount = 0;
    const interval = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      tickCount++;
      if (tickCount >= 18) {
        clearInterval(interval);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 45);
  };

  useEffect(() => {
    drawProgress.value = 1;
    // Trigger our custom geiger-counter haptic sequence programmatically on mount
    playHapticsSeq();
    // Spring tracing animation — high stiffness, critically damped
    drawProgress.value = withSpring(0, {
      stiffness: 160,
      damping: 24,
      mass: 0.9,
    });
  }, [shape]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: drawProgress.value * pathLength,
  }));

  const d = PATH_DATA[shape] ?? PATH_DATA['Oval'];

  return (
    <View style={styles.container}>
      <Svg
        width={TRACE_SIZE}
        height={TRACE_SIZE}
        viewBox="0 0 100 100"
        style={styles.svg}
      >
        <G>
          {/* Static thin background guideline */}
          <Path
            d={d}
            stroke="rgba(217,138,150,0.12)"
            strokeWidth={1.5}
            fill="none"
          />

          {/* Glowing Animated holographic trace */}
          <AnimatedPath
            d={d}
            stroke={color}
            strokeWidth={2.8}
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

const styles = StyleSheet.create({
  container: {
    width: TRACE_SIZE,
    height: TRACE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  svg: {
    overflow: 'visible',
  },
});
