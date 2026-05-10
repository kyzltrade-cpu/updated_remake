import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import { OnboardingPagination } from '@/components/onboarding-pagination';
import * as Haptics from 'expo-haptics';

export default function FreeScanScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100).duration(700)} style={styles.content}>
        <View style={styles.iconRing}>
          <Text style={styles.icon}>◎</Text>
        </View>
        <Text style={styles.title}>Your first scan{'\n'}awaits.</Text>
        <Text style={styles.sub}>Scan daily to build your streak and track your artistry progress over time.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(400).duration(700)} style={styles.bottom}>
        <GlassButton
          title="Take Free Scan"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.replace('/(main)/scan');
          }}
          variant="primary"
          style={styles.cta}
        />
        <OnboardingPagination total={10} current={6} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.beige, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 50 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  iconRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 1.5, borderColor: tokens.colors.pinkDeep, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  icon: { fontSize: 36, color: tokens.colors.pinkDeep },
  title: { fontFamily: tokens.fonts.serif, fontSize: 32, fontWeight: '400', color: tokens.colors.text, textAlign: 'center', lineHeight: 42 },
  sub: { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '300', color: tokens.colors.gray, textAlign: 'center', maxWidth: 280, lineHeight: 22 },
  bottom: { alignItems: 'center', gap: 24 },
  cta: { width: '100%' },
});