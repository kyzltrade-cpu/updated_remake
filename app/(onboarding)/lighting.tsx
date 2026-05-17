import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import * as Haptics from 'expo-haptics';

const TIPS = [
  { num: '1', head: 'Face the window', desc: 'Natural light in front of you — never behind. It flattens features and skews your colour read.' },
  { num: '2', head: 'Pull hair back', desc: 'Every face boundary matters for an accurate shape map. Show every edge.' },
  { num: '3', head: 'Remove glasses', desc: 'Frames break symmetry and depth analysis. Bare eyes give the cleanest read.' },
];

export default function LightingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 32 }]}>

      <Animated.View entering={FadeInUp.delay(80).duration(500)} style={styles.header}>
        <Text style={styles.eyebrow}>Before you scan</Text>
        <Text style={styles.title}>Three quick things{'\n'}for best results.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.cards}>
        {TIPS.map((tip, i) => (
          <Animated.View key={tip.num} entering={FadeInUp.delay(200 + i * 70).duration(400)}>
            <View style={styles.card}>
              <View style={styles.badge}>
                <Text style={styles.badgeNum}>{tip.num}</Text>
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardHead}>{tip.head}</Text>
                <Text style={styles.cardDesc}>{tip.desc}</Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </Animated.View>

      <View style={styles.spacer} />

      <Animated.View entering={FadeInUp.delay(440).duration(500)} style={styles.bottom}>
        <GlassButton
          title="I'm ready"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/first-scan');
          }}
          variant="primary"
          style={styles.cta}
        />
        <Text style={styles.note}>Takes about 3 seconds</Text>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.beige, paddingHorizontal: 28 },
  header: { marginBottom: 32 },
  eyebrow: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '500', letterSpacing: 1.2, textTransform: 'uppercase', color: tokens.colors.grayLight, marginBottom: 14 },
  title: { fontFamily: tokens.fonts.serif, fontSize: 32, fontWeight: '400', color: tokens.colors.text, lineHeight: 42 },
  cards: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, backgroundColor: tokens.colors.white, borderRadius: 14, paddingVertical: 18, paddingHorizontal: 18, borderWidth: 1.5, borderColor: tokens.colors.border },
  badge: { width: 32, height: 32, borderRadius: 10, backgroundColor: tokens.colors.blush, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1 },
  badgeNum: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '700', color: tokens.colors.pinkDeep },
  cardText: { flex: 1, gap: 4 },
  cardHead: { fontFamily: tokens.fonts.regular, fontSize: 16, fontWeight: '600', color: tokens.colors.text },
  cardDesc: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '300', color: tokens.colors.gray, lineHeight: 20 },
  spacer: { flex: 1, minHeight: 32 },
  bottom: { alignItems: 'center', gap: 12 },
  cta: { width: '100%' },
  note: { fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.grayLight, letterSpacing: 0.2 },
});
