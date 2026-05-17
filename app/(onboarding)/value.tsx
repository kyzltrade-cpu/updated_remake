import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  FadeIn, FadeInUp,
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSpring, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';

const { width: W } = Dimensions.get('window');

const SCORE_TARGET = 79;
const RING_SIZE = W * 0.52;
const STROKE = 5;
const R = (RING_SIZE - STROKE * 2) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

function ScoreRingMock() {
  const [count, setCount] = useState(0);
  const arcProgress = useSharedValue(0);
  const glowO = useSharedValue(0);

  useEffect(() => {
    // Count up the number
    const steps = 40;
    const stepMs = 30;
    let step = 0;
    const id = setTimeout(() => {
      const iv = setInterval(() => {
        step++;
        setCount(Math.min(Math.round((SCORE_TARGET / steps) * step), SCORE_TARGET));
        if (step >= steps) clearInterval(iv);
      }, stepMs);
    }, 600);

    // Animate the arc
    arcProgress.value = withDelay(600, withTiming(SCORE_TARGET / 100, {
      duration: 1300,
      easing: Easing.out(Easing.exp),
    }));
    glowO.value = withDelay(900, withTiming(1, { duration: 600 }));

    return () => clearTimeout(id);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowO.value }));

  const dashOffset = CIRCUMFERENCE * (1 - (arcProgress.value as number));

  return (
    <View style={styles.ringWrap}>
      <Animated.View style={[styles.ringGlow, glowStyle]} />
      <View style={[styles.ring, { width: RING_SIZE, height: RING_SIZE }]}>
        {/* Background track */}
        <View style={[styles.ringTrack, { width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, borderWidth: STROKE }]} />
        {/* SVG-style arc would require react-native-svg — using border trick instead */}
      </View>
      <View style={styles.ringCenter}>
        <Animated.Text entering={FadeIn.delay(600).duration(400)} style={styles.scoreNum}>
          {count}
        </Animated.Text>
        <Text style={styles.scoreOf}>/100</Text>
      </View>
    </View>
  );
}

export default function ValueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const ctaSc = useSharedValue(0.88);
  useEffect(() => {
    ctaSc.value = withDelay(1400, withSpring(1, { damping: 10, stiffness: 120 }));
  }, []);
  const ctaStyle = useAnimatedStyle(() => ({ transform: [{ scale: ctaSc.value }] }));

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}>
      <LinearGradient
        colors={['#1A0818', '#2E0A24', '#1A0818']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top copy */}
      <Animated.View entering={FadeInUp.delay(100).duration(700)} style={styles.top}>
        <Text style={styles.eyebrow}>REMAKE</Text>
        <Text style={styles.headline}>You've been{'\n'}guessing.</Text>
      </Animated.View>

      {/* Score hero */}
      <View style={styles.scoreSection}>
        <ScoreRingMock />
        <Animated.View entering={FadeIn.delay(1000).duration(600)} style={styles.categories}>
          {[
            { label: 'Blending', score: '73', warn: true },
            { label: 'Colour Harmony', score: '91', warn: false },
            { label: 'Brow Framing', score: '88', warn: false },
          ].map(c => (
            <View key={c.label} style={[styles.catPill, c.warn && styles.catPillWarn]}>
              <Text style={[styles.catLabel, c.warn && styles.catLabelWarn]}>{c.label}</Text>
              <Text style={[styles.catScore, c.warn && styles.catScoreWarn]}>{c.score}</Text>
            </View>
          ))}
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(1200).duration(600)} style={styles.callout}>
          "Your blend drops off at the left temple.{'\n'}Start 2cm higher."
        </Animated.Text>
      </View>

      {/* Bottom */}
      <View style={styles.bottom}>
        <Animated.Text entering={FadeIn.delay(1300).duration(600)} style={styles.pitch}>
          This is what REMAKE sees.{'\n'}Your mirror can't.
        </Animated.Text>
        <Animated.View style={ctaStyle}>
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.88 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(onboarding)/name');
            }}
          >
            <Text style={styles.ctaText}>See mine  →</Text>
          </Pressable>
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(1600).duration(500)} style={styles.hint}>
          2 minutes · free to start
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },

  // Top copy
  top: { gap: 10 },
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 5,
    color: tokens.colors.pinkMid,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: tokens.fonts.serif,
    fontSize: 50,
    color: '#FFF0F7',
    lineHeight: 60,
    letterSpacing: 0.3,
  },

  // Score ring
  scoreSection: {
    alignItems: 'center',
    gap: 22,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: RING_SIZE,
    height: RING_SIZE,
  },
  ringGlow: {
    position: 'absolute',
    width: RING_SIZE + 40,
    height: RING_SIZE + 40,
    borderRadius: (RING_SIZE + 40) / 2,
    backgroundColor: tokens.colors.pinkDeep,
    opacity: 0,
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
  },
  ring: { position: 'absolute' },
  ringTrack: {
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'transparent',
  },
  ringCenter: {
    alignItems: 'center',
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 3,
  },
  scoreNum: {
    fontFamily: tokens.fonts.serif,
    fontSize: 88,
    color: '#FFF0F7',
    lineHeight: 96,
    letterSpacing: -3,
  },
  scoreOf: {
    fontFamily: tokens.fonts.regular,
    fontSize: 18,
    color: 'rgba(255,240,247,0.4)',
    alignSelf: 'flex-end',
    marginBottom: 14,
  },

  // Category pills
  categories: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  catPill: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  catPillWarn: {
    backgroundColor: 'rgba(204,68,68,0.12)',
    borderColor: 'rgba(204,68,68,0.3)',
  },
  catLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: 'rgba(255,240,247,0.65)',
  },
  catLabelWarn: { color: 'rgba(255,160,160,0.8)' },
  catScore: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.pinkMid,
  },
  catScoreWarn: { color: '#E85A5A' },

  // Specific callout — the thing that feels real
  callout: {
    fontFamily: tokens.fonts.serif,
    fontSize: 15,
    fontStyle: 'italic',
    color: 'rgba(255,214,239,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: W * 0.78,
  },

  // Bottom
  bottom: { gap: 18, alignItems: 'center' },
  pitch: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: 'rgba(255,249,247,0.5)',
    textAlign: 'center',
    lineHeight: 22,
  },
  cta: {
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 52,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF0F7',
    letterSpacing: 0.3,
  },
  hint: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: 'rgba(255,249,247,0.25)',
    letterSpacing: 0.5,
  },
});
