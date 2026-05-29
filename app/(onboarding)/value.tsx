import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';

const PILLS = [
  { label: 'Shade Match',      color: tokens.colors.pinkDeep },
  { label: 'Ingredient Safety', color: tokens.colors.pinkRich },
  { label: 'Skin Fit Score',   color: tokens.colors.gold },
  { label: 'Allergen Alert',   color: tokens.colors.pinkDeep },
  { label: 'Beauty DNA',       color: tokens.colors.pinkRich },
  { label: 'Colour Season',    color: tokens.colors.gold },
  { label: 'Archetype',        color: tokens.colors.pinkDeep },
  { label: 'Product Kit',      color: tokens.colors.pinkRich },
];

const STATS = [
  { value: '★ 4.9', label: 'Beta rating' },
  { value: '2,400+', label: 'Scans run' },
  { value: '18 days', label: 'Avg. streak' },
];

export default function ValueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 40 }]}>
      {/* Decorative background number */}
      <Animated.Text entering={FadeIn.duration(900)} style={styles.decor} pointerEvents="none">
        97
      </Animated.Text>

      {/* Eyebrow */}
      <Animated.View entering={FadeInUp.delay(80).duration(600)}>
        <Text style={styles.eyebrow}>REMAKE</Text>
      </Animated.View>

      {/* Headline */}
      <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.headlineBlock}>
        <Text style={styles.headline}>
          Scan any beauty{'\n'}product. Know if{'\n'}it's right for you.
        </Text>
      </Animated.View>

      {/* Subline */}
      <Animated.View entering={FadeInUp.delay(320).duration(500)}>
        <Text style={styles.sub}>
          Ingredients, shade match, allergen check — in seconds.
        </Text>
      </Animated.View>

      {/* Feature pill strip */}
      <Animated.View entering={FadeInUp.delay(420).duration(500)} style={styles.pillsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {PILLS.map(pill => (
            <View key={pill.label} style={[styles.pill, { borderColor: pill.color + '44' }]}>
              <View style={[styles.pillDot, { backgroundColor: pill.color }]} />
              <Text style={styles.pillLabel}>{pill.label}</Text>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Stats strip */}
      <Animated.View entering={FadeInUp.delay(480).duration(500)} style={styles.statsRow}>
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

      <View style={styles.spacer} />

      {/* CTA */}
      <Animated.View entering={FadeInUp.delay(540).duration(500)} style={styles.bottom}>
        <GlassButton
          title="Get Started — It's Free"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/features');
          }}
          variant="primary"
          style={styles.cta}
        />
        <Text style={styles.footnote}>No card required</Text>
      </Animated.View>

      <LinearGradient
        colors={['transparent', 'rgba(10,8,7,0.05)']}
        style={styles.bottomGlow}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.cream,
    paddingHorizontal: 28,
  },
  decor: {
    position: 'absolute',
    top: -10,
    right: -24,
    fontFamily: tokens.fonts.serif,
    fontSize: 220,
    fontWeight: '400',
    color: 'rgba(232,57,154,0.045)',
    lineHeight: 220,
  },
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    color: tokens.colors.pinkDeep,
    marginBottom: 24,
  },
  headlineBlock: { marginBottom: 14 },
  headline: {
    fontFamily: tokens.fonts.serif,
    fontSize: 38,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 50,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 22,
    marginBottom: 24,
  },
  pillsWrap: { marginHorizontal: -28, marginBottom: 20 },
  pillsRow: {
    paddingHorizontal: 28,
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: tokens.colors.white,
    borderRadius: 50,
    borderWidth: 1,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '500',
    color: tokens.colors.text,
    letterSpacing: 0.1,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    overflow: 'hidden',
  },
  statCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: tokens.colors.border,
  },
  statValue: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  statLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    fontWeight: '400',
    color: tokens.colors.grayLight,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  spacer: { flex: 1, minHeight: 16 },
  bottom: { alignItems: 'center', gap: 12 },
  cta: { width: '100%' },
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
});
