import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import * as Haptics from 'expo-haptics';

const ZONES = ['Complexion', 'Eyes', 'Lips', 'Sculpt & Glow'];

export default function ValueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 36 }]}>

      {/* Typographic anchor — decorative background number */}
      <Animated.Text entering={FadeIn.duration(700)} style={styles.scoreDecor}>
        78
      </Animated.Text>

      <Animated.View entering={FadeInUp.delay(120).duration(600)} style={styles.eyebrowRow}>
        <Text style={styles.eyebrow}>REMAKE</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(240).duration(600)} style={styles.headlineBlock}>
        <Text style={styles.headline}>See your makeup the way{'\n'}the camera does.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(380).duration(500)} style={styles.body}>
        <Text style={styles.bodyText}>
          In 60 seconds, REMAKE analyses your makeup across four zones and tells you exactly what to fix — not just what looks good.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(460).duration(500)} style={styles.zones}>
        {ZONES.map(z => (
          <View key={z} style={styles.zoneRow}>
            <View style={styles.zoneDot} />
            <Text style={styles.zoneLabel}>{z}</Text>
            <View style={styles.zoneLine} />
          </View>
        ))}
      </Animated.View>

      <View style={styles.spacer} />

      <Animated.View entering={FadeInUp.delay(560).duration(500)} style={styles.bottom}>
        <GlassButton
          title="See How It Works"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/name');
          }}
          variant="primary"
          style={styles.cta}
        />
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.beige,
    paddingHorizontal: 28,
  },
  scoreDecor: {
    position: 'absolute',
    top: -8,
    right: -20,
    fontFamily: tokens.fonts.serif,
    fontSize: 220,
    fontWeight: '400',
    color: 'rgba(232,57,154,0.06)',
    lineHeight: 220,
  },
  eyebrowRow: { marginBottom: 28 },
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11, fontWeight: '600',
    letterSpacing: 3, textTransform: 'uppercase',
    color: tokens.colors.pinkDeep,
  },
  headlineBlock: { marginBottom: 20 },
  headline: {
    fontFamily: tokens.fonts.serif,
    fontSize: 36, fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 48,
  },
  body: { marginBottom: 28 },
  bodyText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15, fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 24,
  },
  zones: { gap: 10 },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  zoneDot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: tokens.colors.pinkDeep, flexShrink: 0,
  },
  zoneLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13, fontWeight: '500',
    color: tokens.colors.text, letterSpacing: 0.1,
  },
  zoneLine: { flex: 1, height: 1, backgroundColor: tokens.colors.border },
  spacer: { flex: 1, minHeight: 24 },
  bottom: { alignItems: 'center', gap: 12 },
  cta: { width: '100%' },
  footnote: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: tokens.colors.grayLight,
    letterSpacing: 0.2,
  },
});
