import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';
import { ob } from '@/components/onboarding-styles';
import { GlassButton } from '@/components/glass-button';
import { OnboardingHeader } from '@/components/onboarding-header';

const TIPS = [
  {
    num: '01',
    head: 'Face the window',
    desc: 'Natural light in front of you — never behind. Back lighting skews your colour read.',
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
    <View style={[ob.root, { paddingBottom: insets.bottom + 36 }]}>
      <OnboardingHeader step={0} total={0} onBack={() => router.back()} />

      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={styles.header}>
        <Text style={ob.eyebrow}>Your Reveal Starts Now</Text>
        <Text style={ob.title}>Set the scene for{'\n'}the clearest read.</Text>
        <Text style={ob.sub}>
          30 seconds of setup for the most accurate result — then you're in.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)}>
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

      <View style={ob.spacer} />

      <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.bottom}>
        <GlassButton
          title="I'm Ready — Scan Me"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/first-scan');
          }}
          variant="primary"
          style={styles.cta}
        />
        <Text style={ob.footnote}>Takes about 3 seconds</Text>
      </Animated.View>

      <LinearGradient
        colors={['transparent', 'rgba(10,8,7,0.08)']}
        style={styles.bottomGlow}
        pointerEvents="none"
      />

      <Animated.Text entering={FadeIn.duration(900)} style={styles.decor} pointerEvents="none">
        ✦
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 36 },
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
  bottom: { alignItems: 'center', gap: 10, zIndex: 2 },
  cta: { width: '100%' },
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
  },
});
