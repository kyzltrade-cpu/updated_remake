import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import { OnboardingPagination } from '@/components/onboarding-pagination';
import * as Haptics from 'expo-haptics';

const TESTIMONIALS = [
  { name: 'Ava M.', text: '"My contour looked perfect in selfies but terrible in daylight. REMAKE showed me exactly where the blend was off."' },
  { name: 'Sofia R.', text: '"The eye score caught that my liner was asymmetric before I even noticed. Game changer."' },
  { name: 'Priya K.', text: '"Three weeks of using REMAKE and my streak is at 21 days. I actually look forward to my morning scan."' },
];

export default function SocialProofScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
        <Text style={styles.tag}>Real Results</Text>
      </Animated.View>

      <View style={styles.testimonials}>
        {TESTIMONIALS.map((t, i) => (
          <Animated.View key={i} entering={FadeInUp.delay(200 + i * 120).duration(600)} style={styles.card}>
            <Text style={styles.text}>{t.text}</Text>
            <Text style={styles.name}>{t.name}</Text>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInUp.delay(550).duration(600)} style={styles.bottom}>
        <GlassButton
          title="Start My Profile"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(onboarding)/name');
          }}
          variant="primary"
          style={styles.cta}
        />
        <OnboardingPagination total={3} current={3} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.beige, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 50 },
  header: { alignItems: 'center', marginBottom: 30 },
  tag: { fontFamily: tokens.fonts.regular, fontSize: 11, letterSpacing: 0.16, textTransform: 'uppercase', color: tokens.colors.gray, fontWeight: '500' },
  testimonials: { flex: 1, gap: 16 },
  card: { backgroundColor: tokens.colors.white, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: tokens.colors.border },
  text: { fontFamily: tokens.fonts.serif, fontSize: 14, fontStyle: 'italic', color: tokens.colors.text, lineHeight: 22, marginBottom: 10 },
  name: { fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '500', color: tokens.colors.pinkRich },
  bottom: { alignItems: 'center', gap: 24, paddingTop: 20 },
  cta: { width: '100%' },
});
