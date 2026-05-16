import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import * as Haptics from 'expo-haptics';

const TIPS = [
  'Remove glasses',
  'Pull hair back from face',
  'Natural indirect light — no ring light',
  'Look straight at the camera',
];

export default function ScanPrepScreen() {
  const router = useRouter();

  const handleReady = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/bare-photo');
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100).duration(700)} style={styles.top}>
        <Text style={styles.tag}>Setup</Text>
        <Text style={styles.title}>Time to meet{'\n'}your real skin.</Text>
        <Text style={styles.sub}>
          One bare-face photo — no makeup, no filters. This is how we read your true undertone and face profile.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(700)} style={styles.illustration}>
        <View style={styles.phoneFrame}>
          <View style={styles.faceOval} />
          <View style={styles.sunHint}>
            <Text style={styles.sunIcon}>☀</Text>
            <Text style={styles.sunLabel}>Natural light</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(480).duration(700)} style={styles.tips}>
        {TIPS.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(600).duration(700)} style={styles.bottom}>
        <GlassButton
          title="I'm ready"
          onPress={handleReady}
          variant="primary"
          style={styles.cta}
        />
        <Text style={styles.privacy}>
          Your photo is analysed on-device and never shared without your consent.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.darkBg,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 50,
  },
  top: {
    alignItems: 'center',
    marginBottom: 32,
  },
  tag: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    letterSpacing: 0.16,
    textTransform: 'uppercase',
    color: tokens.colors.grayLight,
    fontWeight: '500',
    marginBottom: 20,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 30,
    fontWeight: '400',
    color: tokens.colors.white,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 14,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '300',
    color: tokens.colors.grayLight,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  illustration: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneFrame: {
    width: 120,
    height: 180,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(232,160,170,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  faceOval: {
    width: 60,
    height: 80,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(232,160,170,0.5)',
    borderStyle: 'dashed',
  },
  sunHint: {
    position: 'absolute',
    top: 10,
    right: -44,
    alignItems: 'center',
    gap: 2,
  },
  sunIcon: {
    fontSize: 20,
    color: tokens.colors.goldSoft,
  },
  sunLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 9,
    color: tokens.colors.goldSoft,
    letterSpacing: 0.05,
  },
  tips: {
    gap: 12,
    marginBottom: 32,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: tokens.colors.pinkDeep,
  },
  tipText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '300',
    color: tokens.colors.grayLight,
  },
  bottom: {
    alignItems: 'center',
    gap: 12,
  },
  cta: {
    width: '100%',
  },
  privacy: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
    lineHeight: 16,
  },
});
