import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { tokens } from '@/components/theme';

const { width: W } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  // Unified exit/entrance values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.93);
  const translateY = useSharedValue(10);

  useEffect(() => {
    // 1. Entrance animation (Fade-in with slow scale and lift)
    opacity.value = withTiming(1, { duration: 750, easing: Easing.out(Easing.quad) });
    scale.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) });
    translateY.value = withTiming(0, { duration: 900, easing: Easing.out(Easing.quad) });

    // 2. Cinematic exit zoom (Start fade out, zoom, and push up slightly before transition)
    const exitTimer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 480, easing: Easing.inOut(Easing.quad) });
      scale.value = withTiming(1.22, { duration: 550, easing: Easing.in(Easing.cubic) });
      translateY.value = withTiming(-15, { duration: 550, easing: Easing.in(Easing.cubic) });
    }, 1500);

    // 3. Router replace (Matches the end of the exit animation)
    const routeTimer = setTimeout(() => {
      router.replace('/(onboarding)/value');
    }, 2050);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(routeTimer);
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
        <Animated.Text style={styles.wordmark}>REMAKE</Animated.Text>
        <Animated.Text style={styles.tagline}>Your makeup, analysed. Daily.</Animated.Text>
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
  },
  tagline: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    color: tokens.colors.gray,
    letterSpacing: 0.3,
  },
});
