import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { OnboardingHeader } from '@/components/onboarding-header';
import { tokens } from '@/components/theme';

const TRUST_POINTS = [
  { icon: '🔒', title: 'Stays on your device', body: 'Your skin data is never sold or shared.' },
  { icon: '🗑️', title: 'Delete anytime', body: 'Remove your profile and all data in one tap.' },
  { icon: '🚫', title: 'Zero promotional messages', body: 'We only contact you if you ask us to.' },
];

export default function ThankYouTrustScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={17} total={18} onBack={() => router.back()} />

      <View style={styles.body}>
        <Animated.Text entering={FadeInUp.delay(80).duration(500)} style={styles.eyebrow}>
          BEFORE WE BUILD YOUR PROFILE
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(160).duration(500)} style={styles.title}>
          {'Your data is\nyours. Always.'}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(220).duration(500)} style={styles.sub}>
          We need a few skin details to personalise your results. Here's how we protect them.
        </Animated.Text>

        <View style={styles.trustList}>
          {TRUST_POINTS.map((p, i) => (
            <Animated.View
              key={p.title}
              entering={FadeInUp.delay(300 + i * 70).duration(450)}
              style={[styles.trustRow, i > 0 && styles.trustRowBorder]}
            >
              <Text style={styles.trustIcon}>{p.icon}</Text>
              <View style={styles.trustText}>
                <Text style={styles.trustTitle}>{p.title}</Text>
                <Text style={styles.trustBody}>{p.body}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInUp.delay(560).duration(500)} style={styles.bottom}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/camera-permission');
          }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>I understand — continue</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.cream },
  body: { paddingHorizontal: 28, paddingTop: 20 },
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
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
    lineHeight: 21,
    marginBottom: 28,
  },
  trustList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.07)',
    overflow: 'hidden',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
    gap: 16,
  },
  trustRowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  trustIcon: { fontSize: 22, marginTop: 1 },
  trustText: { flex: 1, gap: 3 },
  trustTitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  trustBody: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '300',
    color: tokens.colors.gray,
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
