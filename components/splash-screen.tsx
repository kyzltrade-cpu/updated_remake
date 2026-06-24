import { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { tokens } from './theme';

export function AppSplashScreen({ onAnimationComplete }: { onAnimationComplete?: () => void }) {
  // Unified entrance/exit values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.93);
  const translateY = useSharedValue(10);

  useEffect(() => {
    // 1. Entrance animation (Fade-in with slow scale and lift)
    opacity.value = withTiming(1, { duration: 750, easing: Easing.out(Easing.quad) });
    scale.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) });
    translateY.value = withTiming(0, { duration: 900, easing: Easing.out(Easing.quad) });

    // 2. Cinematic exit zoom
    const exitTimer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 480, easing: Easing.inOut(Easing.quad) });
      scale.value = withTiming(1.22, { duration: 550, easing: Easing.in(Easing.cubic) });
      translateY.value = withTiming(-15, { duration: 550, easing: Easing.in(Easing.cubic) });
    }, 1500);

    // 3. Complete callback (fires exactly at the end of the exit animation)
    const completeTimer = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 2050);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.center, animatedStyle]}>
        <Text style={styles.wordmark}>REMAKE</Text>
        <Text style={styles.tagline}>Your makeup, analysed. Daily.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.beige,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    gap: 18,
  },
  wordmark: {
    fontFamily: tokens.fonts.serif,
    fontSize: 64,
    fontWeight: '400',
    color: tokens.colors.pinkRich,
    letterSpacing: 2,
    paddingHorizontal: 20, // Prevent Playfair Display clipping
    textAlign: 'center',
  },
  tagline: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    color: tokens.colors.gray,
    letterSpacing: 0.3,
    paddingHorizontal: 20, // Prevent text clipping
    textAlign: 'center',
  },
});
