import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { OnboardingHeader } from '@/components/onboarding-header';
import { tokens } from '@/components/theme';

const FEATURES = [
  {
    icon: '🔬',
    title: 'Rated in seconds',
    body: 'Point. Shoot. Get a score across Complexion, Eyes, Lips, and Sculpt.',
  },
  {
    icon: '🎨',
    title: 'Matched to your skin',
    body: 'Products filtered for your type, undertone, and sensitivities — not just your budget.',
  },
  {
    icon: '📈',
    title: 'Gets sharper over time',
    body: 'Every scan builds your Beauty DNA. The longer you use it, the better it knows you.',
  },
];

export default function FeaturesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={6} total={18} onBack={() => router.back()} />

      <View style={styles.body}>
        <Animated.Text entering={FadeInUp.delay(80).duration(500)} style={styles.eyebrow}>
          HOW IT WORKS
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(160).duration(500)} style={styles.title}>
          {'Three things REMAKE\ndoes that others don\'t.'}
        </Animated.Text>

        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={f.title}
              entering={FadeInUp.delay(260 + i * 80).duration(480)}
              style={styles.featureRow}
            >
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureBody}>{f.body}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInUp.delay(520).duration(500)} style={styles.bottom}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/tone-guess');
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
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    color: tokens.colors.pinkDeep,
    marginBottom: 12,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 30,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 40,
    marginBottom: 32,
  },
  featureList: {
    gap: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  featureRow: {
    flexDirection: 'row',
    padding: 18,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    alignItems: 'flex-start',
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: tokens.colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureIcon: { fontSize: 20 },
  featureText: { flex: 1, gap: 4 },
  featureTitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.text,
    lineHeight: 20,
  },
  featureBody: {
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
  ctaText: { fontFamily: tokens.fonts.regular, fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
