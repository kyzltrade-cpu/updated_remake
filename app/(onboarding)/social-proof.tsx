import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';

function MarketingNav({ step, onBack }: { step: number; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[nav.container, { paddingTop: insets.top + 10 }]}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={8} style={nav.backBtn}>
          <Text style={nav.backIcon}>‹</Text>
        </Pressable>
      ) : (
        <View style={nav.placeholder} />
      )}
      <View style={nav.dotsRow}>
        {[1, 2, 3].map(i => (
          <View
            key={i}
            style={[
              nav.dot,
              i < step  && nav.dotPast,
              i === step && nav.dotActive,
              i > step  && nav.dotFuture,
            ]}
          />
        ))}
      </View>
      <View style={nav.placeholder} />
    </View>
  );
}

const nav = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  placeholder: { width: 36, height: 36 },
  backIcon: { fontSize: 28, color: tokens.colors.grayLight, lineHeight: 32, includeFontPadding: false },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  dotActive: { width: 20, backgroundColor: tokens.colors.pinkDeep },
  dotPast: { backgroundColor: tokens.colors.pinkDeep, opacity: 0.38 },
  dotFuture: { backgroundColor: tokens.colors.border },
});

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

      <MarketingNav step={3} onBack={() => router.back()} />

      {/* Header */}
      <Animated.View entering={FadeInUp.delay(80).duration(600)} style={styles.header}>
        <Text style={styles.eyebrow}>Real Results</Text>
        <Text style={styles.title}>Women who{'\n'}already see it.</Text>
      </Animated.View>

      {/* Stats strip */}
      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>★ 4.8</Text>
          <Text style={styles.statLabel}>App Store</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>12k+</Text>
          <Text style={styles.statLabel}>Analyses done</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>21 days</Text>
          <Text style={styles.statLabel}>Avg. streak</Text>
        </View>
      </Animated.View>

      {/* Testimonials */}
      <View style={styles.testimonials}>
        {TESTIMONIALS.map((t, i) => (
          <Animated.View key={t.name} entering={FadeInUp.delay(300 + i * 100).duration(500)}>
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: t.avatarColor }]}>
                  <Text style={styles.avatarInitial}>{t.initial}</Text>
                </View>
                <View style={styles.meta}>
                  <Text style={styles.name}>{t.name}</Text>
                  <Text style={styles.stars}>★★★★★</Text>
                </View>
                <Text style={styles.verified}>Verified</Text>
              </View>
              <Text style={styles.quote}>{t.text}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <View style={styles.spacer} />

      {/* CTA */}
      <Animated.View entering={FadeInUp.delay(600).duration(500)} style={styles.bottom}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/name');
          }}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Text style={styles.ctaText}>Build My Profile</Text>
        </Pressable>
        <Text style={styles.footnote}>Takes about 2 minutes</Text>
      </Animated.View>

      {/* Bottom gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(10,8,7,0.05)']}
        style={styles.bottomGlow}
        pointerEvents="none"
      />

      {/* Decorative */}
      <Animated.Text entering={FadeIn.duration(1000)} style={styles.decor}>✦</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.beige,
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
    marginBottom: 14,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 36,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 46,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: 20,
  },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  statLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    fontWeight: '400',
    color: tokens.colors.grayLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: tokens.colors.border,
  },

  testimonials: { gap: 10 },
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
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
  meta: { flex: 1, gap: 1 },
  name: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.text,
  },
  stars: { fontSize: 10, color: tokens.colors.gold, letterSpacing: 1 },
  verified: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    color: tokens.colors.grayLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quote: {
    fontFamily: tokens.fonts.serif,
    fontSize: 13,
    fontStyle: 'italic',
    color: tokens.colors.text,
    lineHeight: 21,
  },

  spacer: { flex: 1, minHeight: 20 },
  bottom: { alignItems: 'center', gap: 12 },
  cta: {
    width: '100%',
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 7,
  },
  ctaPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  ctaText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: tokens.colors.white,
  },
  footnote: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: tokens.colors.grayLight,
  },
  bottomGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  decor: {
    position: 'absolute',
    bottom: 60,
    right: 20,
    fontSize: 80,
    color: 'rgba(232,57,154,0.04)',
    pointerEvents: 'none',
  },
});
