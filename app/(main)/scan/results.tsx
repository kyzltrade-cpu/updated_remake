import { useEffect, useRef, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Linking,
} from 'react-native';
import Animated, {
  FadeIn, FadeInUp,
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { ScoreRing } from '@/components/score-ring';
import * as Haptics from 'expo-haptics';
import type { DiagnosisResult, CoachingResult, CategoryAnalysis } from '@/lib/api/types';
import { useAuth } from '@/contexts/AuthContext';
import { saveScan, getLastScan } from '@/lib/api/scan-storage';

const SCORE_GREEN = '#2D7D46';
const SCORE_GOLD  = '#B8820A';
const SCORE_RED   = '#B94040';

const CATEGORY_ICONS: Record<string, string> = {
  Blending:         '✦',
  Symmetry:         '◈',
  'Colour Harmony': '◉',
  Coverage:         '▣',
  Cleanliness:      '◌',
  'Brow Framing':   '⌒',
};

// ─── Animated bar ─────────────────────────────────────────────────────────────

function AnimatedBar({ score, delay, isPriority }: { score: number; delay: number; isPriority: boolean }) {
  const w = useSharedValue(0);
  useEffect(() => {
    if (score === 0) return;
    w.value = withDelay(delay, withTiming(score / 100, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [score]);
  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` as `${number}%` }));
  const color = isPriority ? tokens.colors.pinkRich : tokens.colors.pinkDeep;
  return (
    <View style={s.barTrack}>
      <Animated.View style={[s.barFill, { backgroundColor: color }, style]} />
    </View>
  );
}

// ─── Category card ────────────────────────────────────────────────────────────

function CategoryCard({ cat, index }: { cat: CategoryAnalysis; index: number }) {
  const delay      = 300 + index * 80;
  const scoreColor = cat.score >= 80 ? SCORE_GREEN : cat.score >= 65 ? SCORE_GOLD : SCORE_RED;
  const scoreBg    = cat.score >= 80 ? '#EDF7F2'   : cat.score >= 65 ? '#FFF8ED'  : '#FFF0F0';

  const openTutorial = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(cat.tutorialQuery)}`,
    );
  };

  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(380)} style={s.card}>

      {/* Header: name + score — clean typography, no nested boxes */}
      <View style={s.cardHeader}>
        <View style={s.cardHeaderLeft}>
          <Text style={s.cardIcon}>{CATEGORY_ICONS[cat.name] ?? '●'}</Text>
          <View style={s.cardHeaderText}>
            <Text style={s.cardName}>{cat.name}</Text>
            {cat.isPriority && (
              <Text style={s.focusBadgeText}>↑ Focus area</Text>
            )}
          </View>
        </View>
        <Text style={[s.scoreNum, { color: scoreColor }]}>{cat.score}</Text>
      </View>

      {/* Animated bar */}
      <AnimatedBar score={cat.score} delay={delay + 80} isPriority={cat.isPriority} />

      {/* Coaching tip */}
      <Text style={s.cardTip}>{cat.tip}</Text>

      {/* Filled tutorial button */}
      <Pressable onPress={openTutorial} style={s.tutorialBtn}>
        <Text style={s.tutorialText}>Watch tutorial</Text>
        <Text style={s.tutorialArrow}>→</Text>
      </Pressable>

    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ResultsScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const params   = useLocalSearchParams<{ uri?: string; diagnosis?: string; coaching?: string }>();
  const [diagnosis,  setDiagnosis]  = useState<DiagnosisResult | null>(null);
  const [coaching,   setCoaching]   = useState<CoachingResult | null>(null);
  const [scoreDelta, setScoreDelta] = useState<number>(5);
  const [lastScore,  setLastScore]  = useState<number>(78);
  const { user } = useAuth();
  const savedRef = useRef(false);

  useEffect(() => {
    let parsed: { diagnosis: DiagnosisResult | null; coaching: CoachingResult | null } = {
      diagnosis: null, coaching: null,
    };
    if (params.diagnosis) {
      try { parsed.diagnosis = JSON.parse(params.diagnosis) as DiagnosisResult; } catch { /* */ }
    }
    if (params.coaching) {
      try { parsed.coaching = JSON.parse(params.coaching) as CoachingResult; } catch { /* */ }
    }
    if (parsed.diagnosis) setDiagnosis(parsed.diagnosis);
    if (parsed.coaching)  setCoaching(parsed.coaching);

    if (parsed.diagnosis) {
      getLastScan(user?.id ?? 'guest').then(last => {
        if (last) {
          setLastScore(last.overall_score);
          setScoreDelta(Math.round(parsed.diagnosis!.overallScore - last.overall_score));
        }
      });
    }

    if (!user || !parsed.diagnosis || !parsed.coaching || savedRef.current) return;
    savedRef.current = true;
    saveScan({ userId: user.id, imageUri: params.uri ?? '', diagnosis: parsed.diagnosis, coaching: parsed.coaching });
  }, [params.diagnosis, params.coaching, user]);

  const score      = diagnosis?.overallScore ?? 0;
  const categories = diagnosis?.categories ?? [];
  const compliment = coaching?.compliment ?? '';

  const sorted = [...categories].sort((a, b) => {
    if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
    return a.score - b.score;
  });

  const pillColor = score >= 80 ? SCORE_GREEN : score >= 65 ? SCORE_GOLD : SCORE_RED;
  const pillBg    = score >= 80 ? '#EDF7F2'   : score >= 65 ? '#FFF8ED'  : '#FFF0F0';
  const phrase    = score >= 80 ? 'Looking flawless' : score >= 65 ? 'Almost there' : 'Room to grow';
  const deltaColor = scoreDelta >= 0 ? SCORE_GREEN : SCORE_RED;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={s.topBar}>
          <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={8}>
            <Text style={s.backIcon}>‹</Text>
          </Pressable>
          <Text style={s.brand}>REMAKE</Text>
          <View style={{ width: 34 }} />
        </View>

        {/* ── Centred hero ── */}
        <Animated.View entering={FadeIn.duration(500)} style={s.hero}>
          <ScoreRing score={score} visible />

          {/* Combined verdict + delta pill */}
          <View style={s.verdictRow}>
            <View style={[s.combinedPill, { borderColor: `${pillColor}50`, backgroundColor: pillBg }]}>
              <Text style={[s.combinedLabel, { color: pillColor }]}>{phrase}</Text>
              <View style={[s.combinedSep, { backgroundColor: `${pillColor}35` }]} />
              <Text style={[s.combinedDelta, { color: deltaColor }]}>
                {scoreDelta >= 0 ? '↑' : '↓'} {Math.abs(scoreDelta)}
              </Text>
            </View>
          </View>

          {compliment ? <Text style={s.compliment}>{compliment}</Text> : null}

          {/* Stats strip */}
          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={s.statNum}>{score}</Text>
              <Text style={s.statLabel}>Today</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statNum}>
                {categories.length > 0 ? Math.max(...categories.map(c => c.score)) : 0}
              </Text>
              <Text style={s.statLabel}>Best</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statNum}>
                {categories.length > 0
                  ? Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length)
                  : 0}
              </Text>
              <Text style={s.statLabel}>Average</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={[s.statNum, lastScore >= score ? { color: SCORE_RED } : { color: SCORE_GREEN }]}>
                {lastScore}
              </Text>
              <Text style={s.statLabel}>Last scan</Text>
            </View>
          </View>
        </Animated.View>

        <View style={s.divider} />

        <Animated.View entering={FadeIn.delay(200).duration(300)}>
          <Text style={s.sectionLabel}>Breakdown</Text>
        </Animated.View>

        {sorted.map((cat, i) => (
          <CategoryCard key={cat.name} cat={cat} index={i} />
        ))}

        <Animated.View entering={FadeIn.delay(700).duration(300)} style={s.actionWrap}>
          <Pressable
            style={({ pressed }) => [s.doneBtn, pressed && { opacity: 0.82 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.replace('/(main)/home');
            }}
          >
            <Text style={s.doneTxt}>Done</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: tokens.colors.cream },
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
  backIcon: { fontSize: 20, color: tokens.colors.text, lineHeight: 22 },
  brand:    { fontFamily: tokens.fonts.serif, fontSize: 18, fontWeight: '400', letterSpacing: 0.12, color: tokens.colors.text },

  hero: { alignItems: 'center', paddingVertical: 28, gap: 14 },

  verdictRow: { flexDirection: 'row', alignItems: 'center' },
  combinedPill: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 50, borderWidth: 1,
    paddingVertical: 4, paddingHorizontal: 10, gap: 6,
  },
  combinedLabel: { fontFamily: tokens.fonts.serif, fontSize: 13, fontStyle: 'italic' },
  combinedSep:   { width: 1, height: 11 },
  combinedDelta: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '700' },

  compliment: {
    fontFamily: tokens.fonts.serif, fontSize: 15, fontStyle: 'italic',
    color: tokens.colors.text, textAlign: 'center',
    lineHeight: 23, paddingHorizontal: 16,
  },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)',
    paddingVertical: 14, paddingHorizontal: 8,
    alignSelf: 'stretch',
  },
  stat:        { flex: 1, alignItems: 'center', gap: 3 },
  statNum:     { fontFamily: tokens.fonts.serif, fontSize: 20, fontWeight: '400', color: tokens.colors.pinkDeep },
  statLabel:   { fontFamily: tokens.fonts.regular, fontSize: 9, fontWeight: '500', color: tokens.colors.grayLight, textAlign: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(0,0,0,0.07)' },

  divider:      { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginBottom: 20 },
  sectionLabel: {
    fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '600',
    letterSpacing: 1.8, textTransform: 'uppercase', color: tokens.colors.grayLight,
    marginBottom: 12,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, padding: 18,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 12, gap: 12,
  },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cardHeaderText: { gap: 2 },
  cardIcon:       { fontSize: 16, color: tokens.colors.pinkDeep },
  cardName:       { fontFamily: tokens.fonts.regular, fontSize: 16, fontWeight: '600', color: tokens.colors.text },
  focusBadgeText: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '500', color: tokens.colors.pinkDeep },
  scoreNum:       { fontFamily: tokens.fonts.serif, fontSize: 28, fontWeight: '400', lineHeight: 32 },

  barTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.07)', overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 3 },

  cardTip: {
    fontFamily: tokens.fonts.regular, fontSize: 13,
    color: tokens.colors.gray, lineHeight: 20,
  },

  tutorialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 18,
    borderRadius: 50,
    backgroundColor: tokens.colors.pinkDeep,
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 10, elevation: 4,
  },
  tutorialText:  { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  tutorialArrow: { fontFamily: tokens.fonts.regular, fontSize: 16, color: '#FFFFFF' },

  actionWrap: { marginTop: 16 },
  doneBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 50,
    backgroundColor: tokens.colors.accent, alignItems: 'center',
    shadowColor: tokens.colors.accent,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5,
  },
  doneTxt: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '600', color: '#FFF9F7' },
});
