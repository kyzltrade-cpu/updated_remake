import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { registerForPushNotificationsAsync } from '@/lib/api/notifications';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';
import { OnboardingHeader } from '@/components/onboarding-header';

const BENEFITS = [
  { icon: '💄', text: 'Daily reminder to scan your look' },
  { icon: '🔥', text: 'Streak alerts so you never break the chain' },
  { icon: '✦',  text: 'Tips personalised to your Beauty DNA' },
];

export default function NotificationPermissionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const advance = () => router.push('/(onboarding)/rating');

  const handleAllow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await registerForPushNotificationsAsync();
    advance();
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={0} total={0} onBack={() => router.back()} />

      <View style={styles.body}>

        {/* Headline */}
        <Animated.Text entering={FadeInUp.delay(60).duration(500)} style={styles.eyebrow}>
          STAY ON TRACK
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(130).duration(500)} style={styles.title}>
          {'Never miss\nyour streak.'}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(190).duration(500)} style={styles.sub}>
          One nudge a day — no spam, no marketing, ever.
        </Animated.Text>

        {/* Benefits */}
        <Animated.View entering={FadeInUp.delay(260).duration(500)} style={styles.benefits}>
          {BENEFITS.map((b, i) => (
            <View key={i} style={[styles.benefitRow, i > 0 && styles.benefitBorder]}>
              <Text style={styles.benefitIcon}>{b.icon}</Text>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </Animated.View>

        {/* iOS-style notification preview */}
        <Animated.View entering={FadeInUp.delay(380).duration(500)} style={styles.previewWrap}>
          <Text style={styles.previewLabel}>What it looks like</Text>
          <View style={styles.notif}>
            <View style={styles.notifLeft}>
              <View style={styles.notifIcon}>
                <Text style={styles.notifIconText}>R</Text>
              </View>
            </View>
            <View style={styles.notifContent}>
              <View style={styles.notifMeta}>
                <Text style={styles.notifApp}>REMAKE</Text>
                <Text style={styles.notifTime}>now</Text>
              </View>
              <Text style={styles.notifTitle}>Your daily scan is ready 💄</Text>
              <Text style={styles.notifBody}>Tap to analyse today's look and keep your streak going.</Text>
            </View>
          </View>
        </Animated.View>

      </View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInUp.delay(520).duration(500)} style={styles.bottom}>
        <Pressable
          onPress={handleAllow}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.88 }]}
        >
          <Text style={styles.ctaText}>Allow Notifications</Text>
        </Pressable>
        <Pressable onPress={advance} hitSlop={10}>
          <Text style={styles.skip}>Not now</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.cream },
  body: { paddingHorizontal: 28, paddingTop: 16 },

  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10, fontWeight: '700',
    letterSpacing: 3, textTransform: 'uppercase',
    color: tokens.colors.pinkDeep, marginBottom: 12,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 36, fontWeight: '400',
    color: tokens.colors.text, lineHeight: 46, marginBottom: 10,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15, fontWeight: '300',
    color: tokens.colors.gray, lineHeight: 22, marginBottom: 28,
  },

  // Benefits list
  benefits: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  benefitBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  benefitIcon: { fontSize: 20 },
  benefitText: {
    flex: 1,
    fontFamily: tokens.fonts.regular,
    fontSize: 14, fontWeight: '400',
    color: tokens.colors.text, lineHeight: 20,
  },

  // Notification preview
  previewWrap: { gap: 8 },
  previewLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10, fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: tokens.colors.grayLight,
  },
  notif: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  notifLeft: { paddingTop: 1 },
  notifIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: tokens.colors.pinkDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  notifContent: { flex: 1, gap: 2 },
  notifMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifIconText: {
    fontFamily: tokens.fonts.serif,
    fontSize: 16, fontWeight: '400', color: '#FFFFFF',
  },
  notifApp: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11, fontWeight: '700',
    color: tokens.colors.text, letterSpacing: 0.5,
  },
  notifTime: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11, color: tokens.colors.grayLight,
  },
  notifTitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13, fontWeight: '600',
    color: tokens.colors.text, lineHeight: 18,
  },
  notifBody: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12, fontWeight: '300',
    color: tokens.colors.gray, lineHeight: 17,
  },

  bottom: { paddingHorizontal: 28, gap: 12 },
  cta: {
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 50, paddingVertical: 17,
    alignItems: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32, shadowRadius: 12, elevation: 7,
  },
  ctaText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16, fontWeight: '700', color: '#FFFFFF',
  },
  skip: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13, color: tokens.colors.gray, textAlign: 'center',
  },
});
