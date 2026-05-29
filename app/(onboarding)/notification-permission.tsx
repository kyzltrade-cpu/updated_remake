import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';
import { ob } from '@/components/onboarding-styles';
import { GlassButton } from '@/components/glass-button';
import { OnboardingHeader } from '@/components/onboarding-header';

const BULLETS = [
  '· One notification per day max',
  '· Turn off anytime in Settings',
  '· No promotional messages, ever',
];

export default function NotificationPermissionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const advance = () => router.push('/(main)/paywall');

  const handleAllow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Notifications.requestPermissionsAsync();
    advance();
  };

  const handleSkip = () => {
    advance();
  };

  return (
    <View style={[ob.root, { paddingBottom: insets.bottom + 40 }]}>
      <OnboardingHeader step={0} total={0} />

      <View style={styles.content}>
        <Animated.View entering={FadeIn.delay(100).duration(600)} style={ob.permIcon}>
          <Text style={styles.iconText}>🔔</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(220).duration(500)} style={ob.permHeader}>
          <Text style={ob.permTitle}>Don't break{'\n'}your streak.</Text>
          <Text style={ob.permBody}>
            REMAKE will remind you once a day to scan — that's it. No spam, no marketing.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(340).duration(500)} style={ob.permBullets}>
          {BULLETS.map(b => (
            <Text key={b} style={ob.permBullet}>{b}</Text>
          ))}
        </Animated.View>
      </View>

      <View style={ob.spacer} />

      <Animated.View entering={FadeInUp.delay(460).duration(500)} style={ob.bottom}>
        <GlassButton
          title="Allow Notifications"
          onPress={handleAllow}
          variant="primary"
          style={styles.cta}
        />
        <Pressable onPress={handleSkip} hitSlop={8}>
          <Text style={ob.skipLink}>Not now</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingTop: 12,
  },
  iconText: {
    fontSize: 36,
  },
  cta: {
    width: '100%',
  },
});
