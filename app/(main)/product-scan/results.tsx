import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeIn, FadeInUp,
  useSharedValue, useAnimatedProps, withTiming, Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';
import { analyzeProduct, type ProductScanResult } from '@/lib/api/product-scan';

// ─── Design constants ────────────────────────────────────────────────────────
const CIRCUMFERENCE = 2 * Math.PI * 50;
const SAFE = '#2D7D46';
const SAFE_BG = '#EDF7F2';
const WARN = '#C05A30';
const WARN_BG = '#FFF0EB';

// ─── Animated score ring ─────────────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ScoreRing({ score }: { score: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const animProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <View style={rs.wrap}>
      <Svg width={120} height={120} viewBox="0 0 120 120">
        <Defs>
          <SvgGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={tokens.colors.pinkMid} />
            <Stop offset="100%" stopColor={tokens.colors.pinkDeep} />
          </SvgGradient>
        </Defs>
        <Circle cx={60} cy={60} r={50} stroke={tokens.colors.border} strokeWidth={5} fill="none" />
        <AnimatedCircle
          cx={60} cy={60} r={50}
          stroke="url(#rg)"
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={animProps}
          rotation={-90}
          originX={60}
          originY={60}
        />
      </Svg>
      <View style={rs.inner}>
        <Text style={rs.num}>{score}</Text>
      </View>
    </View>
  );
}

const rs = StyleSheet.create({
  wrap:  { width: 120, height: 120, justifyContent: 'center', alignItems: 'center' },
  inner: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' },
  num:   { fontFamily: tokens.fonts.regular, fontSize: 40, fontWeight: '700', color: tokens.colors.text, letterSpacing: -2 },
});

// ─── Card shell ───────────────────────────────────────────────────────────────
function Card({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(500)} style={s.card}>
      {children}
    </Animated.View>
  );
}

