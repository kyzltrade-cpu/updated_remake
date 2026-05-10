import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import { OnboardingPagination } from '@/components/onboarding-pagination';
import * as Haptics from 'expo-haptics';

export default function ValueScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100).duration(700)} style={styles.header}>
        <Text style={styles.tag}>Why REMAKE</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(250).duration(700)} style={styles.features}>
        <View style={styles.feature}>
          <Text style={styles.featureEmoji}>◎</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>AI That Sees Real Makeup</Text>
            <Text style={styles.featureDesc}>Not just skin — it reads products, layers, and technique.</Text>
          </View>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureEmoji}>◈</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Honest Scores</Text>
            <Text style={styles.featureDesc}>Get objective breakdowns across complexion, eyes, lips, and sculpt.</Text>
          </View>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureEmoji}>◉</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Streaks That Motivate</Text>
            <Text style={styles.featureDesc}>Daily scans build streaks. Consistency is the secret to mastery.</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500).duration(700)} style={styles.bottom}>
        <GlassButton
          title="Next"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(onboarding)/features');
          }}
          variant="primary"
          style={styles.cta}
        />
        <OnboardingPagination total={10} current={1} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.beige,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  tag: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    letterSpacing: 0.16,
    textTransform: 'uppercase',
    color: tokens.colors.gray,
    fontWeight: '500',
  },
  features: {
    flex: 1,
    gap: 30,
    paddingTop: 20,
  },
  feature: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'flex-start',
  },
  featureEmoji: {
    fontSize: 22,
    color: tokens.colors.pinkDeep,
    marginTop: 2,
    width: 28,
    textAlign: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '500',
    color: tokens.colors.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 20,
  },
  bottom: {
    alignItems: 'center',
    gap: 24,
  },
  cta: {
    width: '100%',
  },
});