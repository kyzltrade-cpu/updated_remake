import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { tokens } from './theme';

export function AppSplashScreen() {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    scale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
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
    textAlign: 'center',
  },
  tagline: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    color: tokens.colors.gray,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
