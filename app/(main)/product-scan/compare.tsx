import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';
import { analyzeProduct, type ProductScanResult } from '@/lib/api/product-scan';

const COLOR_A = tokens.colors.pinkDeep;
const COLOR_B = tokens.colors.gold;

type Metric = { label: string; a: number; b: number; isSpf?: boolean };

function buildMetrics(a: ProductScanResult, b: ProductScanResult): Metric[] {
  const safeScore = (p: ProductScanResult) => {
    const flagged = p.ingredients.filter(i => !i.safe).length;
    return Math.max(0, 100 - flagged * 20);
  };
  const skinFitScore = (p: ProductScanResult) => {
    const ok = p.skinFit.filter(i => i.ok).length;
    return Math.round((ok / p.skinFit.length) * 100);
  };
  const ethicsScore = (p: ProductScanResult) => {
    const certs = p.ethics.filter(e => e.value !== 'Unknown').length;
    return Math.round((certs / p.ethics.length) * 100);
  };

  return [
    { label: 'Shade Match',    a: a.shade.pct,        b: b.shade.pct },
    { label: 'Skin Fit',       a: skinFitScore(a),    b: skinFitScore(b) },
    { label: 'Safety',         a: safeScore(a),       b: safeScore(b) },
    { label: 'SPF Protection', a: a.spf.level ?? 0,   b: b.spf.level ?? 0, isSpf: true },
    { label: 'Ethics',         a: ethicsScore(a),     b: ethicsScore(b) },
  ];
}

function MetricRow({ metric, index }: { metric: Metric; index: number }) {
  const aWins = metric.isSpf ? metric.a >= 30 : metric.a > metric.b;
  const bWins = metric.isSpf ? metric.b >= 30 : metric.b > metric.a;
  const aDisplay = metric.isSpf ? (metric.a > 0 ? `SPF ${metric.a}` : 'None') : `${metric.a}%`;
  const bDisplay = metric.isSpf ? (metric.b > 0 ? `SPF ${metric.b}` : 'None') : `${metric.b}%`;

  return (
    <Animated.View entering={FadeInUp.delay(300 + index * 55).duration(400)} style={s.metricRow}>
      <Text style={[s.metricVal, { color: aWins ? COLOR_A : tokens.colors.grayLight }]}>{aDisplay}</Text>
      <Text style={s.metricLabel}>{metric.label}</Text>
      <Text style={[s.metricVal, s.metricValRight, { color: bWins ? COLOR_B : tokens.colors.grayLight }]}>{bDisplay}</Text>
    </Animated.View>
  );
}

