import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { tokens } from '@/components/theme';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace('/(onboarding)/value');
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(800)} style={styles.center}>
        <Text style={styles.wordmark}>REMAKE</Text>
        <Text style={styles.tagline}>Your makeup, analysed. Daily.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.beige,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    gap: 18,
  },
  wordmark: {
    fontFamily: tokens.fonts.serif,
    fontSize: 64,
    fontWeight: '400',
    color: tokens.colors.pinkRich,
    letterSpacing: 2,
  },
  tagline: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    color: tokens.colors.gray,
    letterSpacing: 0.3,
  },
});
