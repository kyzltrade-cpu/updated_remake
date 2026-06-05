import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, runOnJS, FadeInUp,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { OnboardingHeader } from '@/components/onboarding-header';
import { saveGloField } from '@/lib/glo-profile';
import { tokens } from '@/components/theme';

const { width: SW } = Dimensions.get('window');
const PADDING  = 28;
const TRACK_W  = SW - PADDING * 2;
const THUMB_R  = 20;
const THUMB_D  = THUMB_R * 2;
const TRAVEL_W = TRACK_W - THUMB_D; // thumb left-edge travel range

const LEVELS = [
  { id: 'beginner',   frac: 0,   icon: '🪞', label: 'Beginner',   desc: 'Still learning the basics' },
  { id: 'enthusiast', frac: 0.5, icon: '🎨', label: 'Enthusiast', desc: 'Comfortable with most looks' },
  { id: 'pro',        frac: 1,   icon: '✨', label: 'Pro',        desc: 'I create editorial-level looks' },
];

const SNAP_SPRING_CONFIG = {
  damping: 28,
  stiffness: 300,
  mass: 0.8,
} as const;

export default function SkillScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [levelIdx, setLevelIdx] = useState(1);

  // thumbX is the LEFT EDGE of the thumb, clamped to [0, TRAVEL_W]
  const thumbX = useSharedValue(TRAVEL_W * 0.5);
  const fillW  = useSharedValue(TRAVEL_W * 0.5 + THUMB_R);
  const startX = useSharedValue(0);

  const snapToIdx = useCallback((idx: number) => {
    if (idx !== levelIdx) {
      Haptics.selectionAsync();
      setLevelIdx(idx);
    }
    const targetThumbX = LEVELS[idx].frac * TRAVEL_W;
    thumbX.value = withSpring(targetThumbX, SNAP_SPRING_CONFIG);
    fillW.value  = withSpring(targetThumbX + THUMB_R, SNAP_SPRING_CONFIG);
  }, [levelIdx]);

  const pan = Gesture.Pan()
    .onBegin(() => { startX.value = thumbX.value; })
    .onUpdate((e) => {
      const raw     = startX.value + e.translationX;
      const clamped = Math.max(0, Math.min(TRAVEL_W, raw));
      thumbX.value  = clamped;
      fillW.value   = clamped + THUMB_R;
      const frac = clamped / TRAVEL_W;
      
      let best = 0;
      for (let i = 0; i < LEVELS.length; i++) {
        if (Math.abs(frac - LEVELS[i].frac) < Math.abs(frac - LEVELS[best].frac)) {
          best = i;
        }
      }
      runOnJS(setLevelIdx)(best);
    })
    .onEnd(() => {
      const frac = thumbX.value / TRAVEL_W;

      // Synchronously find the closest snap index on UI thread
      let bestIdx = 1; // default middle
      let minDistance = 999;
      for (let i = 0; i < LEVELS.length; i++) {
        const dist = Math.abs(frac - LEVELS[i].frac);
        if (dist < minDistance) {
          minDistance = dist;
          bestIdx = i;
        }
      }

      runOnJS(setLevelIdx)(bestIdx);

      const targetThumbX = LEVELS[bestIdx].frac * TRAVEL_W;
      thumbX.value = withSpring(targetThumbX, SNAP_SPRING_CONFIG);
      fillW.value  = withSpring(targetThumbX + THUMB_R, SNAP_SPRING_CONFIG);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: fillW.value,
  }));

  const current = LEVELS[levelIdx];

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await saveGloField({ skill: current.id });
    router.push('/(onboarding)/confidence-proof');
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={11} total={18} onBack={() => router.back()} />

      <View style={styles.body}>
        <Animated.Text entering={FadeInUp.delay(80).duration(500)} style={styles.title}>
          Tell us about your{'\n'}makeup experience.
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(140).duration(500)} style={styles.sub}>
          Your results and coaching adapt to your level.
        </Animated.Text>

        <Animated.View entering={FadeInUp.delay(220).duration(500)} style={styles.infoCard}>
          <Text style={styles.infoIcon}>{current.icon}</Text>
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>{current.label}</Text>
            <Text style={styles.infoDesc}>{current.desc}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.sliderWrap}>
          <View style={styles.track}>
            <Animated.View style={[styles.trackFill, fillStyle]} />
            {LEVELS.map((l, i) => (
              <View
                key={l.id}
                style={[
                  styles.tick,
                  { left: l.frac * TRACK_W - 2 },
                  i === levelIdx && styles.tickActive,
                ]}
              />
            ))}
          </View>

          <GestureDetector gesture={pan}>
            <Animated.View style={[styles.thumb, thumbStyle]}>
              <Text style={styles.thumbIcon}>{current.icon}</Text>
            </Animated.View>
          </GestureDetector>

          <View style={styles.iconsRow}>
            {LEVELS.map((l, i) => (
              <Pressable key={l.id} onPress={() => snapToIdx(i)} style={styles.iconBtn}>
                <Text style={styles.iconBig}>{l.icon}</Text>
                <Text style={[styles.iconLabel, i === levelIdx && styles.iconLabelActive]}>
                  {l.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.bottom}>
        <Pressable onPress={handleContinue} style={styles.cta}>
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.cream },
  body: { paddingHorizontal: PADDING, paddingTop: 20 },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 32,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 42,
    marginBottom: 8,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '300',
    color: tokens.colors.gray,
    marginBottom: 28,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.07)',
    gap: 14,
    marginBottom: 40,
  },
  infoIcon: { fontSize: 36 },
  infoText: { flex: 1, gap: 3 },
  infoLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 17,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  infoDesc: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 18,
  },
  sliderWrap: {},
  track: {
    height: 6,
    backgroundColor: tokens.colors.border,
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 3,
  },
  tick: {
    position: 'absolute',
    top: -3,
    width: 4,
    height: 12,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  tickActive: { backgroundColor: tokens.colors.pinkRich },
  thumb: {
    position: 'absolute',
    top: -19,
    width: THUMB_R * 2,
    height: THUMB_R * 2,
    borderRadius: THUMB_R,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: tokens.colors.pinkDeep,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  thumbIcon: { fontSize: 18 },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
  },
  iconBtn: { alignItems: 'center', gap: 6, flex: 1 },
  iconBig: { fontSize: 28 },
  iconLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '500',
    color: tokens.colors.grayLight,
    textAlign: 'center',
  },
  iconLabelActive: { color: tokens.colors.pinkDeep, fontWeight: '700' },
  bottom: { paddingHorizontal: PADDING },
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
