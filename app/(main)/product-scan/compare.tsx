import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';

const COLOR_A = tokens.colors.pinkDeep;
const COLOR_B = tokens.colors.gold;

const PRODUCT_A = {
  name: "Pro Filt'r Soft Matte",
  brand: 'Fenty Beauty',
  category: 'Foundation',
  score: 87,
  metrics: {
    shade:   { label: 'Shade Match',    a: 94, b: 78 },
    skinFit: { label: 'Skin Fit',       a: 88, b: 82 },
    safety:  { label: 'Safety',         a: 72, b: 91 },
    spf:     { label: 'SPF Protection', a: 0,  b: 30, isSpf: true },
    ethics:  { label: 'Ethics',         a: 95, b: 70 },
  },
};

const PRODUCT_B = {
  name: 'Skin Tint SPF 30',
  brand: 'Charlotte Tilbury',
  category: 'Tinted Moisturizer',
  score: 74,
};

type Metric = { label: string; a: number; b: number; isSpf?: boolean };
const METRICS: Metric[] = Object.values(PRODUCT_A.metrics);

function MetricRow({ metric, index }: { metric: Metric; index: number }) {
  const aWins = metric.isSpf ? metric.a >= 30 : metric.a > metric.b;
  const bWins = metric.isSpf ? metric.b >= 30 : metric.b > metric.a;
  const aDisplay = metric.isSpf ? (metric.a > 0 ? `SPF ${metric.a}` : 'None') : `${metric.a}%`;
  const bDisplay = metric.isSpf ? (metric.b > 0 ? `SPF ${metric.b}` : 'None') : `${metric.b}%`;

  return (
    <Animated.View entering={FadeInUp.delay(300 + index * 55).duration(400)} style={s.metricRow}>
      <Text style={[s.metricVal, { color: aWins ? COLOR_A : tokens.colors.grayLight }]}>
        {aDisplay}
      </Text>
      <Text style={s.metricLabel}>{metric.label}</Text>
      <Text style={[s.metricVal, s.metricValRight, { color: bWins ? COLOR_B : tokens.colors.grayLight }]}>
        {bDisplay}
      </Text>
    </Animated.View>
  );
}

