import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { ScoreRing } from '@/components/score-ring';
import * as Haptics from 'expo-haptics';

const MOCK_CATEGORIES = [
  { name: 'Blending', score: 73, isPriority: true, tip: 'Your blend drops off at the left temple — start 2cm higher and use smaller circles near the edge.', tipShort: 'Start your blend 2cm higher on the temple.', tutorialQuery: 'eyeshadow blending technique tutorial' },
  { name: 'Colour Harmony', score: 91, isPriority: false, tip: 'Your warm undertones pair well with the shades you chose today.', tipShort: 'Great tone match today.', tutorialQuery: 'colour harmony makeup tutorial' },
  { name: 'Brow Framing', score: 88, isPriority: false, tip: 'Right brow arch sits 2mm higher — mirror both sides for symmetry.', tipShort: 'Match the arch height on both sides.', tutorialQuery: 'brow shaping tutorial' },
  { name: 'Coverage', score: 79, isPriority: false, tip: 'Light patchiness under the left eye — one extra press with a damp sponge will fix it.', tipShort: 'One extra press under the eye.', tutorialQuery: 'foundation coverage tutorial' },
];

const CATEGORY_ICONS: Record<string, string> = {
  Blending: '✦',
  Symmetry: '◈',
  'Colour Harmony': '◉',
  Coverage: '▣',
  Cleanliness: '◌',
  'Brow Framing': '⌒',
};

function ScoreBar({ score, isPriority }: { score: number; isPriority: boolean }) {
  return (
    <View style={styles.barTrack}>
      <View
        style={[
          styles.barFill,
          { width: `${score}%` as `${number}%` },
          isPriority && styles.barFillPriority,
          score < 65 && styles.barFillLow,
        ]}
      />
    </View>
  );
}

