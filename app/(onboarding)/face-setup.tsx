import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import { FaceCorners } from '@/components/face-corners';
import * as Haptics from 'expo-haptics';

export default function FaceSetupScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
        <Text style={styles.tag}>Setup</Text>
        <Text style={styles.title}>Position your face</Text>
        <Text style={styles.sub}>Center your face within the guide for the most accurate analysis.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(700)} style={styles.viewfinder}>
        <View style={styles.cameraPreview}>
          <FaceCorners size={200} />
        </View>
        <Text style={styles.hint}>Align your face</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(550).duration(600)} style={styles.bottom}>
        <GlassButton
          title="Enable Camera"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(main)/scan');
          }}
          variant="primary"
          style={styles.cta}
        />
        <Text style={styles.privacy}>Your photos are processed locally and never stored on our servers.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.darkBg, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 50 },
  header: { alignItems: 'center', marginBottom: 36 },
  tag: { fontFamily: tokens.fonts.regular, fontSize: 11, letterSpacing: 0.16, textTransform: 'uppercase', color: tokens.colors.grayLight, fontWeight: '500', marginBottom: 20 },
  title: { fontFamily: tokens.fonts.serif, fontSize: 28, fontWeight: '400', color: tokens.colors.white, textAlign: 'center', marginBottom: 12 },
  sub: { fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '300', color: tokens.colors.grayLight, textAlign: 'center', maxWidth: 260 },
  viewfinder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cameraPreview: {
    width: 280, height: 360,
    backgroundColor: tokens.colors.darkBgLight,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232,160,170,0.15)',
  },
  hint: { fontFamily: tokens.fonts.regular, fontSize: 11, letterSpacing: 0.6, color: 'rgba(232,160,170,0.35)', textTransform: 'uppercase', fontWeight: '500', marginTop: 16 },
  bottom: { alignItems: 'center', gap: 12 },
  cta: { width: '100%' },
  privacy: { fontFamily: tokens.fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' },
});