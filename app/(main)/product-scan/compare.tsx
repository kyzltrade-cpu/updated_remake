import { useEffect, useRef, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import Animated, {
  FadeIn, FadeInUp,
  useSharedValue, useAnimatedStyle,
  withTiming, withRepeat, withSequence, withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';
import { analyzeProduct, type ProductScanResult } from '@/lib/api/product-scan';
import { useSubscription } from '@/contexts/subscription-context';

const { width: SW } = Dimensions.get('window');

const COLOR_A  = tokens.colors.pinkDeep;
const COLOR_B  = tokens.colors.gold;
const CARD_PAD = 20;

// ─── Skeleton pulse ───────────────────────────────────────────────────────────

function usePulse() {
  const op = useSharedValue(0.45);
  useEffect(() => {
    op.value = withRepeat(
      withSequence(withTiming(1, { duration: 750 }), withTiming(0.45, { duration: 750 })),
      -1,
    );
  }, []);
  return op;
}

function Skel({ op, w = '100%', h, r = 8, style }: {
  op: ReturnType<typeof useSharedValue<number>>;
  w?: number | string; h: number; r?: number; style?: object;
}) {
  const anim = useAnimatedStyle(() => ({ opacity: op.value }));
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Animated.View style={[{ width: w as any, height: h, borderRadius: r, backgroundColor: '#E8DDD8' }, style, anim]} />
  );
}

function CompareSkeleton({ insetTop }: { insetTop: number }) {
  const op = usePulse();
  return (
    <View style={[s.root, { paddingTop: insetTop }]}>
      <View style={s.header}>
        <Skel op={op} w={34} h={34} r={17} />
        <Skel op={op} w={90} h={16} r={8} />
        <View style={{ width: 34 }} />
      </View>
      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: 32 }]} showsVerticalScrollIndicator={false}>
        <Skel op={op} w="100%" h={200} r={24} />
        <Skel op={op} w="100%" h={260} r={20} style={{ marginTop: 14 }} />
        <Skel op={op} w="100%" h={180} r={24} style={{ marginTop: 14 }} />
      </ScrollView>
    </View>
  );
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

type Metric = { label: string; a: number; b: number; isSpf?: boolean; maxVal?: number };

function buildMetrics(a: ProductScanResult, b: ProductScanResult): Metric[] {
  const safeScore = (p: ProductScanResult) =>
    Math.max(0, 100 - p.ingredients.filter(i => !i.safe).length * 20);
  const skinFitScore = (p: ProductScanResult) =>
    Math.round((p.skinFit.filter(i => i.ok).length / p.skinFit.length) * 100);
  const ethicsScore = (p: ProductScanResult) =>
    Math.round((p.ethics.filter(e => e.value !== 'Unknown').length / p.ethics.length) * 100);
  return [
    { label: 'Shade Match',    a: a.shade.pct,      b: b.shade.pct },
    { label: 'Skin Fit',       a: skinFitScore(a),  b: skinFitScore(b) },
    { label: 'Safety',         a: safeScore(a),     b: safeScore(b) },
    { label: 'SPF Protection', a: a.spf.level ?? 0, b: b.spf.level ?? 0, isSpf: true, maxVal: 100 },
    { label: 'Ethics',         a: ethicsScore(a),   b: ethicsScore(b) },
  ];
}

// ─── Animated metric bar ──────────────────────────────────────────────────────

const BAR_W = (SW - CARD_PAD * 2 - 40) / 2 - 60; // bar track width per side

