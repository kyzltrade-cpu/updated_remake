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

const CATEGORIES = ['Blending', 'Symmetry', 'Colour Harmony', 'Coverage', 'Brow Shaping'];

function PulseRing() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(1.04, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <ScoreRing score={78} visible />
    </Animated.View>
  );
}

export default function ValueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 36 }]}>

      {/* Brand wordmark */}
      <Animated.Text entering={FadeIn.duration(500)} style={styles.brand}>
        REMAKE
      </Animated.Text>

      {/* Score ring — the product's core mechanic, hinted at */}
      <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.ringWrapper}>
        <PulseRing />
        <Animated.Text entering={FadeIn.delay(500).duration(500)} style={styles.ringLabel}>
          your score, personalised
        </Animated.Text>
      </Animated.View>

      {/* Editorial headline */}
      <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.headlineBlock}>
        <Text style={styles.headline}>The score your{'\n'}mirror never{'\n'}gives you.</Text>
      </Animated.View>

      {/* Category list — names only, no numbers — creates curiosity */}
      <Animated.View entering={FadeInUp.delay(560).duration(500)} style={styles.categories}>
        {CATEGORIES.map((cat, i) => (
          <View key={cat} style={styles.catRow}>
            <View style={styles.catDot} />
            <Text style={styles.catName}>{cat}</Text>
            <View style={styles.catBar} />
          </View>
        ))}
      </Animated.View>

      <View style={styles.spacer} />

      {/* CTA */}
      <Animated.View entering={FadeInUp.delay(700).duration(500)} style={styles.bottom}>
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
    paddingHorizontal: 32,
    alignItems: 'center',
  },

  brand: {
    fontFamily: tokens.fonts.serif,
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 3.5,
    color: tokens.colors.pinkDeep,
    textTransform: 'uppercase',
    marginBottom: 32,
  },

  ringWrapper: {
    alignItems: 'center',
    gap: 14,
    marginBottom: 36,
  },
  ringLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: tokens.colors.grayLight,
  },

  headlineBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  headline: {
    fontFamily: tokens.fonts.serif,
    fontSize: 40,
    fontWeight: '400',
    color: tokens.colors.text,
    textAlign: 'center',
    lineHeight: 52,
  },

  categories: {
    alignSelf: 'stretch',
    gap: 10,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: tokens.colors.pinkDeep,
  },
  catName: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '500',
    color: tokens.colors.text,
    width: 130,
  },
  catBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: tokens.colors.border,
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
    letterSpacing: 0.2,
  },
  footnote: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: tokens.colors.grayLight,
    textAlign: 'center',
  },
});