export default function ProductCompareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { barcode1, barcode2, uri1, uri2 } = useLocalSearchParams<{
    barcode1?: string; barcode2?: string; uri1?: string; uri2?: string;
  }>();

  const [productA, setProductA] = useState<ProductScanResult | null>(null);
  const [productB, setProductB] = useState<ProductScanResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyzeProduct({ barcode: barcode1, uri: uri1 }),
      analyzeProduct({ barcode: barcode2, uri: uri2 }),
    ]).then(([a, b]) => {
      setProductA(a);
      setProductB(b);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading || !productA || !productB) {
    return (
      <View style={[s.root, s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={tokens.colors.pinkDeep} />
        <Text style={s.loadingText}>Comparing products…</Text>
      </View>
    );
  }

  const metrics = buildMetrics(productA, productB);
  const winner = productA.score >= productB.score ? 'A' : 'B';
  const winnerProduct = winner === 'A' ? productA : productB;
  const aWinsCount = metrics.filter(m => m.isSpf ? (m.a >= 30 && m.b < 30) : m.a > m.b).length;
  const bWinsCount = metrics.filter(m => m.isSpf ? (m.b >= 30 && m.a < 30) : m.b > m.a).length;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      <Animated.View entering={FadeIn.duration(300)} style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backIcon}>‹</Text>
        </Pressable>
        <Text style={s.headerTitle}>Compare</Text>
        <View style={{ width: 34 }} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Product duel */}
        <Animated.View entering={FadeInUp.delay(80).duration(500)} style={s.duel}>

          <View style={[s.productHalf, winner === 'A' && { backgroundColor: `${COLOR_A}0D` }]}>
            <Text style={s.productBrand}>{productA.brand}</Text>
            <Text style={s.productName}>{productA.productName}</Text>
            <Text style={s.productCategory}>{productA.category}</Text>
            <Text style={[s.productScore, { color: COLOR_A }]}>{productA.score}</Text>
            <View style={[s.winBadge, { backgroundColor: `${COLOR_A}14`, borderColor: `${COLOR_A}30` }, winner !== 'A' && s.winBadgeHidden]}>
              <Text style={[s.winBadgeText, { color: COLOR_A }]}>Best match</Text>
            </View>
          </View>

          <View style={s.vsSep} pointerEvents="none">
            <Text style={s.vsText}>VS</Text>
          </View>

          <View style={[s.productHalf, s.productHalfRight, winner === 'B' && { backgroundColor: `${COLOR_B}0D` }]}>
            <Text style={[s.productBrand, s.textRight]}>{productB.brand}</Text>
            <Text style={[s.productName, s.textRight]}>{productB.productName}</Text>
            <Text style={[s.productCategory, s.textRight]}>{productB.category}</Text>
            <Text style={[s.productScore, s.textRight, { color: COLOR_B }]}>{productB.score}</Text>
            <View style={[s.winBadge, s.winBadgeRight, { backgroundColor: `${COLOR_B}14`, borderColor: `${COLOR_B}30` }, winner !== 'B' && s.winBadgeHidden]}>
              <Text style={[s.winBadgeText, { color: COLOR_B }]}>Best match</Text>
            </View>
          </View>

        </Animated.View>

        {/* Legend */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={s.legend}>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: COLOR_A }]} />
            <Text style={s.legendText}>{productA.brand}</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: COLOR_B }]} />
            <Text style={s.legendText}>{productB.brand}</Text>
          </View>
        </Animated.View>

        {/* Breakdown */}
        <View style={s.metricsCard}>
          <Text style={s.metricsTitle}>Category Breakdown</Text>
          {metrics.map((m, i) => (
            <View key={m.label}>
              {i > 0 && <View style={s.metricDivider} />}
              <MetricRow metric={m} index={i} />
            </View>
          ))}
        </View>

        {/* Verdict */}
        <Animated.View entering={FadeInUp.delay(620).duration(500)} style={s.verdict}>
          <Text style={s.verdictEyebrow}>The better pick for your skin</Text>
          <Text style={s.verdictBrand}>{winnerProduct.brand}</Text>
          <Text style={s.verdictName}>{winnerProduct.productName}</Text>
          <Text style={s.verdictReason}>
            Wins {Math.max(aWinsCount, bWinsCount)} of {metrics.length} categories for your skin profile.
            {winner === 'A'
              ? ' Stronger shade accuracy and ethics score.'
              : ' Better SPF protection and safety profile.'}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
            style={({ pressed }) => [s.verdictBtn, pressed && { opacity: 0.88 }]}
          >
            <Text style={s.verdictBtnTxt}>Done</Text>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.beige },
  center: { justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: tokens.fonts.regular, fontSize: 14, color: tokens.colors.gray },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: tokens.colors.text, lineHeight: 26 },
  headerTitle: { fontFamily: tokens.fonts.serif, fontSize: 20, color: tokens.colors.text },

  scroll: { paddingHorizontal: 20, paddingTop: 4, gap: 14 },

  duel: {
    flexDirection: 'row', backgroundColor: tokens.colors.white,
    borderRadius: 24, borderWidth: 1, borderColor: tokens.colors.border,
    overflow: 'hidden', alignItems: 'stretch',
  },
  productHalf: { flex: 1, gap: 3, padding: 22 },
  productHalfRight: { alignItems: 'flex-end' },
  productBrand: {
    fontFamily: tokens.fonts.regular, fontSize: 8, fontWeight: '600',
    letterSpacing: 1.8, textTransform: 'uppercase', color: tokens.colors.grayLight,
  },
  productName: { fontFamily: tokens.fonts.serif, fontSize: 14, color: tokens.colors.text, lineHeight: 19 },
  productCategory: {
    fontFamily: tokens.fonts.regular, fontSize: 9, color: tokens.colors.grayLight,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  productScore: {
    fontFamily: tokens.fonts.regular, fontSize: 38, fontWeight: '700',
    lineHeight: 42, letterSpacing: -1,
  },
  winBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, marginTop: 6, borderWidth: 1,
  },
  winBadgeRight: { alignSelf: 'flex-end' },
  winBadgeHidden: { opacity: 0 },
  winBadgeText: { fontFamily: tokens.fonts.regular, fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  textRight: { textAlign: 'right' },

  vsSep: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  vsText: {
    fontFamily: tokens.fonts.regular, fontSize: 9, fontWeight: '700',
    color: tokens.colors.grayLight, letterSpacing: 2,
    backgroundColor: tokens.colors.white, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, overflow: 'hidden',
  },

  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.gray },

  metricsCard: {
    backgroundColor: tokens.colors.white, borderRadius: 20,
    borderWidth: 1, borderColor: tokens.colors.border,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4,
  },
  metricsTitle: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '700',
    color: tokens.colors.grayLight, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4,
  },
  metricRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  metricVal: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '700', width: 58 },
  metricValRight: { textAlign: 'right' },
  metricLabel: { flex: 1, fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.text, textAlign: 'center' },
  metricDivider: { height: StyleSheet.hairlineWidth, backgroundColor: tokens.colors.border },

  verdict: {
    backgroundColor: tokens.colors.white, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: tokens.colors.border,
  },
  verdictEyebrow: {
    fontFamily: tokens.fonts.regular, fontSize: 9, fontWeight: '700',
    letterSpacing: 2.5, textTransform: 'uppercase', color: tokens.colors.pinkDeep, marginBottom: 14,
  },
  verdictBrand: { fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.grayLight, marginBottom: 3 },
  verdictName: { fontFamily: tokens.fonts.serif, fontSize: 24, color: tokens.colors.text, lineHeight: 32, marginBottom: 10 },
  verdictReason: { fontFamily: tokens.fonts.regular, fontSize: 13, color: tokens.colors.gray, lineHeight: 20, marginBottom: 22 },
  verdictBtn: {
    backgroundColor: tokens.colors.pinkDeep, borderRadius: 50, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: tokens.colors.pinkDeep, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5,
  },
  verdictBtnTxt: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '700', color: tokens.colors.white, letterSpacing: 1 },
});
