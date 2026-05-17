import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, {
  FadeIn, FadeInUp, FadeInLeft, FadeInRight,
  useSharedValue, useAnimatedProps, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';

// ─── Design constants ────────────────────────────────────────────────────────
const SAFE = '#2D7D46';
const SAFE_BG = '#EDF7F2';
const WARN = '#C05A30';
const WARN_BG = '#FFF0EB';
const COLOR_A = tokens.colors.pinkDeep;
const COLOR_B = tokens.colors.gold;
const R_SMALL = 36;
const CIRC_SMALL = 2 * Math.PI * R_SMALL;

// ─── Mock data (replace with real product lookups) ───────────────────────────
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

// ─── Mini animated score ring ─────────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function MiniRing({ score, color, delay = 0 }: { score: number; color: string; delay?: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(score / 100, { duration: 1000, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const animProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRC_SMALL * (1 - progress.value),
  }));

  return (
    <View style={mr.wrap}>
      <Svg width={80} height={80} viewBox="0 0 80 80">
        <Defs>
          <SvgGradient id={`g${delay}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={color} />
          </SvgGradient>
        </Defs>
        <Circle cx={40} cy={40} r={R_SMALL} stroke={tokens.colors.border} strokeWidth={4} fill="none" />
        <AnimatedCircle
          cx={40} cy={40} r={R_SMALL}
          stroke={`url(#g${delay})`}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRC_SMALL}
          animatedProps={animProps}
          rotation={-90}
          originX={40}
          originY={40}
        />
      </Svg>
      <View style={mr.inner}>
        <Text style={[mr.num, { color }]}>{score}</Text>
      </View>
    </View>
  );
}

const mr = StyleSheet.create({
  wrap:  { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  inner: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' },
  num:   { fontFamily: tokens.fonts.regular, fontSize: 26, fontWeight: '700', letterSpacing: -1 },
});

// ─── Comparison bar row ───────────────────────────────────────────────────────
function CompareRow({ metric, index }: { metric: Metric; index: number }) {
  const aWins = metric.isSpf ? metric.a >= 30 : metric.a > metric.b;
  const bWins = metric.isSpf ? metric.b >= 30 : metric.b > metric.a;

  if (metric.isSpf) {
    return (
      <Animated.View entering={FadeInUp.delay(300 + index * 60).duration(400)} style={s.metricRow}>
        <Text style={s.metricLabel}>{metric.label}</Text>
        <View style={s.spfComparePair}>
          <View style={[s.spfChip, metric.a >= 30 ? { backgroundColor: SAFE_BG } : { backgroundColor: WARN_BG }]}>
            <MaterialIcons name={metric.a >= 30 ? 'check' : 'close'} size={13} color={metric.a >= 30 ? SAFE : WARN} />
            <Text style={[s.spfChipTxt, { color: metric.a >= 30 ? SAFE : WARN }]}>
              {metric.a > 0 ? `SPF ${metric.a}` : 'None'}
            </Text>
          </View>
          <View style={[s.spfChip, metric.b >= 30 ? { backgroundColor: SAFE_BG } : { backgroundColor: WARN_BG }]}>
            <MaterialIcons name={metric.b >= 30 ? 'check' : 'close'} size={13} color={metric.b >= 30 ? SAFE : WARN} />
            <Text style={[s.spfChipTxt, { color: metric.b >= 30 ? SAFE : WARN }]}>
              {metric.b > 0 ? `SPF ${metric.b}` : 'None'}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInUp.delay(300 + index * 60).duration(400)} style={s.metricRow}>
      <View style={s.metricHeader}>
        <Text style={s.metricLabel}>{metric.label}</Text>
        <View style={s.metricWinners}>
          <View style={[s.winDot, aWins ? { backgroundColor: COLOR_A } : { backgroundColor: 'transparent' }]} />
          <View style={[s.winDot, bWins ? { backgroundColor: COLOR_B } : { backgroundColor: 'transparent' }]} />
        </View>
      </View>
      <View style={s.barPair}>
        <View style={s.barWrap}>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${metric.a}%` as `${number}%`, backgroundColor: COLOR_A }]} />
          </View>
          <Text style={[s.barPct, { color: aWins ? COLOR_A : tokens.colors.gray }]}>{metric.a}%</Text>
        </View>
        <View style={s.barWrap}>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${metric.b}%` as `${number}%`, backgroundColor: COLOR_B }]} />
          </View>
          <Text style={[s.barPct, { color: bWins ? COLOR_B : tokens.colors.gray }]}>{metric.b}%</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function ProductCompareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useLocalSearchParams<{ barcode1?: string; barcode2?: string; uri1?: string; uri2?: string }>();

  const scoreA = PRODUCT_A.score;
  const scoreB = PRODUCT_B.score;

  const aWinsCount = METRICS.filter(m => m.isSpf ? (m.a >= 30 && m.b < 30) : m.a > m.b).length;
  const bWinsCount = METRICS.filter(m => m.isSpf ? (m.b >= 30 && m.a < 30) : m.b > m.a).length;

  const winner = scoreA > scoreB ? 'A' : 'B';
  const winnerName  = winner === 'A' ? PRODUCT_A.name  : PRODUCT_B.name;
  const winnerBrand = winner === 'A' ? PRODUCT_A.brand : PRODUCT_B.brand;
  const winnerColor = winner === 'A' ? COLOR_A : COLOR_B;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backIcon}>‹</Text>
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerEyebrow}>Side by side</Text>
          <Text style={s.headerTitle}>Compare</Text>
        </View>
        <View style={{ width: 34 }} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* VS panel */}
        <View style={s.vsSection}>
          <Animated.View entering={FadeInLeft.delay(80).duration(500)} style={s.productPanel}>
            <MiniRing score={scoreA} color={COLOR_A} delay={200} />
            <Text style={s.productName} numberOfLines={2}>{PRODUCT_A.name}</Text>
            <Text style={s.productBrand}>{PRODUCT_A.brand}</Text>
            <View style={[s.catChip, { borderColor: `${COLOR_A}40`, backgroundColor: `${COLOR_A}12` }]}>
              <Text style={[s.catChipTxt, { color: COLOR_A }]}>{PRODUCT_A.category}</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(160).duration(400)} style={s.vsBadge}>
            <Text style={s.vsText}>VS</Text>
          </Animated.View>

          <Animated.View entering={FadeInRight.delay(80).duration(500)} style={s.productPanel}>
            <MiniRing score={scoreB} color={COLOR_B} delay={350} />
            <Text style={s.productName} numberOfLines={2}>{PRODUCT_B.name}</Text>
            <Text style={s.productBrand}>{PRODUCT_B.brand}</Text>
            <View style={[s.catChip, { borderColor: `${COLOR_B}40`, backgroundColor: `${COLOR_B}12` }]}>
              <Text style={[s.catChipTxt, { color: COLOR_B }]}>{PRODUCT_B.category}</Text>
            </View>
          </Animated.View>
        </View>

        {/* Legend */}
        <Animated.View entering={FadeIn.delay(240).duration(400)} style={s.legend}>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: COLOR_A }]} />
            <Text style={s.legendTxt}>{PRODUCT_A.brand}</Text>
          </View>
          <View style={s.legendDivider} />
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: COLOR_B }]} />
            <Text style={s.legendTxt}>{PRODUCT_B.brand}</Text>
          </View>
        </Animated.View>

        {/* Metrics */}
        <View style={s.metricsCard}>
          {METRICS.map((m, i) => (
            <View key={m.label}>
              {i > 0 && <View style={s.metricDivider} />}
              <CompareRow metric={m} index={i} />
            </View>
          ))}
        </View>

        {/* Recommendation */}
        <Animated.View entering={FadeInUp.delay(600).duration(500)} style={[s.recCard, { borderColor: `${winnerColor}30` }]}>
          <View style={s.recHeader}>
            <View style={[s.recBadge, { backgroundColor: `${winnerColor}14` }]}>
              <MaterialIcons name="auto-awesome" size={13} color={winnerColor} />
              <Text style={[s.recBadgeTxt, { color: winnerColor }]}>Our pick for you</Text>
            </View>
          </View>
          <Text style={s.recBrand}>{winnerBrand}</Text>
          <Text style={s.recName}>{winnerName}</Text>
          <Text style={s.recDesc}>
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
            style={[s.recBtn, { backgroundColor: winnerColor }]}
          >
            <Text style={s.recBtnTxt}>Done</Text>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.beige },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: tokens.colors.border,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: tokens.colors.white, borderWidth: 1, borderColor: tokens.colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 20, color: tokens.colors.text, lineHeight: 22 },
  headerCenter: { alignItems: 'center', gap: 2 },
  headerEyebrow: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '500',
    letterSpacing: 1.2, textTransform: 'uppercase', color: tokens.colors.grayLight,
  },
  headerTitle: { fontFamily: tokens.fonts.serif, fontSize: 22, color: tokens.colors.text },

  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 12 },

  // VS panel
  vsSection: { flexDirection: 'row', alignItems: 'flex-start' },
  productPanel: {
    flex: 1, alignItems: 'center', gap: 6,
    backgroundColor: tokens.colors.white, borderRadius: 20,
    padding: 16, borderWidth: 1.5, borderColor: tokens.colors.border,
  },
  productName: {
    fontFamily: tokens.fonts.serif, fontSize: 14,
    color: tokens.colors.text, textAlign: 'center', lineHeight: 20,
  },
  productBrand: {
    fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.gray, textAlign: 'center',
  },
  catChip: {
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, marginTop: 2,
  },
  catChipTxt: { fontFamily: tokens.fonts.regular, fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },

  vsBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: tokens.colors.beige, borderWidth: 1.5, borderColor: tokens.colors.border,
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginHorizontal: -18, zIndex: 10,
  },
  vsText: { fontFamily: tokens.fonts.serif, fontSize: 11, fontStyle: 'italic', color: tokens.colors.gray },

  // Legend
  legend: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: tokens.colors.white, borderRadius: 14,
    paddingVertical: 10, paddingHorizontal: 20,
    borderWidth: 1, borderColor: tokens.colors.border, gap: 16,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.gray },
  legendDivider: { width: 1, height: 14, backgroundColor: tokens.colors.border },

  // Metrics card
  metricsCard: {
    backgroundColor: tokens.colors.white, borderRadius: 20,
    borderWidth: 1.5, borderColor: tokens.colors.border,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  metricRow: { paddingVertical: 14 },
  metricHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  metricLabel: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '600', color: tokens.colors.grayLight, textTransform: 'uppercase', letterSpacing: 0.8 },
  metricWinners: { flexDirection: 'row', gap: 4 },
  winDot: { width: 7, height: 7, borderRadius: 4, borderWidth: 1, borderColor: tokens.colors.border },
  metricDivider: { height: 1, backgroundColor: `${tokens.colors.border}80` },

  barPair: { gap: 6 },
  barWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barBg: { flex: 1, height: 6, backgroundColor: tokens.colors.beige, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barPct: { fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },

  // SPF row
  spfComparePair: { flexDirection: 'row', gap: 8, marginTop: 8 },
  spfChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 10, paddingVertical: 8 },
  spfChipTxt: { fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '700' },

  // Recommendation
  recCard: {
    backgroundColor: tokens.colors.white, borderRadius: 20, borderWidth: 1.5, padding: 20,
  },
  recHeader: { marginBottom: 12 },
  recBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  recBadgeTxt: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  recBrand: { fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.gray, marginBottom: 2 },
  recName: { fontFamily: tokens.fonts.serif, fontSize: 20, color: tokens.colors.text, marginBottom: 8, lineHeight: 26 },
  recDesc: { fontFamily: tokens.fonts.regular, fontSize: 13, color: tokens.colors.gray, lineHeight: 19, marginBottom: 16 },
  recBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  recBtnTxt: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 0.8, textTransform: 'uppercase' },
});
