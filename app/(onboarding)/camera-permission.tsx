import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { OnboardingHeader } from '@/components/onboarding-header';
import { tokens } from '@/components/theme';

const BULLETS = [
  { icon: '📷', text: 'Used only to analyse your makeup — nothing is stored remotely.' },
  { icon: '🛡️', text: 'Analysis runs on-device. Your face stays on your phone.' },
  { icon: '⚙️', text: 'Revoke camera access from Settings at any time.' },
];

export default function CameraPermissionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const advance = () => router.push('/(onboarding)/profile-building');
  const [, requestPermission] = useCameraPermissions();


  const handleAllow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await requestPermission();
    advance();
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={0} total={0} onBack={() => router.back()} />
      <View style={styles.body}>
        <Animated.Text entering={FadeInUp.delay(80).duration(500)} style={styles.eyebrow}>
          ONE LAST THING
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(160).duration(500)} style={styles.title}>
          {'Allow camera\naccess to scan.'}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(220).duration(500)} style={styles.sub}>
          REMAKE uses your camera to analyse your makeup in real time.
        </Animated.Text>

        <View style={styles.bulletCard}>
          {BULLETS.map((b, i) => (
            <Animated.View
              key={b.icon}
              entering={FadeInUp.delay(300 + i * 60).duration(450)}
              style={[styles.bulletRow, i > 0 && styles.bulletRowBorder]}
            >
              <Text style={styles.bulletIcon}>{b.icon}</Text>
              <Text style={styles.bulletText}>{b.text}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.bottom}>
        <Pressable onPress={handleAllow} style={styles.ctaPrimary}>
          <Text style={styles.ctaText}>Allow Camera</Text>
        </Pressable>
        <Pressable onPress={advance} hitSlop={8}>
          <Text style={styles.skip}>Not now</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.cream, paddingHorizontal: 28 },
  body: {},
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
  bulletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.07)',
    overflow: 'hidden',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 14,
  },
  bulletRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  bulletIcon: { fontSize: 20, marginTop: 1 },
  bulletText: {
    flex: 1,
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 20,
  },
  bottom: { gap: 14 },
  ctaPrimary: {
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
  skip: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: tokens.colors.gray,
    textAlign: 'center',
  },
});
