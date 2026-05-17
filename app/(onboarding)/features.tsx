import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import * as Haptics from 'expo-haptics';

const STEP = 2;
const TOTAL = 3;

const FEATURES = [
  { icon: '◈', title: 'Four Beauty Zones', desc: 'Complexion, eyes, lips, and sculpt — each scored separately so you know exactly where to focus.' },
  { icon: '◎', title: 'Expert-Level Feedback', desc: 'Like having a professional makeup artist look over your shoulder every single morning.' },
  { icon: '◉', title: 'Daily Streak', desc: 'Scan each morning to build your streak. Consistency is how mastery actually happens.' },
  { icon: '◇', title: 'Product Scanner', desc: 'Scan any product barcode to see if it matches your skin tone, season, and beauty profile.' },
];

export default function FeaturesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(STEP / TOTAL) * 100}%` as `${number}%` }]} />
      </View>

      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={[styles.header, { paddingTop: insets.top + 28 }]}>
        <Text style={styles.eyebrow}>What REMAKE Does</Text>
        <Text style={styles.title}>Four ways it works{'\n'}for your face.</Text>
      </Animated.View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {FEATURES.map((f, i) => (
          <Animated.View key={i} entering={FadeInUp.delay(200 + i * 80).duration(500)}>
            <View style={styles.card}>
              <Text style={styles.cardIcon}>{f.icon}</Text>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{f.title}</Text>
                <Text style={styles.cardDesc}>{f.desc}</Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(560).duration(500)} style={styles.bottom}>
        <GlassButton
          title="Next"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(onboarding)/social-proof');
          }}
          variant="primary"
          style={styles.cta}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.beige, paddingHorizontal: 28 },
  track: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: tokens.colors.border },
  fill: { height: '100%', backgroundColor: tokens.colors.pinkDeep },
  header: { marginBottom: 24 },
  eyebrow: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '500', letterSpacing: 1.2, textTransform: 'uppercase', color: tokens.colors.grayLight, marginBottom: 14 },
  title: { fontFamily: tokens.fonts.serif, fontSize: 32, fontWeight: '400', color: tokens.colors.text, lineHeight: 42 },
  scroll: { flex: 1 },
  scrollContent: { gap: 12, paddingBottom: 16 },
  card: { flexDirection: 'row', gap: 16, backgroundColor: tokens.colors.white, borderRadius: 14, padding: 18, borderWidth: 1.5, borderColor: tokens.colors.border },
  cardIcon: { fontSize: 22, color: tokens.colors.pinkDeep, marginTop: 1, flexShrink: 0 },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '600', color: tokens.colors.text },
  cardDesc: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '300', color: tokens.colors.gray, lineHeight: 19 },
  bottom: { paddingTop: 16, alignItems: 'center' },
  cta: { width: '100%' },
});
