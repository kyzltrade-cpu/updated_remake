import { useEffect } from 'react';
import { View, Text, StyleSheet, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  WithTimingConfig,
} from 'react-native-reanimated';
import { tokens } from './theme';

function Shimmer({ width, height, radius = 6, delay = 0 }: { width: DimensionValue; height: number; radius?: number; delay?: number }) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) } as WithTimingConfig),
        -1,
        false
      );
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-200, 240]) }],
  }));

  return (
    <View style={[styles.block, { width, height, borderRadius: radius }]}>
      <Animated.View style={[styles.shimmer, { width: '60%', height: '100%' }, animStyle]} />
    </View>
  );
}

const G = '#ece6df';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={[styles.block, { width: 34, height: 34, borderRadius: 17 }]} />
        <Text style={styles.brand}>REMAKE</Text>
        <View style={[styles.block, { width: 34, height: 34, borderRadius: 17 }]} />
      </View>

      <View style={styles.hero}>
        <View style={[styles.block, { width: 140, height: 140, borderRadius: 70 }]} />
        <View style={{ marginTop: 28, alignItems: 'center', gap: 10 }}>
          <Shimmer width={200} height={14} radius={7} />
          <Shimmer width={140} height={14} radius={7} />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Shimmer width={60} height={14} radius={7} />
        <View style={{ marginTop: 16, gap: 12 }}>
          <Shimmer width="100%" height={60} radius={12} />
          <Shimmer width="100%" height={60} radius={12} />
          <Shimmer width="100%" height={60} radius={12} />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Shimmer width={90} height={14} radius={7} />
        <View style={{ marginTop: 16, gap: 12 }}>
          <Shimmer width="100%" height={50} radius={10} />
          <Shimmer width="100%" height={50} radius={10} />
          <Shimmer width="100%" height={50} radius={10} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.beige, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 50 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  brand: { fontFamily: tokens.fonts.serif, fontSize: 18, color: tokens.colors.text, fontWeight: '400', letterSpacing: 0.12 },
  block: { backgroundColor: G, overflow: 'hidden' },
  shimmer: { backgroundColor: tokens.colors.ivory, opacity: 0.6 },
  hero: { alignItems: 'center', paddingTop: 20 },
  divider: { height: 1, backgroundColor: tokens.colors.border, marginVertical: 28 },
  section: { gap: 8 },
});