export default function ValueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const priorityCat = MOCK_CATEGORIES.find(c => c.isPriority)!;
  const otherCats = MOCK_CATEGORIES.filter(c => !c.isPriority);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mirror the results top bar */}
        <View style={styles.topBar}>
          <View style={styles.backBtn}>
            <Text style={styles.backIcon}>◈</Text>
          </View>
          <Text style={styles.brand}>REMAKE</Text>
          <View style={{ width: 34 }} />
        </View>

        {/* Score hero — identical to results page */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.hero}>
          <ScoreRing score={79} visible />
          <View style={styles.heroMeta}>
            <View style={[styles.verdictBadge, styles.verdictGo]}>
              <Text style={[styles.verdictText, styles.verdictTextGo]}>✓ GO</Text>
            </View>
            <Text style={styles.occasionTag}>Polished for everyday</Text>
          </View>
        </Animated.View>

        {/* Colour harmony banner */}
        <Animated.View entering={FadeIn.delay(350).duration(400)} style={[styles.harmonyBanner, styles.harmonyGood]}>
          <Text style={styles.harmonyIcon}>◉</Text>
          <Text style={[styles.harmonyText, styles.harmonyTextGood]}>Great tone match today.</Text>
        </Animated.View>

        {/* Focus card — YOUR NEXT WIN */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.focusCard}>
          <View style={styles.focusLabel}>
            <Text style={styles.focusLabelText}>YOUR NEXT WIN</Text>
          </View>
          <View style={styles.cardHeader}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardIcon}>{CATEGORY_ICONS[priorityCat.name]}</Text>
              <Text style={styles.cardName}>{priorityCat.name}</Text>
            </View>
            <Text style={[styles.cardScore, { color: '#B94040' }]}>{priorityCat.score}</Text>
          </View>
          <ScoreBar score={priorityCat.score} isPriority />
          <Text style={styles.focusWinIntro}>You're this close — one small tweak here will make the biggest difference:</Text>
          <Text style={styles.focusTip}>{priorityCat.tip}</Text>
          <View style={styles.proLock}>
            <Text style={styles.proLockText}>Upgrade for detailed coaching + tutorial</Text>
          </View>
        </Animated.View>

        {/* All categories */}
        <Animated.View entering={FadeIn.delay(350).duration(300)}>
          <Text style={styles.sectionLabel}>All Categories</Text>
        </Animated.View>

        {otherCats.map((cat, i) => (
          <Animated.View key={cat.name} entering={FadeInUp.delay(380 + i * 70).duration(350)} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardIcon}>{CATEGORY_ICONS[cat.name]}</Text>
                <Text style={styles.cardName}>{cat.name}</Text>
              </View>
              <Text style={[styles.cardScore, { color: cat.score >= 80 ? '#2D7D46' : cat.score >= 65 ? tokens.colors.gold : '#B94040' }]}>
                {cat.score}
              </Text>
            </View>
            <ScoreBar score={cat.score} isPriority={false} />
            <Text style={styles.cardTip}>{cat.tipShort}</Text>
            <View style={styles.proLock}>
              <Text style={styles.proLockText}>Upgrade for detailed coaching + tutorial</Text>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Fixed CTA overlay at bottom — like a paywall lock */}
      <Animated.View entering={FadeIn.delay(800).duration(400)} style={[styles.ctaOverlay, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.ctaEyebrow}>Your results are waiting.</Text>
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.88 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/name');
          }}
        >
          <Text style={styles.ctaText}>Get my free analysis  →</Text>
        </Pressable>
        <Text style={styles.ctaHint}>Takes 2 minutes · No account needed yet</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.white },
  content: { paddingHorizontal: 20 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 4,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: tokens.colors.cream,
    borderWidth: 1, borderColor: tokens.colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 14, color: tokens.colors.pinkDeep },
  brand: {
    fontFamily: tokens.fonts.serif, fontSize: 18, fontWeight: '400',
    letterSpacing: 0.12, color: tokens.colors.text,
  },

  hero: { alignItems: 'center', paddingTop: 20, paddingBottom: 8 },
  heroMeta: { alignItems: 'center', gap: 10, marginTop: 16 },

  verdictBadge: { paddingHorizontal: 20, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  verdictGo: { backgroundColor: '#EBF7EE', borderColor: '#2D7D46' },
  verdictText: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },
  verdictTextGo: { color: '#2D7D46' },
  occasionTag: { fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.grayLight },

  harmonyBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderLeftWidth: 3, borderWidth: 0, marginBottom: 14,
  },
  harmonyGood: { backgroundColor: '#F0FAF3', borderLeftColor: '#2D7D46' },
  harmonyIcon: { fontSize: 12, marginTop: 2 },
  harmonyText: { fontFamily: tokens.fonts.regular, fontSize: 12.5, lineHeight: 19, flex: 1 },
  harmonyTextGood: { color: '#2D7D46' },

  focusCard: {
    backgroundColor: tokens.colors.white, borderRadius: 18, padding: 20,
    borderWidth: 1.5, borderColor: tokens.colors.pinkDeep,
    marginBottom: 16, gap: 10,
    shadowColor: tokens.colors.pinkDeep, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
  },
  focusLabel: {
    alignSelf: 'flex-start', backgroundColor: tokens.colors.blush,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 2,
  },
  focusLabelText: {
    fontFamily: tokens.fonts.regular, fontSize: 9, fontWeight: '700',
    color: tokens.colors.pinkDeep, letterSpacing: 1.2,
  },
  focusWinIntro: {
    fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.gray,
    lineHeight: 18, fontStyle: 'italic',
  },
  focusTip: {
    fontFamily: tokens.fonts.regular, fontSize: 13.5, color: tokens.colors.text, lineHeight: 22,
  },

  sectionLabel: {
    fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '600', letterSpacing: 1.8,
    textTransform: 'uppercase', color: tokens.colors.grayLight,
    marginTop: 4, marginBottom: 12,
  },
  card: {
    backgroundColor: tokens.colors.white, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: tokens.colors.border,
    marginBottom: 10, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIcon: { fontSize: 14, color: tokens.colors.pinkDeep },
  cardName: { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '600', color: tokens.colors.text },
  cardScore: { fontFamily: tokens.fonts.regular, fontSize: 22, fontWeight: '700' },
  barTrack: { height: 4, borderRadius: 2, backgroundColor: tokens.colors.border, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2, backgroundColor: tokens.colors.pinkDeep },
  barFillPriority: { backgroundColor: tokens.colors.pinkRich },
  barFillLow: { backgroundColor: '#C44' },
  cardTip: { fontFamily: tokens.fonts.regular, fontSize: 13, color: tokens.colors.text, lineHeight: 20 },
  proLock: { backgroundColor: tokens.colors.cream, borderRadius: 8, padding: 10 },
  proLockText: { fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.gray, textAlign: 'center' },

  // Fixed CTA overlay
  ctaOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 20, gap: 10, alignItems: 'center',
    backgroundColor: tokens.colors.white,
    borderTopWidth: 1, borderTopColor: tokens.colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06, shadowRadius: 12,
  },
  ctaEyebrow: {
    fontFamily: tokens.fonts.serif, fontSize: 14, fontStyle: 'italic',
    color: tokens.colors.gray,
  },
  cta: {
    width: '100%', backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 30, paddingVertical: 18, alignItems: 'center',
  },
  ctaText: {
    fontFamily: tokens.fonts.regular, fontSize: 16, fontWeight: '700',
    color: tokens.colors.white,
  },
  ctaHint: {
    fontFamily: tokens.fonts.regular, fontSize: 11,
    color: tokens.colors.grayLight,
  },
});
