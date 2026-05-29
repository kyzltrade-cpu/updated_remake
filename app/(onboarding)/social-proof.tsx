import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import { MarketingNav } from '@/components/marketing-nav';

const STATS = [
  { value: '★ 4.9', label: 'Beta rating' },
  { value: '2,400+', label: 'Scans run' },
  { value: '18 days', label: 'Avg. streak' },
];

const TESTIMONIALS = [
  {
    name: 'Ava M.',
    initial: 'A',
    avatarColor: '#D4A096',
    text: '"My contour looked perfect in selfies but terrible in daylight. REMAKE showed me exactly where the blend was off."',
  },
  {
    name: 'Sofia R.',
    initial: 'S',
    avatarColor: '#B8A8C8',
    text: '"The eye score caught that my liner was asymmetric before I even noticed. Game changer."',
  },
  {
    name: 'Priya K.',
    initial: 'P',
    avatarColor: '#A8C4B0',
    text: '"Three weeks in, my streak is 21 days. I actually look forward to my morning scan."',
  },
];

export default function SocialProofScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 40 }]}>
      <MarketingNav step={2} onBack={() => router.back()} />

      <Animated.View entering={FadeInUp.delay(80).duration(600)} style={styles.header}>
        <Text style={styles.eyebrow}>Early Users</Text>
        <Text style={styles.title}>Women already{'\n'}seeing it.</Text>
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.statsRow}>
        {STATS.map((s, i) => (
          <View key={s.label} style={styles.statCol}>
            {i > 0 && <View style={styles.statDivider} />}
            <View style={styles.stat}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          </View>
        ))}
      </Animated.View>

      {/* Testimonials */}
      <View style={styles.testimonials}>
        {TESTIMONIALS.map((t, i) => (
          <Animated.View key={t.name} entering={FadeInUp.delay(300 + i * 90).duration(450)}>
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: t.avatarColor }]}>
                  <Text style={styles.avatarInitial}>{t.initial}</Text>
                </View>
                <View style={styles.meta}>
                  <Text style={styles.name}>{t.name}</Text>
                  <Text style={styles.stars}>★★★★★</Text>
                </View>
                <View style={styles.verified}>
                  <View style={styles.verifiedDot} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>
              <Text style={styles.quote}>{t.text}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <View style={styles.spacer} />

      <Animated.View entering={FadeInUp.delay(580).duration(500)} style={styles.bottom}>
        <GlassButton
          title="Build My Profile"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/goal-selection');
          }}
          variant="primary"
          style={styles.cta}
        />
        <Text style={styles.footnote}>Takes about 2 minutes</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.cream,
    paddingHorizontal: 28,
  },
  header: { marginBottom: 20 },
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: tokens.colors.pinkDeep,
    marginBottom: 12,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 34,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 44,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: 18,
    overflow: 'hidden',
  },
  statCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: tokens.colors.border },
  statValue: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  statLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    color: tokens.colors.grayLight,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  testimonials: { gap: 10 },
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarInitial: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.white,
  },
  meta: { flex: 1, gap: 2 },
  name: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.text,
  },
  stars: { fontSize: 10, color: tokens.colors.gold, letterSpacing: 1 },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
  },
  verifiedText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    color: tokens.colors.grayLight,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  quote: {
    fontFamily: tokens.fonts.serif,
    fontSize: 13,
    fontStyle: 'italic',
    color: tokens.colors.text,
    lineHeight: 20,
  },
  spacer: { flex: 1, minHeight: 12 },
  bottom: { alignItems: 'center', gap: 10 },
  cta: { width: '100%' },
  footnote: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: tokens.colors.grayLight,
  },
});
