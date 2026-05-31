import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, runOnJS, FadeInUp,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { OnboardingHeader } from '@/components/onboarding-header';
import { saveGloField } from '@/lib/glo-profile';
import { tokens } from '@/components/theme';

const { width: SW } = Dimensions.get('window');
const PADDING  = 28;
const TRACK_W  = SW - PADDING * 2;
const THUMB_R  = 18;
const THUMB_D  = THUMB_R * 2;
// The thumb left-edge travels this range so the thumb body never exits the track
const TRAVEL_W = TRACK_W - THUMB_D;

const SNAPS = [
  { frac: 0,    id: 'cool',          label: 'Cool',          desc: 'Pink, red, or blue undertones',  color: '#6BAED6' },
  { frac: 0.25, id: 'slightly_cool', label: 'Slightly Cool', desc: 'Neutral leaning cool',           color: '#9EBDCC' },
  { frac: 0.5,  id: 'neutral',       label: 'Neutral',       desc: 'Mix of warm and cool tones',     color: '#C8B09A' },
  { frac: 0.75, id: 'slightly_warm', label: 'Slightly Warm', desc: 'Neutral leaning warm',           color: '#CFA87A' },
  { frac: 1,    id: 'warm',          label: 'Warm',          desc: 'Yellow, peach, or golden tones', color: '#D4AF37' },
];

function getSnap(frac: number) {
  let best = SNAPS[0];
  let bestDist = Math.abs(frac - SNAPS[0].frac);
  for (const s of SNAPS) {
    const d = Math.abs(frac - s.frac);
    if (d < bestDist) { bestDist = d; best = s; }
  }
  return best;
}

export default function ToneGuessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [snapIdx, setSnapIdx] = useState(2); // neutral default

  // thumbX is the LEFT EDGE of the thumb, constrained to [0, TRAVEL_W]
  const thumbX = useSharedValue(TRAVEL_W * 0.5);
  const startX = useSharedValue(0);

  const updateSnap = useCallback((frac: number) => {
    const snap = getSnap(frac);
    const newIdx = SNAPS.indexOf(snap);
    if (newIdx !== snapIdx) {
      Haptics.selectionAsync();
      setSnapIdx(newIdx);
    }
  }, [snapIdx]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      startX.value = thumbX.value; // capture left-edge position at gesture start
    })
    .onUpdate((e) => {
      const raw     = startX.value + e.translationX;
      const clamped = Math.max(0, Math.min(TRAVEL_W, raw));
      thumbX.value  = clamped;
      runOnJS(updateSnap)(clamped / TRAVEL_W);
    })
    .onEnd(() => {
      const snap = SNAPS[snapIdx];
      thumbX.value = withSpring(snap.frac * TRAVEL_W, { damping: 14, stiffness: 220 });
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  const current = SNAPS[snapIdx];

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await saveGloField({ undertone: current.id });
    router.push('/(onboarding)/skin-goals');
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={6} total={18} onBack={() => router.back()} />

      <View style={styles.body}>
        <Animated.Text entering={FadeInUp.delay(80).duration(500)} style={styles.title}>
          What's your skin{'\n'}undertone?
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(140).duration(500)} style={styles.sub}>
          Drag to find your undertone — it affects shade matching.
        </Animated.Text>

        <Animated.View entering={FadeInUp.delay(220).duration(500)} style={styles.labelCard}>
          <View style={[styles.labelDot, { backgroundColor: current.color }]} />
          <View style={styles.labelText}>
            <Text style={styles.labelTitle}>{current.label}</Text>
            <Text style={styles.labelDesc}>{current.desc}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.sliderWrap}>
          <LinearGradient
            colors={['#6BAED6', '#9EBDCC', '#C8B09A', '#CFA87A', '#D4AF37']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.track}
          />

          <GestureDetector gesture={pan}>
            <Animated.View style={[styles.thumb, thumbStyle, { borderColor: current.color }]}>
              <View style={[styles.thumbInner, { backgroundColor: current.color }]} />
            </Animated.View>
          </GestureDetector>

          <View style={styles.labels}>
            <Text style={[styles.endLabel, { color: '#6BAED6' }]}>Cool</Text>
            <Text style={[styles.endLabel, { color: '#C8B09A' }]}>Neutral</Text>
            <Text style={[styles.endLabel, { color: '#D4AF37' }]}>Warm</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(420).duration(500)} style={styles.swatchRow}>
          {SNAPS.map((s, i) => (
            <Pressable
              key={s.id}
              onPress={() => {
                Haptics.selectionAsync();
                setSnapIdx(i);
                thumbX.value = withSpring(s.frac * TRAVEL_W, { damping: 14, stiffness: 220 });
              }}
              style={[styles.swatch, { backgroundColor: s.color }, snapIdx === i && styles.swatchActive]}
            />
          ))}
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
  title: { fontFamily: tokens.fonts.serif, fontSize: 32, fontWeight: '400', color: tokens.colors.text, lineHeight: 42, marginBottom: 8 },
  sub: { fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '300', color: tokens.colors.gray, marginBottom: 24, lineHeight: 20 },
  labelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.07)',
    gap: 14,
    marginBottom: 32,
  },
  labelDot: { width: 44, height: 44, borderRadius: 22 },
  labelText: { flex: 1, gap: 3 },
  labelTitle: { fontFamily: tokens.fonts.regular, fontSize: 17, fontWeight: '700', color: tokens.colors.text },
  labelDesc: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '300', color: tokens.colors.gray, lineHeight: 18 },
  sliderWrap: { marginBottom: 20, height: THUMB_R * 2 + 52 },
  track: {
    position: 'absolute',
    top: 10,
    left: 0,
    width: TRACK_W,
    height: THUMB_R * 2,
    borderRadius: THUMB_R,
  },
  thumb: {
    position: 'absolute',
    top: 10,
    width: THUMB_R * 2,
    height: THUMB_R * 2,
    borderRadius: THUMB_R,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  thumbInner: { width: 10, height: 10, borderRadius: 5 },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: THUMB_R * 2 + 16,
  },
  endLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  swatchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 4,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: tokens.colors.text,
    transform: [{ scale: 1.15 }],
  },
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
  ctaText: { fontFamily: tokens.fonts.regular, fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
