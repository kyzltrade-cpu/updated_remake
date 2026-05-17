import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';

function MockResultCard() {
  return (
    <Animated.View entering={FadeIn.delay(400).duration(700)} style={styles.mockCard}>
      <View style={styles.mockHeader}>
        <View style={styles.mockScoreWrap}>
          <Text style={styles.mockScore}>79</Text>
          <Text style={styles.mockScoreOf}>/100</Text>
        </View>
        <View style={styles.mockBadge}>
          <Text style={styles.mockBadgeText}>✓ GO</Text>
        </View>
      </View>
      <View style={styles.mockBars}>
        {[
          { label: 'Blending', pct: 73, low: true },
          { label: 'Colour Harmony', pct: 88, low: false },
          { label: 'Brow Framing', pct: 91, low: false },
        ].map(b => (
          <View key={b.label} style={styles.mockBarRow}>
            <Text style={styles.mockBarLabel}>{b.label}</Text>
            <View style={styles.mockBarTrack}>
              <View style={[
                styles.mockBarFill,
                { width: `${b.pct}%` as `${number}%` },
                b.low && styles.mockBarLow,
              ]} />
            </View>
            <Text style={[styles.mockBarNum, b.low && styles.mockBarNumLow]}>{b.pct}</Text>
          </View>
        ))}
      </View>
      <View style={styles.mockTip}>
        <Text style={styles.mockTipLabel}>YOUR NEXT WIN</Text>
        <Text style={styles.mockTipText}>Blend further up the temple — your edges are defined on the right but soft on the left.</Text>
      </View>
    </Animated.View>
  );
}

export default function ValueScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[tokens.colors.beige, tokens.colors.ivory]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View entering={FadeInUp.delay(80).duration(600)} style={styles.top}>
        <Text style={styles.eyebrow}>REMAKE</Text>
        <Text style={styles.headline}>Your makeup,{'\n'}finally honest.</Text>
        <Text style={styles.sub}>AI reads your technique in seconds — blending, symmetry, colour, the lot.</Text>
      </Animated.View>

      <MockResultCard />

      <Animated.View entering={FadeInUp.delay(700).duration(500)} style={styles.bottom}>
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.88 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/name');
          }}
        >
          <Text style={styles.ctaText}>Start my free analysis</Text>
        </Pressable>
        <Text style={styles.hint}>Takes 2 minutes · No account needed yet</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 28, paddingTop: 70, paddingBottom: 50 },
  top: { gap: 10, marginBottom: 32 },
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 4,
    color: tokens.colors.pinkDeep,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: tokens.fonts.serif,
    fontSize: 38,
    color: tokens.colors.text,
    lineHeight: 48,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 23,
  },

  // Mock result card
  mockCard: {
    flex: 1,
    backgroundColor: tokens.colors.white,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    gap: 18,
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  mockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mockScoreWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  mockScore: {
    fontFamily: tokens.fonts.serif,
    fontSize: 52,
    color: tokens.colors.text,
    lineHeight: 56,
  },
  mockScoreOf: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    color: tokens.colors.grayLight,
    marginBottom: 8,
  },
  mockBadge: {
    backgroundColor: '#EBF7EE',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: '#2D7D46',
  },
  mockBadgeText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '700',
    color: '#2D7D46',
    letterSpacing: 1,
  },
  mockBars: { gap: 12 },
  mockBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mockBarLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    color: tokens.colors.gray,
    width: 110,
  },
  mockBarTrack: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: tokens.colors.border,
    overflow: 'hidden',
  },
  mockBarFill: {
    height: '100%',
    borderRadius: 2.5,
    backgroundColor: tokens.colors.pinkDeep,
  },
  mockBarLow: { backgroundColor: '#C44' },
  mockBarNum: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.pinkDeep,
    width: 26,
    textAlign: 'right',
  },
  mockBarNumLow: { color: '#C44' },
  mockTip: {
    backgroundColor: tokens.colors.blush,
    borderRadius: 14,
    padding: 14,
    gap: 5,
  },
  mockTipLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: tokens.colors.pinkRich,
    textTransform: 'uppercase',
  },
  mockTipText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12.5,
    color: tokens.colors.text,
    lineHeight: 19,
  },

  bottom: { gap: 12, alignItems: 'center', paddingTop: 24 },
  cta: {
    width: '100%',
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.white,
  },
  hint: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    color: tokens.colors.grayLight,
  },
});
