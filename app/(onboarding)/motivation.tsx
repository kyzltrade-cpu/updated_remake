import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { OnboardingHeader } from '@/components/onboarding-header';
import { tokens } from '@/components/theme';

const POINTS = [
  { icon: '💄', text: 'Foundation matched to your shade, type, and undertone' },
  { icon: '🔬', text: 'Every ingredient screened against your sensitivities' },
  { icon: '🎯', text: 'Shade picks that actually translate to your skin' },
  { icon: '✨', text: 'A Beauty DNA that sharpens with every scan' },
];

export default function MotivationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={17} total={18} onBack={() => router.back()} />

      <View style={styles.body}>
        <Animated.Text entering={FadeInUp.delay(80).duration(500)} style={styles.title}>
          {'You have great\ntaste. Let\'s make\nit science.'}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(160).duration(500)} style={styles.sub}>
          Here's exactly what REMAKE is building for you right now.
        </Animated.Text>

        <View style={styles.pointsCard}>
          {POINTS.map((p, i) => (
            <Animated.View
              key={p.text}
              entering={FadeInUp.delay(240 + i * 60).duration(450)}
              style={[styles.pointRow, i > 0 && styles.pointRowBorder]}
            >
              <Text style={styles.pointIcon}>{p.icon}</Text>
              <Text style={styles.pointText}>{p.text}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.bottom}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/thank-you-trust');
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
    marginBottom: 28,
    lineHeight: 20,
  },
  pointsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.07)',
    overflow: 'hidden',
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  pointRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  pointIcon: { fontSize: 22 },
  pointText: {
    flex: 1,
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 20,
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
