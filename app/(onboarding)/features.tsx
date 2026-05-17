import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import { OnboardingPagination } from '@/components/onboarding-pagination';
import * as Haptics from 'expo-haptics';

const FEATURES = [
  { icon: '◈', title: 'Four Beauty Zones', desc: 'Complexion, eyes, lips, and sculpt — each scored separately so you know exactly where to focus.' },
  { icon: '◎', title: 'Expert-Level Feedback', desc: 'Like having a professional makeup artist look over your shoulder every single morning.' },
  { icon: '◉', title: 'Daily Streak', desc: 'Scan each morning to build your streak. Consistency is how mastery actually happens.' },
  { icon: '◇', title: 'Product Scanner', desc: 'Scan any product barcode to see if it matches your skin tone, season, and beauty profile.' },
];

export default function FeaturesScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
        <Text style={styles.tag}>What REMAKE Does</Text>
      </Animated.View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {FEATURES.map((f, i) => (
          <Animated.View key={i} entering={FadeInUp.delay(200 + i * 100).duration(600)} style={styles.card}>
            <Text style={styles.cardIcon}>{f.icon}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{f.title}</Text>
              <Text style={styles.cardDesc}>{f.desc}</Text>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.bottom}>
        <GlassButton
          title="Next"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(onboarding)/social-proof');
          }}
          variant="primary"
          style={styles.cta}
        />
        <OnboardingPagination total={3} current={2} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.beige, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 50 },
  header: { alignItems: 'center', marginBottom: 30 },
  tag: { fontFamily: tokens.fonts.regular, fontSize: 11, letterSpacing: 0.16, textTransform: 'uppercase', color: tokens.colors.gray, fontWeight: '500' },
  scroll: { flex: 1 },
  scrollContent: { gap: 16, paddingBottom: 20 },
  card: { flexDirection: 'row', gap: 16, backgroundColor: tokens.colors.white, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: tokens.colors.border },
  cardIcon: { fontSize: 24, color: tokens.colors.pinkDeep, marginTop: 2 },
  cardText: { flex: 1 },
  cardTitle: { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '500', color: tokens.colors.text, marginBottom: 6 },
  cardDesc: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '300', color: tokens.colors.gray, lineHeight: 19 },
  bottom: { alignItems: 'center', gap: 24, paddingTop: 20 },
  cta: { width: '100%' },
});
