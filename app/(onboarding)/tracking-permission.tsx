import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Platform, Linking } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ob } from '@/components/onboarding-styles';
import { GlassButton } from '@/components/glass-button';
import { OnboardingHeader } from '@/components/onboarding-header';

const BULLETS = [
  '· Face photos are never used for tracking',
  '· Results stored securely on your account',
  '· Never sold to third parties',
];

export default function TrackingPermissionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const advance = () => router.push('/(main)/paywall');

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === 'ios') {
      try {
        // Dynamically import to avoid crashing on Android
        const { requestTrackingPermissionsAsync } = await import(
          'expo-tracking-transparency'
        );
        await requestTrackingPermissionsAsync();
      } catch {
        // Package not installed — skip silently
      }
    }
    advance();
  };

  const handleLearnMore = () => {
    Linking.openURL('https://remake.app/privacy');
  };

  return (
    <View style={[ob.root, { paddingBottom: insets.bottom + 40 }]}>
      <OnboardingHeader step={0} total={0} />

      <View style={styles.content}>
        <Animated.View entering={FadeIn.delay(100).duration(600)} style={ob.permIcon}>
          <Text style={styles.iconText}>🔒</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(220).duration(500)} style={ob.permHeader}>
          <Text style={ob.permTitle}>We don't{'\n'}sell your data.</Text>
          <Text style={ob.permBody}>
            This standard iOS prompt lets us measure if our ads are working.
            Your face photos never leave your device.
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
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          style={styles.cta}
        />
        <Pressable onPress={handleLearnMore} hitSlop={8}>
          <Text style={ob.skipLink}>Learn more about privacy</Text>
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
