import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';

const FEATURES = [
  {
    num: '01',
    title: 'Beauty DNA',
    desc: 'Face shape, undertone, colour season, archetype — your complete beauty blueprint.',
  },
  {
    num: '02',
    title: 'Four-Zone Scoring',
    desc: 'Complexion, eyes, lips, and sculpt — each scored so you know exactly where to focus.',
  },
  {
    num: '03',
    title: 'Expert Coaching',
    desc: 'Specific, actionable feedback for your exact features — not generic tips.',
  },
  {
    num: '04',
    title: 'Product Scanner',
    desc: 'Scan any barcode. See if the shade and formula actually match your skin.',
  },
  {
    num: '05',
    title: 'Side-by-Side Compare',
    desc: 'Stack two products against each other. See which one suits you — no guessing.',
  },
];

// 3-dot nav indicator for the 3 marketing screens
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

export default function FeaturesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 28 }]}>

      <MarketingNav step={2} onBack={() => router.back()} />

      {/* Header */}
      <Animated.View entering={FadeInUp.delay(80).duration(600)} style={styles.header}>
        <Text style={styles.eyebrow}>What REMAKE Does</Text>
        <Text style={styles.title}>Five things{'\n'}working for you.</Text>
      </Animated.View>

      {/* Feature list */}
      <View style={styles.list}>
        {FEATURES.map((f, i) => (
          <Animated.View key={f.num} entering={FadeInUp.delay(180 + i * 80).duration(500)}>
            <View style={styles.item}>
              <Text style={styles.itemNum}>{f.num}</Text>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{f.title}</Text>
                <Text style={styles.itemDesc}>{f.desc}</Text>
              </View>
            </View>
            {i < FEATURES.length - 1 && <View style={styles.divider} />}
          </Animated.View>
        ))}
      </View>

      <View style={styles.spacer} />

      {/* CTA */}
      <Animated.View entering={FadeInUp.delay(580).duration(500)} style={styles.bottom}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(onboarding)/social-proof');
          }}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Text style={styles.ctaText}>See What Users Say</Text>
        </Pressable>
      </Animated.View>

      <LinearGradient
        colors={['transparent', 'rgba(10,8,7,0.05)']}
        style={styles.bottomGlow}
        pointerEvents="none"
      />

      <Animated.Text entering={FadeIn.duration(900)} style={styles.decor}>05</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.beige,
    paddingHorizontal: 28,
  },
  header: { marginBottom: 16 },
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
    fontSize: 32,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 42,
  },
  list: {},
  item: {
    flexDirection: 'row',
    gap: 18,
    paddingVertical: 11,
    alignItems: 'flex-start',
  },
  itemNum: {
    fontFamily: tokens.fonts.serif,
    fontSize: 13,
    fontWeight: '400',
    color: tokens.colors.pinkDeep,
    opacity: 0.7,
    width: 24,
    marginTop: 2,
    flexShrink: 0,
  },
  itemBody: { flex: 1, gap: 4 },
  itemTitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '600',
    color: tokens.colors.text,
  },
  itemDesc: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.border,
    marginLeft: 42,
  },
  spacer: { flex: 1, minHeight: 8 },
  bottom: { alignItems: 'center' },
  cta: {
    width: '100%',
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  bottomGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  decor: {
    position: 'absolute',
    bottom: -40,
    right: -14,
    fontFamily: tokens.fonts.serif,
    fontSize: 180,
    fontWeight: '400',
    color: 'rgba(232,57,154,0.04)',
    lineHeight: 200,
    pointerEvents: 'none',
  },
});
