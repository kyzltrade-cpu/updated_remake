import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming, withDelay, FadeInUp, Easing,
} from 'react-native-reanimated';
import Svg, {
  Polyline, Line, Defs, ClipPath, Rect,
} from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { OnboardingHeader } from '@/components/onboarding-header';
import { tokens } from '@/components/theme';

const { width: SW } = Dimensions.get('window');

// Card padding (18 × 2) + screen padding (28 × 2) + y-axis label area (32)
const CHART_W = SW - 56 - 36 - 32;
const CHART_H = 140;
const MIN_VAL = 0;
const MAX_VAL = 200;

const WITH_REMAKE    = [0, 18, 52, 98, 148, 198];
const WITHOUT_REMAKE = [0, 2,  4,  6,   8,  10];
const N = WITH_REMAKE.length;

function toX(i: number) { return (i / (N - 1)) * CHART_W; }
function toY(val: number) {
  return CHART_H - ((val - MIN_VAL) / (MAX_VAL - MIN_VAL)) * CHART_H;
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);

function AnimatedLine({
  data, color, strokeWidth, delay, clipId,
}: { data: number[]; color: string; strokeWidth: number; delay: number; clipId: string }) {
  const w = useSharedValue(0);

  useEffect(() => {
    w.value = withDelay(delay, withTiming(CHART_W + 10, { duration: 900, easing: Easing.out(Easing.quad) }));
  }, []);

  const rectProps = useAnimatedProps(() => ({ width: w.value }));
  const points = data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');

  return (
    <>
      <Defs>
        <ClipPath id={clipId}>
          <AnimatedRect x={0} y={-10} height={CHART_H + 20} animatedProps={rectProps} />
        </ClipPath>
      </Defs>
      <Polyline
        points={points}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        clipPath={`url(#${clipId})`}
      />
      {/* Terminal dot */}
      <Polyline
        points={`${toX(data.length - 1)},${toY(data[data.length - 1])}`}
        stroke={color}
        strokeWidth={strokeWidth * 2.5}
        strokeLinecap="round"
        clipPath={`url(#${clipId})`}
      />
    </>
  );
}

export default function ResultsProofScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const gridValues = [0, 50, 100, 150, 200];

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={5} total={18} onBack={() => router.back()} />

      <View style={styles.body}>
        <Animated.Text entering={FadeInUp.delay(80).duration(500)} style={styles.eyebrow}>
          THE DIFFERENCE
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(160).duration(500)} style={styles.title}>
          {'REMAKE saves you\nmoney, month after month.'}
        </Animated.Text>

        <Animated.View entering={FadeInUp.delay(260).duration(500)} style={styles.chartCard}>
          {/* Card header */}
          <View style={styles.cardHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.chartTitle}>Cumulative money saved</Text>
              <Text style={styles.chartSub}>Avoiding wrong product purchases · 6 months</Text>
            </View>
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsNum}>$198</Text>
              <Text style={styles.savingsLabel}>avg. saved</Text>
            </View>
          </View>

          {/* Chart — SVG, no bleeding */}
          <View style={styles.chartOuter}>
            {/* Y-axis labels */}
            <View style={styles.yAxis}>
              {[...gridValues].reverse().map(v => (
                <Text key={v} style={styles.gridLabel}>${v}</Text>
              ))}
            </View>

            {/* Chart area */}
            <View style={{ flex: 1 }}>
              <Svg width={CHART_W} height={CHART_H}>
                {/* Grid lines */}
                {gridValues.map(v => (
                  <Line
                    key={v}
                    x1={0} y1={toY(v)}
                    x2={CHART_W} y2={toY(v)}
                    stroke="rgba(0,0,0,0.07)"
                    strokeWidth={1}
                  />
                ))}

                {/* Without REMAKE — muted */}
                <AnimatedLine
                  data={WITHOUT_REMAKE}
                  color="rgba(0,0,0,0.18)"
                  strokeWidth={2}
                  delay={350}
                  clipId="clip-without"
                />

                {/* With REMAKE — bold pink */}
                <AnimatedLine
                  data={WITH_REMAKE}
                  color={tokens.colors.pinkDeep}
                  strokeWidth={3}
                  delay={550}
                  clipId="clip-with"
                />
              </Svg>

              {/* X-axis labels */}
              <View style={styles.xAxis}>
                <Text style={styles.xLabel}>Month 1</Text>
                <Text style={styles.xLabel}>Month 6</Text>
              </View>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: tokens.colors.pinkDeep }]} />
              <Text style={[styles.legendLabel, { color: tokens.colors.pinkDeep, fontWeight: '700' }]}>
                With REMAKE
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: 'rgba(0,0,0,0.18)' }]} />
              <Text style={styles.legendLabel}>Without REMAKE</Text>
            </View>
          </View>

          {/* Stat */}
          <View style={styles.statRow}>
            <Text style={styles.statText}>
              REMAKE users save an average of{' '}
              <Text style={styles.statHighlight}>$198</Text>
              {' '}in their first 6 months.
            </Text>
          </View>
        </Animated.View>
      </View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.bottom}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/features');
          }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.cream },
  body: { paddingHorizontal: 28, paddingTop: 20 },
  eyebrow: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '700',
    letterSpacing: 3, color: tokens.colors.pinkDeep, marginBottom: 12,
  },
  title: {
    fontFamily: tokens.fonts.serif, fontSize: 28, fontWeight: '400',
    color: tokens.colors.text, lineHeight: 38, marginBottom: 22,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)',
    padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardHead: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16,
  },
  chartTitle: {
    fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '700',
    color: tokens.colors.text, marginBottom: 2,
  },
  chartSub: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '300',
    color: tokens.colors.gray, lineHeight: 15, maxWidth: 160,
  },
  savingsBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(232,57,154,0.07)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(232,57,154,0.15)',
  },
  savingsNum: {
    fontFamily: tokens.fonts.serif, fontSize: 18, fontWeight: '400',
    color: tokens.colors.pinkDeep, lineHeight: 22,
  },
  savingsLabel: {
    fontFamily: tokens.fonts.regular, fontSize: 9, fontWeight: '600',
    color: tokens.colors.pinkDeep, letterSpacing: 0.5, textTransform: 'uppercase',
  },

  // Chart layout: y-axis labels beside the SVG
  chartOuter: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  yAxis: {
    width: 32,
    height: CHART_H,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  gridLabel: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '500',
    color: tokens.colors.gray,
  },
  xAxis: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 6,
  },
  xLabel: {
    fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '500',
    color: tokens.colors.gray,
  },
  legend: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingTop: 12, paddingLeft: 32,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
  legendLine: { width: 20, height: 2.5, borderRadius: 2 },
  legendLabel: {
    fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '600',
    color: tokens.colors.text,
  },

  statRow: {
    marginTop: 10, backgroundColor: tokens.colors.cream,
    borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14,
  },
  statText: {
    fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '400',
    color: tokens.colors.text, textAlign: 'center', lineHeight: 19,
  },
  statHighlight: {
    fontFamily: tokens.fonts.serif, fontSize: 14, fontWeight: '400',
    color: tokens.colors.pinkDeep,
  },

  bottom: { paddingHorizontal: 28 },
  cta: {
    backgroundColor: tokens.colors.pinkDeep, borderRadius: 50,
    paddingVertical: 17, alignItems: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.32, shadowRadius: 12, elevation: 7,
  },
  ctaText: { fontFamily: tokens.fonts.regular, fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
