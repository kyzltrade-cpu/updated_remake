import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

export function LiquidBackdrop() {
  const o1X = useSharedValue(0);
  const o1Y = useSharedValue(0);
  const o2X = useSharedValue(0);
  const o2Y = useSharedValue(0);
  const o3X = useSharedValue(0);
  const o3Y = useSharedValue(0);

  useEffect(() => {
    // Orb 1 movements (Rhode Pink)
    o1X.value = withRepeat(
      withSequence(
        withTiming(W * 0.15, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-W * 0.1, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 7000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    o1Y.value = withRepeat(
      withSequence(
        withTiming(H * 0.1, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-H * 0.08, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 7500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Orb 2 movements (Liquid Gold)
    o2X.value = withRepeat(
      withSequence(
        withTiming(-W * 0.18, { duration: 9500, easing: Easing.inOut(Easing.sin) }),
        withTiming(W * 0.12, { duration: 7500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 8500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    o2Y.value = withRepeat(
      withSequence(
        withTiming(-H * 0.12, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
        withTiming(H * 0.1, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 8000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Orb 3 movements (Peach Glow)
    o3X.value = withRepeat(
      withSequence(
        withTiming(W * 0.1, { duration: 7000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-W * 0.12, { duration: 8500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 9000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    o3Y.value = withRepeat(
      withSequence(
        withTiming(H * 0.08, { duration: 8500, easing: Easing.inOut(Easing.sin) }),
        withTiming(-H * 0.1, { duration: 7500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 8000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const style1 = useAnimatedStyle(() => ({
    transform: [{ translateX: o1X.value }, { translateY: o1Y.value }],
  }));

  const style2 = useAnimatedStyle(() => ({
    transform: [{ translateX: o2X.value }, { translateY: o2Y.value }],
  }));

  const style3 = useAnimatedStyle(() => ({
    transform: [{ translateX: o3X.value }, { translateY: o3Y.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Background base tone */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFF5F7' }]} />

      {/* Overlapping animated mesh blurred vector layers */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Rhode Pink Orb */}
        <Animated.View
          style={[
            styles.orb,
            styles.pinkOrb,
            { left: W * 0.05, top: H * 0.15 },
            style1,
          ]}
        />

        {/* Liquid Gold Orb */}
        <Animated.View
          style={[
            styles.orb,
            styles.goldOrb,
            { right: W * 0.05, bottom: H * 0.2 },
            style2,
          ]}
        />

        {/* Peach Glow Orb */}
        <Animated.View
          style={[
            styles.orb,
            styles.peachOrb,
            { left: W * 0.2, top: H * 0.45 },
            style3,
          ]}
        />
      </View>

      {/* Real Gaussian Blur Overlay to blend them into a premium editorial mesh */}
      <BlurView intensity={95} tint="light" style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    width: W * 0.75,
    height: W * 0.75,
    borderRadius: (W * 0.75) / 2,
    opacity: 0.35,
    // Emulate heavy WebGL blur filter
    transform: [{ scale: 1.15 }],
  },
  pinkOrb: {
    backgroundColor: '#D98A96', // Rhode Pink
    shadowColor: '#D98A96',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 100,
    elevation: 20,
  },
  goldOrb: {
    backgroundColor: '#FDA8BD', // Warm Peach-Pink
    shadowColor: '#FDA8BD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 100,
    elevation: 20,
  },
  peachOrb: {
    backgroundColor: '#E8A0AA', // Peach deep
    shadowColor: '#E8A0AA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 100,
    elevation: 20,
  },
});
