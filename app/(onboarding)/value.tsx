import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';

const DNA_SLIDES = [
  { glyph: '◯', label: 'Foundation\nShade' },
  { glyph: '✦', label: 'Colour\nSeason' },
  { glyph: '⬭', label: 'Face\nShape' },
  { glyph: '—', label: 'Brow\nBlueprint' },
  { glyph: '✦', label: 'Lash\nProfile' },
  { glyph: '◉', label: 'Energy\nType' },
  { glyph: '♡', label: 'Archetype' },
  { glyph: '♡', label: 'Lip\nProfile' },
  { glyph: '◉', label: 'Blush\nProfile' },
  { glyph: '✦', label: 'Product\nKit' },
  { glyph: '◈', label: 'Beauty\nWrapped' },
];

export default function ValueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 40 }]}>

      <Animated.Text entering={FadeIn.duration(900)} style={styles.scoreDecor}>
        78
      </Animated.Text>

      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.eyebrowRow}>
        <Text style={styles.eyebrow}>REMAKE</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(220).duration(600)} style={styles.headlineBlock}>
        <Text style={styles.headline}>See your makeup{'\n'}the way the{'\n'}camera does.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(360).duration(500)} style={styles.body}>
        <Text style={styles.bodyText}>
          One photo. Eleven personalised results — built around your exact face.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(440).duration(500)} style={styles.dnaGrid}>
        {DNA_SLIDES.map((slide) => (
          <View key={slide.label} style={styles.dnaCell}>
            <Text style={styles.dnaCellGlyph}>{slide.glyph}</Text>
            <Text style={styles.dnaCellLabel}>{slide.label}</Text>
          </View>
        ))}
      </Animated.View>

      <View style={styles.spacer} />

      <Animated.View entering={FadeInUp.delay(540).duration(500)} style={styles.bottom}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/features');
          }}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Text style={styles.ctaText}>Start My Analysis</Text>
        </Pressable>
        <Text style={styles.footnote}>Free · No card required</Text>
      </Animated.View>

      <LinearGradient
        colors={['transparent', 'rgba(10,8,7,0.06)']}
        style={styles.bottomGlow}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.beige,
    paddingHorizontal: 28,
  },
  scoreDecor: {
    position: 'absolute',
    top: -10,
    right: -22,
    fontFamily: tokens.fonts.serif,
    fontSize: 230,
    fontWeight: '400',
    color: 'rgba(232,57,154,0.055)',
    lineHeight: 230,
  },
  eyebrowRow: { marginBottom: 28 },
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    color: tokens.colors.pinkDeep,
  },
  headlineBlock: { marginBottom: 16 },
  headline: {
    fontFamily: tokens.fonts.serif,
    fontSize: 38,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 50,
  },
  body: { marginBottom: 20 },
  bodyText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 22,
  },
  dnaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dnaCell: {
    width: '22%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 6,
    backgroundColor: tokens.colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  dnaCellGlyph: {
    fontFamily: tokens.fonts.serif,
    fontSize: 18,
    color: tokens.colors.pinkDeep,
    lineHeight: 22,
  },
  dnaCellLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 9,
    fontWeight: '500',
    color: tokens.colors.text,
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 13,
  },
  spacer: { flex: 1, minHeight: 16 },
  bottom: { alignItems: 'center', gap: 14 },
  cta: {
    width: '100%',
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 7,
  },
  ctaPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  ctaText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: tokens.colors.white,
  },
  footnote: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: tokens.colors.grayLight,
    letterSpacing: 0.3,
  },
  bottomGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    pointerEvents: 'none',
  },
});
