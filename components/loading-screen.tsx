import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { tokens } from './theme';

function Shimmer({ width, height, radius = 6, delay = 0 }: { width: number | string; height: number; radius?: number; delay?: number }) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease), delay }),
      -1,
      false
    );
  }, []);

  const w = typeof width === 'number' ? width : 200;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-w, w * 1.2]) }],
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
        <Shimmer width={60} height={10} radius={5} />
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={styles.categoryRow}>
            <View style={{ flex: 1, gap: 6 }}>
              <Shimmer width={90 + (i % 2) * 30} height={12} radius={6} delay={i * 80} />
              <Shimmer width={160 + (i % 3) * 20} height={10} radius={5} delay={i * 80 + 40} />
            </View>
            <View style={[styles.block, { width: 36, height: 36, borderRadius: 18 }]} />
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Shimmer width={85} height={10} radius={5} />
        {[0, 1, 2].map(i => (
          <View key={i} style={{ marginBottom: 16, gap: 8 }}>
            <Shimmer width={240 + (i % 2) * 40} height={12} radius={6} delay={i * 100} />
            <Shimmer width={140 + i * 20} height={10} radius={5} delay={i * 100 + 50} />
          </View>
        ))}
      </View>

      <View style={styles.cta}>
        <View style={[styles.block, { flex: 1, height: 46, borderRadius: 23 }]} />
        <View style={[styles.block, { flex: 1, height: 46, borderRadius: 23 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.white, paddingTop: 60 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 14 },
  brand: { fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '500', letterSpacing: 0.12, textTransform: 'uppercase', color: tokens.colors.gray },
  hero: { alignItems: 'center', paddingVertical: 48 },
  divider: { height: 1, marginHorizontal: 28, backgroundColor: tokens.colors.pinkDeep, opacity: 0.15 },
  section: { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 8 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  cta: { flexDirection: 'row', gap: 10, paddingHorizontal: 28, paddingTop: 16, marginBottom: 50 },
  block: { backgroundColor: G, overflow: 'hidden' },
  shimmer: { backgroundColor: '#f8f4ef', borderRadius: 10 },
});