function MetricRow({ metric, index }: { metric: Metric; index: number }) {
  const max       = metric.maxVal ?? 100;
  const aWins     = metric.isSpf ? metric.a >= 30 : metric.a > metric.b;
  const bWins     = metric.isSpf ? metric.b >= 30 : metric.b > metric.a;
  const aDisplay  = metric.isSpf ? (metric.a > 0 ? `SPF ${metric.a}` : '—') : `${metric.a}%`;
  const bDisplay  = metric.isSpf ? (metric.b > 0 ? `SPF ${metric.b}` : '—') : `${metric.b}%`;

  const aFill = useSharedValue(0);
  const bFill = useSharedValue(0);

  useEffect(() => {
    aFill.value = withDelay(300 + index * 60, withTiming(metric.a / max, { duration: 600, easing: Easing.out(Easing.cubic) }));
    bFill.value = withDelay(300 + index * 60, withTiming(metric.b / max, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, []);

  const aBarStyle = useAnimatedStyle(() => ({ width: aFill.value * BAR_W }));
  const bBarStyle = useAnimatedStyle(() => ({ width: bFill.value * BAR_W }));

  return (
    <Animated.View entering={FadeInUp.delay(280 + index * 50).duration(400)} style={s.metricRow}>
      {/* Product A — value top, bar below, bar grows rightward toward label */}
      <View style={s.metricSideA}>
        <Text style={[s.metricVal, { color: aWins ? COLOR_A : tokens.colors.grayLight }]}>
          {aDisplay}
        </Text>
        <View style={s.barTrackA}>
          <Animated.View style={[s.barFill, aBarStyle, { backgroundColor: aWins ? COLOR_A : tokens.colors.border }]} />
        </View>
      </View>

      {/* Label */}
      <Text style={s.metricLabel}>{metric.label}</Text>

      {/* Product B — mirrors A: value top, bar below, bar grows leftward toward label */}
      <View style={s.metricSideB}>
        <Text style={[s.metricVal, s.metricValRight, { color: bWins ? COLOR_B : tokens.colors.grayLight }]}>
          {bDisplay}
        </Text>
        <View style={s.barTrackB}>
          <Animated.View style={[s.barFill, bBarStyle, { backgroundColor: bWins ? COLOR_B : tokens.colors.border }]} />
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Score comparison bar ─────────────────────────────────────────────────────

function ScoreBar({ scoreA, scoreB }: { scoreA: number; scoreB: number }) {
  const total  = scoreA + scoreB || 1;
  const aFrac  = scoreA / total;

  const aW = useSharedValue(0);
  useEffect(() => {
    aW.value = withDelay(200, withTiming(aFrac, { duration: 700, easing: Easing.out(Easing.quad) }));
  }, []);
  const aStyle = useAnimatedStyle(() => ({ flex: aW.value }));
  const bStyle = useAnimatedStyle(() => ({ flex: 1 - aW.value }));

  return (
    <View style={s.scoreBarWrap}>
      <Animated.View style={[s.scoreBarA, aStyle]}>
        <LinearGradient colors={[COLOR_A, tokens.colors.pinkRich]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[s.scoreBarB, bStyle]}>
        <LinearGradient colors={[tokens.colors.goldSoft, COLOR_B]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProductCompareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPro } = useSubscription();

  useEffect(() => {
    if (!isPro) {
      router.replace('/(main)/paywall');
    }
  }, [isPro]);

  const { barcode1, barcode2, uri1, uri2, productAResult } = useLocalSearchParams<{
    barcode1?: string; barcode2?: string;
    uri1?: string; uri2?: string;
    productAResult?: string;
  }>();

  const [productA, setProductA] = useState<ProductScanResult | null>(null);
  const [productB, setProductB] = useState<ProductScanResult | null>(null);
  const [loading, setLoading]   = useState(true);
  const didLoad = useRef(false);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;

    let preloadedA: ProductScanResult | null = null;
    if (productAResult) {
      try { preloadedA = JSON.parse(productAResult as string) as ProductScanResult; } catch { /**/ }
    }

    const loadA = preloadedA
      ? Promise.resolve(preloadedA)
      : analyzeProduct({ barcode: barcode1 as string | undefined, uri: uri1 as string | undefined });
    const loadB = analyzeProduct({ barcode: barcode2 as string | undefined, uri: uri2 as string | undefined });

    Promise.all([loadA, loadB])
      .then(([a, b]) => { setProductA(a); setProductB(b); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !productA || !productB) {
    return <CompareSkeleton insetTop={insets.top} />;
  }

  const metrics     = buildMetrics(productA, productB);
  const winner      = productA.score >= productB.score ? 'A' : 'B';
  const winnerProd  = winner === 'A' ? productA : productB;
  const aWins       = metrics.filter(m => m.isSpf ? m.a >= 30 && m.b < 30 : m.a > m.b).length;
  const bWins       = metrics.filter(m => m.isSpf ? m.b >= 30 && m.a < 30 : m.b > m.a).length;
  const winnerCount = Math.max(aWins, bWins);

  const topWins = metrics
    .filter(m => winner === 'A' ? (m.isSpf ? m.a >= 30 && m.b < 30 : m.a > m.b) : (m.isSpf ? m.b >= 30 && m.a < 30 : m.b > m.a))
    .map(m => m.label.toLowerCase())
    .slice(0, 2);
  const verdictDetail = topWins.length > 0 ? `Leads in ${topWins.join(' and ')}.` : '';

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Text style={s.backIcon}>‹</Text>
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerEyebrow}>HEAD TO HEAD</Text>
          <Text style={s.headerTitle}>Compare</Text>
        </View>
        <View style={{ width: 34 }} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Duel card ── */}
        <Animated.View entering={FadeInUp.delay(80).duration(500)} style={s.duelCard}>

          {/* Score comparison bar */}
          <ScoreBar scoreA={productA.score} scoreB={productB.score} />

          {/* Product halves */}
          <View style={s.duelRow}>
            {/* Product A */}
            <View style={[s.productHalf, winner === 'A' && s.productHalfWinner]}>
              {winner === 'A' ? (
                <View style={[s.winnerBadge, { backgroundColor: `${COLOR_A}15`, borderColor: `${COLOR_A}35` }]}>
                  <Text style={[s.winnerBadgeText, { color: COLOR_A }]}>✦  Best match</Text>
                </View>
              ) : (
                <View style={[s.winnerBadge, { opacity: 0 }]}>
                  <Text style={s.winnerBadgeText}>✦  Best match</Text>
                </View>
              )}
              <Text style={[s.scoreNum, { color: COLOR_A }]}>{productA.score}</Text>
              <Text style={s.productBrand}>{productA.brand}</Text>
              <Text style={s.productName} numberOfLines={2}>{productA.productName}</Text>
              <Text style={s.productCategory}>{productA.category}</Text>
            </View>

            {/* VS pill */}
            <View style={s.vsPill}>
              <Text style={s.vsText}>VS</Text>
            </View>

            {/* Product B */}
            <View style={[s.productHalf, s.productHalfRight, winner === 'B' && s.productHalfWinner]}>
              {winner === 'B' ? (
                <View style={[s.winnerBadge, s.winnerBadgeRight, { backgroundColor: `${COLOR_B}15`, borderColor: `${COLOR_B}35` }]}>
                  <Text style={[s.winnerBadgeText, { color: COLOR_B }]}>✦  Best match</Text>
                </View>
              ) : (
                <View style={[s.winnerBadge, s.winnerBadgeRight, { opacity: 0 }]}>
                  <Text style={s.winnerBadgeText}>✦  Best match</Text>
                </View>
              )}
              <Text style={[s.scoreNum, s.textRight, { color: COLOR_B }]}>{productB.score}</Text>
              <Text style={[s.productBrand, s.textRight]}>{productB.brand}</Text>
              <Text style={[s.productName, s.textRight]} numberOfLines={2}>{productB.productName}</Text>
              <Text style={[s.productCategory, s.textRight]}>{productB.category}</Text>
            </View>
          </View>

          {/* Legend */}
          <View style={s.legend}>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: COLOR_A }]} />
              <Text style={s.legendText}>{productA.brand || 'Product A'}</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: COLOR_B }]} />
              <Text style={s.legendText}>{productB.brand || 'Product B'}</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Category breakdown ── */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={s.metricsCard}>
          <Text style={s.metricsEyebrow}>Category Breakdown</Text>

          {/* Column headers */}
          <View style={s.metricHeader}>
            <Text style={[s.metricHeaderLabel, { color: COLOR_A }]}>
              {productA.brand || 'A'}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={[s.metricHeaderLabel, { color: COLOR_B }]}>
              {productB.brand || 'B'}
            </Text>
          </View>

          {metrics.map((m, i) => (
            <View key={m.label}>
              {i > 0 && <View style={s.metricDivider} />}
              <MetricRow metric={m} index={i} />
            </View>
          ))}
        </Animated.View>

        {/* ── Verdict ── */}
        <Animated.View entering={FadeInUp.delay(460).duration(500)} style={s.verdictCard}>
          <LinearGradient
            colors={winner === 'A'
              ? [`${COLOR_A}14`, `${COLOR_A}04`]
              : [`${COLOR_B}14`, `${COLOR_B}04`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <Text style={s.verdictEyebrow}>Better pick for your skin</Text>

          <View style={s.verdictProductRow}>
            <View style={[s.verdictScoreBadge, { borderColor: winner === 'A' ? `${COLOR_A}40` : `${COLOR_B}40` }]}>
              <Text style={[s.verdictScoreNum, { color: winner === 'A' ? COLOR_A : COLOR_B }]}>
                {winnerProd.score}
              </Text>
            </View>
            <View style={s.verdictProductInfo}>
              <Text style={s.verdictBrand}>{winnerProd.brand}</Text>
              <Text style={s.verdictName} numberOfLines={2}>{winnerProd.productName}</Text>
            </View>
          </View>

          <View style={s.verdictStats}>
            <View style={[s.verdictStatPill, { backgroundColor: winner === 'A' ? `${COLOR_A}14` : `${COLOR_B}14` }]}>
              <Text style={[s.verdictStatText, { color: winner === 'A' ? COLOR_A : COLOR_B }]}>
                {winnerCount}/{metrics.length} categories
              </Text>
            </View>
            {verdictDetail ? (
              <Text style={s.verdictDetail}>{verdictDetail}</Text>
            ) : null}
          </View>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
            style={({ pressed }) => [s.doneBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={s.doneBtnText}>Done</Text>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.cream },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.07)',
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 22, color: tokens.colors.text, lineHeight: 26, includeFontPadding: false },
  headerCenter: { alignItems: 'center', gap: 2 },
  headerEyebrow: {
    fontFamily: tokens.fonts.regular, fontSize: 9, fontWeight: '700',
    letterSpacing: 2.5, textTransform: 'uppercase', color: tokens.colors.grayLight,
  },
  headerTitle: {
    fontFamily: tokens.fonts.serif, fontSize: 20, fontWeight: '400', color: tokens.colors.text,
  },

  scroll: { paddingHorizontal: CARD_PAD, paddingTop: 4, gap: 14 },

  // ── Duel card ──
  duelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)',
  },

  // Score bar at top
  scoreBarWrap: { flexDirection: 'row', height: 6 },
  scoreBarA: { height: 6 },
  scoreBarB: { height: 6 },

  duelRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14 },

  productHalf: { flex: 1, gap: 3 },
  productHalfRight: { alignItems: 'flex-end' },
  productHalfWinner: {},

  winnerBadge: {
    alignSelf: 'flex-start',
    borderRadius: 50, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 4,
    marginBottom: 8,
  },
  winnerBadgeRight: { alignSelf: 'flex-end' },
  winnerBadgeText: { fontFamily: tokens.fonts.regular, fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },

  scoreNum: {
    fontFamily: tokens.fonts.serif, fontSize: 52, fontWeight: '400',
    lineHeight: 56, letterSpacing: -1,
  },
  productBrand: {
    fontFamily: tokens.fonts.regular, fontSize: 9, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase', color: tokens.colors.grayLight, marginTop: 4,
  },
  productName: {
    fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '600',
    color: tokens.colors.text, lineHeight: 18,
  },
  productCategory: {
    fontFamily: tokens.fonts.regular, fontSize: 10,
    color: tokens.colors.grayLight, textTransform: 'capitalize', marginTop: 2,
  },
  textRight: { textAlign: 'right' },

  vsPill: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: tokens.colors.cream,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginHorizontal: 8, marginTop: 8,
  },
  vsText: {
    fontFamily: tokens.fonts.regular, fontSize: 8, fontWeight: '800',
    letterSpacing: 1.5, color: tokens.colors.grayLight,
  },

  legend: {
    flexDirection: 'row', justifyContent: 'center', gap: 24,
    paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '500', color: tokens.colors.text },

  // ── Metrics card ──
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8,
  },
  metricsEyebrow: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '700',
    letterSpacing: 1.4, textTransform: 'uppercase',
    color: tokens.colors.grayLight, marginBottom: 2,
  },
  metricHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingBottom: 10, marginBottom: 2,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  metricHeaderLabel: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '700', letterSpacing: 0.5,
  },
  metricRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, gap: 8,
  },
  metricDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.06)' },

  metricSideA: { flex: 1, alignItems: 'flex-start', gap: 5 },
  metricSideB: { flex: 1, alignItems: 'flex-end', gap: 5 },
  metricVal: { fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '700', minWidth: 44 },
  metricValRight: { textAlign: 'right' },
  metricLabel: {
    width: 80, fontFamily: tokens.fonts.regular, fontSize: 10,
    color: tokens.colors.text, textAlign: 'center', lineHeight: 14,
  },

  // Fill bars — both grow left to right
  barTrackA: { width: BAR_W, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'flex-start' },
  barTrackB: { width: BAR_W, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'flex-start' },
  barFill: { height: 4, borderRadius: 2 },

  // ── Verdict card ──
  verdictCard: {
    borderRadius: 24, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)',
    padding: 22, gap: 16,
    backgroundColor: '#FFFFFF',
  },
  verdictEyebrow: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '700',
    letterSpacing: 2, textTransform: 'uppercase', color: tokens.colors.pinkDeep,
  },
  verdictProductRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  verdictScoreBadge: {
    width: 56, height: 56, borderRadius: 16,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  verdictScoreNum: {
    fontFamily: tokens.fonts.serif, fontSize: 24, fontWeight: '400',
  },
  verdictProductInfo: { flex: 1, gap: 3 },
  verdictBrand: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase', color: tokens.colors.grayLight,
  },
  verdictName: {
    fontFamily: tokens.fonts.serif, fontSize: 20, fontWeight: '400',
    color: tokens.colors.text, lineHeight: 26,
  },
  verdictStats: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  verdictStatPill: {
    borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6,
  },
  verdictStatText: {
    fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '700',
  },
  verdictDetail: {
    fontFamily: tokens.fonts.regular, fontSize: 13,
    color: tokens.colors.gray, lineHeight: 19, flex: 1,
  },
  doneBtn: {
    backgroundColor: tokens.colors.pinkDeep, borderRadius: 50,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  doneBtnText: {
    fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '700',
    color: '#FFFFFF', letterSpacing: 0.5,
  },
});
