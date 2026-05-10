import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import * as Haptics from 'expo-haptics';

export default function HookScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/value');
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.top}>
        <Text style={styles.brand}>REMAKE</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.hero}>
        <Text style={styles.headline}>Your face.{'\n'}Your mirror.{'\n'}Perfected.</Text>
        <Text style={styles.sub}>
          AI-powered makeup analysis that sees what others can't.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(600).duration(800)} style={styles.bottom}>
        <GlassButton
          title="Get Started"
          onPress={handleGetStarted}
          variant="primary"
          style={styles.cta}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.beige,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 50,
  },
  top: {
    alignItems: 'center',
    paddingTop: 20,
  },
  brand: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.16,
    color: tokens.colors.gray,
    textTransform: 'uppercase',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  headline: {
    fontFamily: tokens.fonts.serif,
    fontSize: 40,
    fontWeight: '400',
    lineHeight: 50,
    color: tokens.colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    lineHeight: 22,
    color: tokens.colors.gray,
    textAlign: 'center',
    maxWidth: 280,
  },
  bottom: {
    alignItems: 'center',
  },
  cta: {
    width: '100%',
  },
});