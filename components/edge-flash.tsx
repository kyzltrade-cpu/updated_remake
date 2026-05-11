import { useEffect } from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const EDGE = 10;
const GLOW = 24;
const C = '#FF3B80';

export function EdgeFlashOverlay({ visible }: { visible: boolean }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 80, easing: Easing.out(Easing.ease) });
    } else {
      opacity.value = withTiming(0, { duration: 200, easing: Easing.inOut(Easing.ease) });
    }
  }, [visible]);

  const edgeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (Platform.OS !== 'ios') return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 10 }]}>
      <Animated.View style={[styles.topEdge, edgeStyle]} />
      <Animated.View style={[styles.topGlow, edgeStyle]} />
      <Animated.View style={[styles.bottomEdge, edgeStyle]} />
      <Animated.View style={[styles.bottomGlow, edgeStyle]} />
      <Animated.View style={[styles.leftEdge, edgeStyle]} />
      <Animated.View style={[styles.leftGlow, edgeStyle]} />
      <Animated.View style={[styles.rightEdge, edgeStyle]} />
      <Animated.View style={[styles.rightGlow, edgeStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  topEdge: {
    position: 'absolute', top: 0, left: 0, right: 0, height: EDGE, backgroundColor: C,
  },
  topGlow: {
    position: 'absolute', top: EDGE, left: -GLOW, right: -GLOW, height: GLOW,
    backgroundColor: C, shadowColor: C, shadowOffset: { width: 0, height: -GLOW },
    shadowOpacity: 0.9, shadowRadius: GLOW, elevation: 10,
  },
  bottomEdge: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: EDGE, backgroundColor: C,
  },
  bottomGlow: {
    position: 'absolute', bottom: EDGE, left: -GLOW, right: -GLOW, height: GLOW,
    backgroundColor: C, shadowColor: C, shadowOffset: { width: 0, height: GLOW },
    shadowOpacity: 0.9, shadowRadius: GLOW, elevation: 10,
  },
  leftEdge: {
    position: 'absolute', top: 0, bottom: 0, left: 0, width: EDGE, backgroundColor: C,
  },
  leftGlow: {
    position: 'absolute', top: -GLOW, bottom: -GLOW, left: EDGE, width: GLOW,
    backgroundColor: C, shadowColor: C, shadowOffset: { width: GLOW, height: 0 },
    shadowOpacity: 0.9, shadowRadius: GLOW, elevation: 10,
  },
  rightEdge: {
    position: 'absolute', top: 0, bottom: 0, right: 0, width: EDGE, backgroundColor: C,
  },
  rightGlow: {
    position: 'absolute', top: -GLOW, bottom: -GLOW, right: EDGE, width: GLOW,
    backgroundColor: C, shadowColor: C, shadowOffset: { width: -GLOW, height: 0 },
    shadowOpacity: 0.9, shadowRadius: GLOW, elevation: 10,
  },
});