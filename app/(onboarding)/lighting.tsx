import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import { OnboardingHeader } from '@/components/onboarding-header';
import * as Haptics from 'expo-haptics';

const TIPS = [
  {
    num: '01',
    head: 'Face the window',
    desc: 'Natural light in front of you — never behind. Side or back lighting skews your colour read.',
  },
  {
    num: '02',
    head: 'Pull hair back',
    desc: 'Every face boundary matters for an accurate shape map. Show every edge.',
  },
  {
    num: '03',
    head: 'Remove glasses',
    desc: 'Frames break symmetry and depth analysis. Bare eyes give the cleanest read.',
  },
];

export default function LightingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 36 }]}>
      <OnboardingHeader step={11} total={11} onBack={() => router.back()} />

      {/* Header */}
      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={styles.header}>
        <Text style={styles.eyebrow}>Profile built ✦</Text>
        <Text style={styles.title}>One last thing{'\n'}before your reveal.</Text>
        <Text style={styles.sub}>Set the scene for the most accurate read of your face — 30 seconds, then you're in.</Text>
      </Animated.View>

      {/* Tips — editorial numbered style, no white cards */}
      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.tips}>
        {TIPS.map((tip, i) => (
          <Animated.View key={tip.num} entering={FadeInUp.delay(200 + i * 80).duration(400)}>
            <View style={styles.tip}>
              <Text style={styles.tipNum}>{tip.num}</Text>
              <View style={styles.tipBody}>
                <Text style={styles.tipHead}>{tip.head}</Text>
                <Text style={styles.tipDesc}>{tip.desc}</Text>
              </View>
            </View>
            {i < TIPS.length - 1 && <View style={styles.divider} />}
          </Animated.View>
        ))}
      </Animated.View>

      <View style={styles.spacer} />

      {/* CTA */}
      <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.bottom}>
        <GlassButton
          title="I'm ready — scan me"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/first-scan');
          }}
          variant="primary"
          style={styles.cta}
        />
        <Text style={styles.note}>Takes about 3 seconds</Text>
      </Animated.View>

      {/* Atmospheric bottom gradient bridges to the dark camera world */}
      <LinearGradient
        colors={['transparent', 'rgba(10,8,7,0.08)']}
        style={styles.bottomGlow}
        pointerEvents="none"
      />

      {/* Decorative */}
      <Animated.Text entering={FadeIn.duration(900)} style={styles.decor}>✦</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.beige,
    paddingHorizontal: 28,
  },
  header: { marginBottom: 36 },
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: tokens.colors.pinkDeep,
    marginBottom: 14,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 34,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 44,
    marginBottom: 10,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 22,
  },

  tips: {},
  tip: {
    flexDirection: 'row',
    gap: 18,
    paddingVertical: 18,
    alignItems: 'flex-start',
  },
  tipNum: {
    fontFamily: tokens.fonts.serif,
    fontSize: 13,
    fontWeight: '400',
    color: tokens.colors.pinkDeep,
    opacity: 0.7,
    width: 24,
    marginTop: 2,
    flexShrink: 0,
  },
  tipBody: { flex: 1, gap: 4 },
  tipHead: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '600',
    color: tokens.colors.text,
  },
  tipDesc: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.border,
    marginLeft: 42,
  },

  spacer: { flex: 1, minHeight: 32 },
  bottom: { alignItems: 'center', gap: 12, zIndex: 2 },
  cta: { width: '100%' },
  note: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: tokens.colors.grayLight,
    letterSpacing: 0.2,
  },

  bottomGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  decor: {
    position: 'absolute',
    bottom: 80,
    right: 22,
    fontSize: 60,
    color: 'rgba(232,57,154,0.05)',
    pointerEvents: 'none',
  },
});