export default function ProductCompareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useLocalSearchParams<{ barcode1?: string; barcode2?: string; uri1?: string; uri2?: string }>();

  const scoreA = PRODUCT_A.score;
  const scoreB = PRODUCT_B.score;
  const winner      = scoreA > scoreB ? 'A' : 'B';
  const winnerName  = winner === 'A' ? PRODUCT_A.name  : PRODUCT_B.name;
  const winnerBrand = winner === 'A' ? PRODUCT_A.brand : PRODUCT_B.brand;
  const aWinsCount  = METRICS.filter(m => m.isSpf ? (m.a >= 30 && m.b < 30) : m.a > m.b).length;
  const bWinsCount  = METRICS.filter(m => m.isSpf ? (m.b >= 30 && m.a < 30) : m.b > m.a).length;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* Header */}
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

          {/* Product A */}
          <View style={[s.productHalf, winner === 'A' && { backgroundColor: `${COLOR_A}0D` }]}>
            <Text style={s.productBrand}>{PRODUCT_A.brand}</Text>
            <Text style={s.productName}>{PRODUCT_A.name}</Text>
            <Text style={s.productCategory}>{PRODUCT_A.category}</Text>
            <Text style={[s.productScore, { color: COLOR_A }]}>{scoreA}</Text>
            <View style={[s.winBadge, { backgroundColor: `${COLOR_A}14`, borderColor: `${COLOR_A}30` }, winner !== 'A' && s.winBadgeHidden]}>
              <Text style={[s.winBadgeText, { color: COLOR_A }]}>Best match</Text>
            </View>
          </View>

          {/* VS — absolutely centered so both halves are exactly 50% */}
          <View style={s.vsSep} pointerEvents="none">
            <Text style={s.vsText}>VS</Text>
          </View>

          {/* Product B */}
          <View style={[s.productHalf, s.productHalfRight, winner === 'B' && { backgroundColor: `${COLOR_B}0D` }]}>
            <Text style={[s.productBrand, s.textRight]}>{PRODUCT_B.brand}</Text>
            <Text style={[s.productName, s.textRight]}>{PRODUCT_B.name}</Text>
            <Text style={[s.productCategory, s.textRight]}>{PRODUCT_B.category}</Text>
            <Text style={[s.productScore, s.textRight, { color: COLOR_B }]}>{scoreB}</Text>
            <View style={[s.winBadge, s.winBadgeRight, { backgroundColor: `${COLOR_B}14`, borderColor: `${COLOR_B}30` }, winner !== 'B' && s.winBadgeHidden]}>
              <Text style={[s.winBadgeText, { color: COLOR_B }]}>Best match</Text>
            </View>
          </View>

        </Animated.View>

        {/* Legend */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={s.legend}>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: COLOR_A }]} />
            <Text style={s.legendText}>{PRODUCT_A.brand}</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: COLOR_B }]} />
            <Text style={s.legendText}>{PRODUCT_B.brand}</Text>
          </View>
        </Animated.View>

        {/* Breakdown */}
        <View style={s.metricsCard}>
          <Text style={s.metricsTitle}>Category Breakdown</Text>
          {METRICS.map((m, i) => (
            <View key={m.label}>
              {i > 0 && <View style={s.metricDivider} />}
              <MetricRow metric={m} index={i} />
            </View>
          ))}
        </View>

        {/* Verdict */}
        <Animated.View entering={FadeInUp.delay(620).duration(500)} style={s.verdict}>
          <Text style={s.verdictEyebrow}>The better pick for your skin</Text>
          <Text style={s.verdictBrand}>{winnerBrand}</Text>
          <Text style={s.verdictName}>{winnerName}</Text>
          <Text style={s.verdictReason}>
            Wins {Math.max(aWinsCount, bWinsCount)} of {METRICS.length} categories for your skin profile.
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

        <View style={{ height: 4 }} />

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.beige },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: tokens.colors.text, lineHeight: 26 },
  headerTitle: { fontFamily: tokens.fonts.serif, fontSize: 20, color: tokens.colors.text },

  scroll: { paddingHorizontal: 20, paddingTop: 4, gap: 14 },

  // Duel
  duel: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    overflow: 'hidden',
    alignItems: 'stretch',
  },
  productHalf: {
    flex: 1, gap: 3, padding: 22,
  },
  productHalfRight: { alignItems: 'flex-end' },
  productBrand: {
    fontFamily: tokens.fonts.regular, fontSize: 8, fontWeight: '600',
    letterSpacing: 1.8, textTransform: 'uppercase', color: tokens.colors.grayLight,
  },
  productName: {
    fontFamily: tokens.fonts.serif, fontSize: 14, color: tokens.colors.text, lineHeight: 19,
  },
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
  winBadgeText: {
    fontFamily: tokens.fonts.regular, fontSize: 9, fontWeight: '700', letterSpacing: 0.3,
  },
  textRight: { textAlign: 'right' },

  // VS separator — absolute so it doesn't affect flex widths
  vsSep: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  vsText: {
    fontFamily: tokens.fonts.regular, fontSize: 9, fontWeight: '700',
    color: tokens.colors.grayLight, letterSpacing: 2,
    backgroundColor: tokens.colors.white,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6,
    overflow: 'hidden',
  },

  // Legend
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.gray },

  // Metrics
  metricsCard: {
    backgroundColor: tokens.colors.white, borderRadius: 20,
    borderWidth: 1, borderColor: tokens.colors.border,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4,
  },
  metricsTitle: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '700',
    color: tokens.colors.grayLight, textTransform: 'uppercase', letterSpacing: 1.2,
    marginBottom: 4,
  },
  metricRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 13,
  },
  metricVal: {
    fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '700', width: 58,
  },
  metricValRight: { textAlign: 'right' },
  metricLabel: {
    flex: 1, fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.text,
    textAlign: 'center',
  },
  metricDivider: { height: StyleSheet.hairlineWidth, backgroundColor: tokens.colors.border },

  // Verdict
  verdict: {
    backgroundColor: tokens.colors.white, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: tokens.colors.border,
  },
  verdictEyebrow: {
    fontFamily: tokens.fonts.regular, fontSize: 9, fontWeight: '700',
    letterSpacing: 2.5, textTransform: 'uppercase', color: tokens.colors.pinkDeep, marginBottom: 14,
  },
  verdictBrand: {
    fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.grayLight, marginBottom: 3,
  },
  verdictName: {
    fontFamily: tokens.fonts.serif, fontSize: 24, color: tokens.colors.text, lineHeight: 32, marginBottom: 10,
  },
  verdictReason: {
    fontFamily: tokens.fonts.regular, fontSize: 13,
    color: tokens.colors.gray, lineHeight: 20, marginBottom: 22,
  },
  verdictBtn: {
    backgroundColor: tokens.colors.pinkDeep, borderRadius: 50, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  verdictBtnTxt: {
    fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '700',
    color: tokens.colors.white, letterSpacing: 1,
  },
});