function CardHead({ title, badge, safe }: {
  title: string;
  badge?: string;
  safe?: boolean | null;
}) {
  const bg    = safe === true ? SAFE_BG : safe === false ? WARN_BG : tokens.colors.cream;
  const color = safe === true ? SAFE    : safe === false ? WARN    : tokens.colors.gray;
  return (
    <View style={s.cardHead}>
      <Text style={s.cardTitle}>{title}</Text>
      {badge ? (
        <View style={[s.badge, { backgroundColor: bg }]}>
          <Text style={[s.badgeTxt, { color }]}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Bar({ pct, h = 4 }: { pct: number; h?: number }) {
  return (
    <View style={[s.barBg, { height: h }]}>
      <View style={[s.barFill, { width: `${pct}%` as `${number}%` }]} />
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function ProductScanResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { barcode, uri } = useLocalSearchParams<{ barcode?: string; uri?: string }>();

  const [data, setData] = useState<ProductScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    analyzeProduct({ barcode, uri })
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(() => {
        setFailed(true);
        setLoading(false);
      });
  }, []);

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(main)/scan');
  };

  const handlePaoReminder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (loading) {
    return (
      <View style={[s.root, s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={tokens.colors.pinkDeep} />
        <Text style={s.loadingText}>Analysing product…</Text>
      </View>
    );
  }

  if (failed || !data) {
    return (
      <View style={[s.root, s.center, { paddingTop: insets.top }]}>
        <MaterialIcons name="error-outline" size={40} color={WARN} />
        <Text style={s.errorText}>Could not analyse product</Text>
        <Pressable onPress={() => router.back()} style={s.retryBtn}>
          <Text style={s.retryTxt}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <MaterialIcons name="arrow-back" size={18} color={tokens.colors.text} />
          </Pressable>
          <Text style={s.headerLabel}>Scan result</Text>
        </View>
        <View style={s.headerRight}>
          <Text style={s.catTag}>{data.category}</Text>
          <Text style={s.barcode}>{data.barcode || uri ? (data.barcode || '📷 photo') : ''}</Text>
        </View>
      </View>

      {/* Scrollable body */}
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Score ring */}
        <Animated.View entering={FadeInUp.duration(500)} style={s.scoreSection}>
          <ScoreRing score={data.score} />
          <Text style={s.productTitle}>{data.brand} · {data.productName}</Text>
          <Text style={s.verdict}>{data.verdict}</Text>
          <Text style={s.reason}>{data.reason}</Text>
        </Animated.View>

        <View style={s.divider} />

        {/* ── Shade & Tone ── */}
        <Card delay={60}>
          <CardHead title="Shade & Tone" badge={`${data.shade.pct}%`} safe={true} />

          <View style={s.shadeRow}>
            <View style={s.swatches}>
              <View style={[s.swatch, { backgroundColor: data.shade.detected }]} />
              <MaterialIcons name="swap-horiz" size={14} color={tokens.colors.grayLight} />
              <View style={[s.swatch, { backgroundColor: data.shade.product }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.shadeName}>{data.shade.name}</Text>
              <Text style={s.shadeSub}>ΔE {data.shade.deltaE} · {data.shade.sub}</Text>
            </View>
          </View>

          <Bar pct={data.shade.pct} />
          <View style={s.barLabels}>
            <Text style={s.barLbl}>Tone alignment</Text>
            <Text style={s.barLbl}>{data.shade.pct} / 100</Text>
          </View>

          <View style={s.toneGrid}>
            {data.shade.tones.map(t => (
              <View key={t.label} style={s.toneItem}>
                <Text style={s.toneLbl}>{t.label}</Text>
                <Text style={s.toneVal}>{t.value}</Text>
                <Bar pct={t.pct} h={3} />
              </View>
            ))}
          </View>
        </Card>

        {/* ── Coverage & Finish ── */}
        <Card delay={100}>
          <CardHead title="Coverage & Finish" />
          <View style={s.coverageGrid}>
            {data.coverage.map(item => (
              <View key={item.label} style={s.coverageItem}>
                <Text style={s.coverageLbl}>{item.label}</Text>
                <Text style={s.coverageVal}>{item.value}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* ── SPF Reality Check ── */}
        <Card delay={130}>
          <CardHead
            title="SPF Reality Check"
            badge={data.spf.level ? `SPF ${data.spf.level}` : 'No SPF'}
            safe={data.spf.level ? data.spf.level >= 30 : false}
          />
          <View style={s.spfRow}>
            <MaterialIcons
              name="wb-sunny"
              size={20}
              color={data.spf.level && data.spf.level >= 30 ? SAFE : WARN}
            />
            <Text style={s.spfNote}>{data.spf.note}</Text>
          </View>
          {data.spf.flashback && (
            <View style={[s.spfAlert, { backgroundColor: WARN_BG }]}>
              <MaterialIcons name="photo-camera" size={14} color={WARN} />
              <Text style={[s.spfAlertTxt, { color: WARN }]}>May cause flashback (white cast) in photos</Text>
            </View>
          )}
        </Card>

        {/* ── Skin Compatibility ── */}
        <Card delay={140}>
          <CardHead title="Skin Compatibility" badge="Compatible" safe={null} />
          <View style={s.skinRows}>
            {data.skinFit.map(item => (
              <View key={item.label} style={s.skinRow}>
                <View style={s.skinIcon}>
                  <MaterialIcons name={item.icon as any} size={16} color={tokens.colors.gray} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.skinLbl}>{item.label}</Text>
                  <Text style={s.skinDesc}>{item.desc}</Text>
                </View>
                <View style={[s.skinBadge, { backgroundColor: item.ok ? SAFE_BG : WARN_BG }]}>
                  <Text style={[s.skinBadgeTxt, { color: item.ok ? SAFE : WARN }]}>
                    {item.ok ? 'Great' : 'Caution'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* ── Style Fit ── */}
        <Card delay={180}>
          <CardHead title="Style Fit" badge="Perfect fit" safe={null} />
          <View style={s.archetypePill}>
            <Text style={s.archetypeText}>{data.styleFit.archetype}</Text>
          </View>
          <Text style={s.styleDesc}>{data.styleFit.desc}</Text>
          <View style={s.palette}>
            {data.styleFit.palette.map((c, i) => (
              <View key={i} style={[s.palDot, { backgroundColor: c }]} />
            ))}
          </View>
        </Card>

        {/* ── Safety Check ── */}
        <Card delay={220}>
          <CardHead title="Safety Check" />

          {data.allergy ? (
            <View style={s.allergyBox}>
              <MaterialIcons name="warning" size={18} color={WARN} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.allergyTitle}>Allergy Alert</Text>
                <Text style={s.allergyDesc}>
                  Contains <Text style={{ fontWeight: '700' }}>{data.allergy}</Text>, which may affect sensitive users.
                </Text>
              </View>
            </View>
          ) : null}

          <Text style={s.ingHead}>Ingredient Analysis</Text>
          {data.ingredients.map((ing, i) => (
            <View
              key={ing.name}
              style={[s.ingRow, i < data.ingredients.length - 1 && s.ingBorder]}
            >
              <View style={[s.ingDot, { backgroundColor: ing.safe ? SAFE : WARN }]} />
              <Text style={[s.ingName, !ing.safe && { color: WARN }]}>{ing.name}</Text>
              <Text style={[s.ingFunc, !ing.safe && { color: WARN }]}>{ing.func}</Text>
            </View>
          ))}
        </Card>

        {/* ── Conscious Choice ── */}
        <Card delay={260}>
          <CardHead title="Conscious Choice" badge="Ethics" safe={null} />
          <View style={s.ethicsGrid}>
            {data.ethics.map(e => (
              <View key={e.label} style={s.ethicsCard}>
                <View style={s.ethicsCheck}>
                  <MaterialIcons name="check" size={10} color="#fff" />
                </View>
                <View style={s.ethicsIconWrap}>
                  <MaterialIcons name={e.icon as any} size={18} color={tokens.colors.pinkDeep} />
                </View>
                <Text style={s.ethicsLbl}>{e.label}</Text>
                <Text style={s.ethicsVal}>{e.value}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={{ height: 76 }} />
      </ScrollView>

      {/* Sticky save bar */}
      <Animated.View
        entering={FadeIn.delay(400).duration(400)}
        style={[s.saveWrap, { paddingBottom: insets.bottom }]}
      >
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [s.saveBtn, pressed && { opacity: 0.85 }]}
        >
          <MaterialIcons name="bookmark-border" size={16} color={tokens.colors.white} />
          <Text style={s.saveTxt}>Save to history</Text>
        </Pressable>
        <Pressable onPress={handlePaoReminder} style={s.paoBtn}>
          <MaterialIcons name="notifications-none" size={14} color={tokens.colors.gray} />
          <Text style={s.paoTxt}>Opens in {data.pao} · Set expiry reminder</Text>
        </Pressable>
      </Animated.View>

    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.cream },
  center: { justifyContent: 'center', alignItems: 'center', gap: 16 },

  loadingText: { fontFamily: tokens.fonts.regular, fontSize: 14, color: tokens.colors.gray, marginTop: 8 },
  errorText:   { fontFamily: tokens.fonts.regular, fontSize: 14, color: WARN, textAlign: 'center' },
  retryBtn:    { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: tokens.colors.pinkDeep, borderRadius: 12 },
  retryTxt:    { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '700', color: tokens.colors.white },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: tokens.colors.border,
    backgroundColor: tokens.colors.cream,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: tokens.colors.white, borderWidth: 1, borderColor: tokens.colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  headerLabel: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '500', color: tokens.colors.gray },
  headerRight: { alignItems: 'flex-end', gap: 2 },
  catTag:   { fontFamily: tokens.fonts.regular, fontSize: 9, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', color: tokens.colors.pinkDeep },
  barcode:  { fontFamily: 'Courier', fontSize: 10, color: tokens.colors.grayLight, letterSpacing: 0.4 },

  // Scroll
  scroll: { paddingVertical: 16, gap: 12 },

  // Score section
  scoreSection: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, gap: 6 },
  productTitle: { fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '600', color: tokens.colors.gray, textAlign: 'center', marginTop: 2 },
  verdict: { fontFamily: tokens.fonts.serif, fontSize: 20, fontWeight: '400', color: tokens.colors.text, textAlign: 'center' },
  reason:  { fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '300', color: tokens.colors.gray, textAlign: 'center', lineHeight: 18, maxWidth: 280 },

  divider: { height: 1, backgroundColor: tokens.colors.border, marginHorizontal: 16 },

  // Card
  card: {
    backgroundColor: tokens.colors.white, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: tokens.colors.border, marginHorizontal: 16,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: tokens.colors.grayLight },
  badge:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeTxt:  { fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  barBg:   { backgroundColor: tokens.colors.beige, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: tokens.colors.pinkDeep },

  // Shade & Tone
  shadeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  swatches: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch:   { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  shadeName: { fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '600', color: tokens.colors.text },
  shadeSub:  { fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.gray, marginTop: 2 },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  barLbl:    { fontFamily: tokens.fonts.regular, fontSize: 10, color: tokens.colors.gray, fontWeight: '500' },
  toneGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  toneItem:  { width: '44%' },
  toneLbl:   { fontFamily: tokens.fonts.regular, fontSize: 10, color: tokens.colors.grayLight, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '500' },
  toneVal:   { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '600', color: tokens.colors.text, marginTop: 2, marginBottom: 2 },

  // Coverage & Finish
  coverageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  coverageItem: { width: '47%', backgroundColor: tokens.colors.beige, borderRadius: 12, padding: 12 },
  coverageLbl:  { fontFamily: tokens.fonts.regular, fontSize: 9, fontWeight: '600', color: tokens.colors.grayLight, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  coverageVal:  { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '700', color: tokens.colors.text },

  // Skin Compatibility
  skinRows:    { gap: 10 },
  skinRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  skinIcon:    { width: 30, height: 30, borderRadius: 8, backgroundColor: tokens.colors.beige, justifyContent: 'center', alignItems: 'center' },
  skinLbl:     { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '600', color: tokens.colors.text },
  skinDesc:    { fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.gray, lineHeight: 15, marginTop: 1 },
  skinBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  skinBadgeTxt: { fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '700' },

  // Style Fit
  archetypePill: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.colors.cream, borderWidth: 1, borderColor: tokens.colors.border,
    borderRadius: 22, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 8,
  },
  archetypeText: { fontFamily: tokens.fonts.serif, fontStyle: 'italic', fontSize: 15, color: tokens.colors.text },
  styleDesc: { fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.gray, lineHeight: 18 },
  palette:   { flexDirection: 'row', gap: 6, marginTop: 12 },
  palDot:    { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)' },

  // Safety Check
  allergyBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: WARN_BG, borderRadius: 12, padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: `${WARN}33`,
  },
  allergyTitle: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '700', color: WARN, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  allergyDesc:  { fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.text, lineHeight: 17 },
  ingHead: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '600', color: tokens.colors.grayLight,
    textTransform: 'uppercase', letterSpacing: 0.8,
    borderBottomWidth: 1, borderBottomColor: tokens.colors.border, paddingBottom: 6, marginBottom: 8,
  },
  ingRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  ingBorder: { borderBottomWidth: 1, borderBottomColor: `${tokens.colors.border}80` },
  ingDot:    { width: 8, height: 8, borderRadius: 4 },
  ingName:   { fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '600', color: tokens.colors.text, flex: 1 },
  ingFunc:   { fontFamily: tokens.fonts.regular, fontSize: 10, color: tokens.colors.gray },

  // Conscious Choice
  ethicsGrid: { flexDirection: 'row', gap: 8 },
  ethicsCard: {
    flex: 1, backgroundColor: tokens.colors.beige, borderRadius: 14,
    padding: 12, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: tokens.colors.border, position: 'relative',
  },
  ethicsCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: SAFE, justifyContent: 'center', alignItems: 'center',
  },
  ethicsIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: tokens.colors.white, borderWidth: 1, borderColor: tokens.colors.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: 2,
  },
  ethicsLbl: { fontFamily: tokens.fonts.regular, fontSize: 9, fontWeight: '600', color: tokens.colors.gray, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  ethicsVal: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '700', color: tokens.colors.text },

  // SPF Reality Check
  spfRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  spfNote: { fontFamily: tokens.fonts.regular, fontSize: 13, color: tokens.colors.text, lineHeight: 19, flex: 1 },
  spfAlert: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 10 },
  spfAlertTxt: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '500', flex: 1, lineHeight: 16 },

  // PAO reminder
  paoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 4, paddingBottom: 2 },
  paoTxt: { fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.gray },

  // Save bar
  saveWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 10,
    backgroundColor: tokens.colors.cream,
    borderTopWidth: 1, borderTopColor: tokens.colors.border,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: tokens.colors.text, borderRadius: 14, paddingVertical: 14,
  },
  saveTxt: { fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '700', color: tokens.colors.white, letterSpacing: 1, textTransform: 'uppercase' },
});
