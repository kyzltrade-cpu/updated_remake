import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming, FadeInUp, Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { OnboardingHeader } from '@/components/onboarding-header';
import { tokens } from '@/components/theme';

const BAR_MAX_H = 220;
const WITHOUT_FRAC = 0.28; // 28% confidence without REMAKE
const WITH_FRAC    = 0.94; // 94% confidence with REMAKE

function ComparisonBar({
  fraction,
  label,
  value,
  variant,
  delay,
}: {
  fraction: number;
  label: string;
  value: string;
  variant: 'muted' | 'primary';
  delay: number;
}) {
  const height = useSharedValue(0);

  useEffect(() => {
    height.value = withDelay(
      delay,
      withTiming(BAR_MAX_H * fraction, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const barStyle = useAnimatedStyle(() => ({ height: height.value }));
  const isPrimary = variant === 'primary';

  return (
    <View style={styles.colWrap}>
      <Text style={[styles.colLabel, isPrimary && styles.colLabelPrimary]}>{label}</Text>
      <View style={[styles.barTrack, isPrimary && styles.barTrackPrimary]}>
        <Animated.View style={[styles.barFill, isPrimary ? styles.barFillPrimary : styles.barFillMuted, barStyle]}>
          <Text style={[styles.barValue, isPrimary && styles.barValuePrimary]}>{value}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

export default function ConfidenceProofScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={12} total={18} onBack={() => router.back()} />

      <View style={styles.body}>
        <Animated.Text entering={FadeInUp.delay(80).duration(500)} style={styles.title}>
          {'REMAKE gets your\nshade right 94%\nof the time.'}
        </Animated.Text>

        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.card}>
          <View style={styles.barsRow}>
            <ComparisonBar
              fraction={WITHOUT_FRAC}
              label={'Without\nREMAKE'}
              value="28%"
              variant="muted"
              delay={400}
            />
            <ComparisonBar
              fraction={WITH_FRAC}
              label={'With\nREMAKE'}
              value="94%"
              variant="primary"
              delay={550}
            />
          </View>

          <Text style={styles.cardCaption}>
            Guessing gets it right 1 in 4 times.
            REMAKE gets it right nearly every time.
          </Text>
        </Animated.View>
      </View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInUp.delay(700).duration(500)} style={styles.bottom}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/social-proof');
          }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.cream },
  body: { paddingHorizontal: 28, paddingTop: 20 },

  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 32,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 42,
    marginBottom: 28,
  },

  card: {
    backgroundColor: '#F5ECEB',
    borderRadius: 22,
    padding: 20,
    gap: 20,
  },

  barsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
    height: BAR_MAX_H + 52,
  },

  colWrap: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
  },

  colLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.gray,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
  },
  colLabelPrimary: {
    color: tokens.colors.text,
  },

  barTrack: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 16,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barTrackPrimary: {
    backgroundColor: 'rgba(232,57,154,0.08)',
  },

  barFill: {
    borderRadius: 14,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
  },
  barFillMuted: {
    backgroundColor: '#FFFFFF',
  },
  barFillPrimary: {
    backgroundColor: tokens.colors.pinkDeep,
  },

  barValue: {
    fontFamily: tokens.fonts.serif,
    fontSize: 28,
    fontWeight: '400',
    color: tokens.colors.grayLight,
  },
  barValuePrimary: {
    color: '#FFFFFF',
  },

  cardCaption: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '300',
    color: tokens.colors.gray,
    textAlign: 'center',
    lineHeight: 19,
  },

  bottom: { paddingHorizontal: 28 },
  cta: {
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 7,
  },
  ctaText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
