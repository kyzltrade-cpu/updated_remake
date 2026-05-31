import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { OnboardingHeader } from '@/components/onboarding-header';
import { tokens } from '@/components/theme';

const BULLETS = [
  { icon: '💄', text: 'Your shade range is well-covered by today\'s top brands' },
  { icon: '✨', text: 'Your skin type works beautifully with current formulas' },
  { icon: '🎯', text: 'Thousands of products are already matched to your profile' },
];

export default function ValidationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={10} total={18} onBack={() => router.back()} />

      <View style={styles.body}>
        <Animated.Text entering={FadeInUp.delay(80).duration(500)} style={styles.title}>
          {'Good news —\nyour profile is\nalready strong.'}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(160).duration(500)} style={styles.sub}>
          Based on what you've told us, REMAKE has a lot to work with.
        </Animated.Text>

        <Animated.View entering={FadeInUp.delay(260).duration(500)} style={styles.card}>
          {BULLETS.map((b, i) => (
            <View key={i} style={[styles.row, i > 0 && styles.rowBorder]}>
              <Text style={styles.rowIcon}>{b.icon}</Text>
              <Text style={styles.rowText}>{b.text}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(380).duration(500)} style={styles.highlightCard}>
          <View style={styles.highlightLeft}>
            <Text style={styles.highlightStat}>94%</Text>
            <Text style={styles.highlightUnit}>match rate</Text>
          </View>
          <Text style={styles.highlightBody}>
            of REMAKE users find their foundation shade in their first three scans.
          </Text>
        </Animated.View>
      </View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInUp.delay(460).duration(500)} style={styles.bottom}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/skill');
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
    marginBottom: 10,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '300',
    color: tokens.colors.gray,
    marginBottom: 24,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.07)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  rowIcon: { fontSize: 22 },
  rowText: {
    flex: 1,
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 20,
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.07)',
    padding: 18,
    gap: 16,
  },
  highlightLeft: {
    alignItems: 'center',
    paddingRight: 16,
    borderRightWidth: 1.5,
    borderRightColor: 'rgba(0,0,0,0.07)',
  },
  highlightStat: {
    fontFamily: tokens.fonts.serif,
    fontSize: 42,
    fontWeight: '400',
    color: tokens.colors.pinkDeep,
    lineHeight: 46,
  },
  highlightUnit: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '600',
    color: tokens.colors.pinkDeep,
    letterSpacing: 0.3,
    opacity: 0.75,
    marginTop: 2,
  },
  highlightBody: {
    flex: 1,
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '400',
    color: tokens.colors.text,
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
