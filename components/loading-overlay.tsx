import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { tokens } from '@/components/theme';

const STEPS = ['Mapping features…', 'Analyzing finish…', 'Preparing results…'];

interface LoadingOverlayProps {
  visible: boolean;
  onComplete?: () => void;
}

export function LoadingOverlay({ visible, onComplete }: LoadingOverlayProps) {
  const opacity = useSharedValue(0);
  const spinnerRotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      spinnerRotation.value = withRepeat(
        withTiming(360, { duration: 800, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle, styles.container]}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <Animated.View style={[styles.spinner, spinnerStyle]} />
        <Text style={styles.text}>Analyzing</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  spinner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.12)',
    borderTopColor: tokens.colors.goldSoft,
    marginBottom: 20,
  },
  text: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.4,
    fontWeight: '300',
  },
});