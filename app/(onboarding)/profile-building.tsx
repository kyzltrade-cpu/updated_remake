import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { ob } from '@/components/onboarding-styles';

const STEPS = [
  'Skin profile mapped',
  'Allergen filters set',
  'Shade matching calibrated',
  'Style direction noted',
  'Personalising your results…',
];

const DURATION = 3000;

export default function ProfileBuildingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Pulsing sparkle
  const sparkleScale = useSharedValue(1);
  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkleScale.value }],
  }));

  // Progress bar
  const barWidth = useSharedValue(0);
  const barStyle = useAnimatedStyle(() => ({
    width: barWidth.value * (width - 56),
  }));

  useEffect(() => {
    sparkleScale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0,  { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    barWidth.value = withTiming(1, { duration: DURATION, easing: Easing.inOut(Easing.ease) });

    const t = setTimeout(() => {
      router.replace('/(onboarding)/profile-reveal');
    }, DURATION + 200);

    return () => clearTimeout(t);
  }, []);

  return (
    <View style={[ob.rootDark, styles.root, { paddingBottom: insets.bottom + 40 }]}>
      {/* Sparkle */}
      <Animated.Text style={[styles.sparkle, sparkleStyle]}>✦</Animated.Text>

      {/* Headline */}
      <Animated.Text entering={FadeInUp.delay(100).duration(500)} style={ob.titleItalicDark}>
        Building your{'\n'}scanner…
      </Animated.Text>

      {/* Checklist */}
      <View style={styles.list}>
        {STEPS.map((step, i) => (
          <Animated.View
            key={step}
            entering={FadeInUp.delay(300 + i * 420).duration(400)}
            style={styles.row}
          >
            <Text style={styles.check}>{i < STEPS.length - 1 ? '✓' : '✦'}</Text>
            <Text style={[styles.stepText, i === STEPS.length - 1 && styles.stepTextLast]}>
              {step}
            </Text>
          </Animated.View>
        ))}
      </View>

      <View style={ob.spacer} />

      {/* Progress bar */}
      <View style={[styles.track, { width: width - 56 }]}>
        <Animated.View style={[styles.fill, barStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    justifyContent: 'flex-start',
    paddingTop: 100,
  },
  sparkle: {
    fontSize: 48,
    color: tokens.colors.gold,
    textAlign: 'center',
    marginBottom: 32,
  },
  list: {
    marginTop: 32,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  check: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: tokens.colors.pinkDeep,
    width: 18,
    textAlign: 'center',
  },
  stepText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.7)',
  },
  stepTextLast: {
    color: tokens.colors.gold,
    fontWeight: '400',
  },
  track: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  fill: {
    height: 2,
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 2,
  },
});
