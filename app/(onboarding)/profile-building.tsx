import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeInUp, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';

const { width: SW } = Dimensions.get('window');
const PADDING = 28;
const TRACK_W = SW - PADDING * 2;

const STEPS = [
  'Analysing your skin profile…',
  'Matching your undertone…',
  'Screening ingredients…',
  'Building your colour season…',
  'Calibrating shade range…',
  'Finalising your Beauty DNA…',
];

const BULLETS = [
  'Foundation shade match',
  'Skin compatibility score',
  'Colour season',
  'Beauty archetype',
  'Product recommendations',
];

export default function ProfileBuildingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pct, setPct] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);

  const barW = useSharedValue(0);
  const barStyle = useAnimatedStyle(() => ({ width: barW.value }));

  useEffect(() => {
    barW.value = withTiming(TRACK_W, { duration: 3200, easing: Easing.out(Easing.cubic) });

    const intervals: ReturnType<typeof setInterval>[] = [];

    const pctInterval = setInterval(() => {
      setPct(p => {
        if (p >= 100) { clearInterval(pctInterval); return 100; }
        return p + 2;
      });
    }, 64);
    intervals.push(pctInterval);

    const stepInterval = setInterval(() => {
      setStepIdx(i => (i + 1) % STEPS.length);
    }, 700);
    intervals.push(stepInterval);

    const done = setTimeout(() => {
      intervals.forEach(clearInterval);
      router.replace('/(onboarding)/profile-reveal');
    }, 3400);

    return () => {
      intervals.forEach(clearInterval);
      clearTimeout(done);
    };
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
        <Text style={styles.pct}>{pct}%</Text>
        <Text style={styles.headline}>We're setting{'\n'}everything up for you</Text>

        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, barStyle]}>
            <LinearGradient
              colors={[tokens.colors.pinkDeep, tokens.colors.gold, tokens.colors.pinkRich]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        <Text style={styles.step} key={stepIdx}>{STEPS[stepIdx]}</Text>

        <View style={styles.bulletSection}>
          <Text style={styles.bulletTitle}>Building your profile for:</Text>
          {BULLETS.map((b, i) => (
            <Animated.View key={b} entering={FadeInUp.delay(i * 180).duration(400)} style={styles.bulletRow}>
              <Text style={styles.bullet}>·</Text>
              <Text style={styles.bulletText}>{b}</Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.cream,
    paddingHorizontal: PADDING,
  },
  content: { flex: 1 },
  pct: {
    fontFamily: tokens.fonts.serif,
    fontSize: 72,
    fontWeight: '400',
    color: tokens.colors.pinkDeep,
    marginBottom: 4,
  },
  headline: {
    fontFamily: tokens.fonts.regular,
    fontSize: 18,
    fontWeight: '600',
    color: tokens.colors.text,
    lineHeight: 26,
    marginBottom: 24,
  },
  barTrack: {
    height: 8,
    width: TRACK_W,
    backgroundColor: tokens.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  step: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '400',
    color: tokens.colors.gray,
    marginBottom: 32,
  },
  bulletSection: { gap: 4 },
  bulletTitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.grayLight,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bullet: { color: tokens.colors.pinkDeep, fontSize: 18, lineHeight: 24 },
  bulletText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 22,
  },
});
