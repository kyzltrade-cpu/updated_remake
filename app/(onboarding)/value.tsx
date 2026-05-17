import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeIn, FadeInUp,
  useSharedValue, withTiming, withDelay, withRepeat, withSequence,
  useAnimatedStyle, Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { ScoreRing } from '@/components/score-ring';
import * as Haptics from 'expo-haptics';

function PulseRing() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  return (
    <Animated.View style={useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))}>
      <ScoreRing score={78} visible />
    </Animated.View>
  );
}

export default function ValueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 36 }]}>

      <Animated.Text entering={FadeIn.duration(400)} style={styles.brand}>
        REMAKE
      </Animated.Text>

      <Animated.View entering={FadeIn.delay(150).duration(600)} style={styles.ringWrapper}>
        <PulseRing />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.copy}>
        <Text style={styles.headline}>The score your mirror{'\n'}never gives you.</Text>
        <Text style={styles.sub}>
          Scored across blending, symmetry, colour harmony, coverage, and brow shaping — with coaching tailored to your face.
        </Text>
      </Animated.View>

      <View style={styles.spacer} />

      <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.bottom}>
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/name');
          }}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
        <Text style={styles.footnote}>Free · No account needed · Takes 60 seconds</Text>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.beige,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  brand: {
    fontFamily: tokens.fonts.serif,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 4,
    color: tokens.colors.pinkDeep,
    textTransform: 'uppercase',
    marginBottom: 40,
  },
  ringWrapper: {
    marginBottom: 36,
  },
  copy: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 4,
  },
  headline: {
    fontFamily: tokens.fonts.serif,
    fontSize: 34,
    fontWeight: '400',
    color: tokens.colors.text,
    textAlign: 'center',
    lineHeight: 46,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '300',
    color: tokens.colors.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  spacer: { flex: 1, minHeight: 24 },
  bottom: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 14,
  },
  cta: {
    width: '100%',
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaPressed: { opacity: 0.88 },
  ctaText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.white,
  },
  footnote: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: tokens.colors.grayLight,
  },
});
