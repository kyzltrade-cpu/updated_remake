import { useEffect, useRef, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Linking,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { ScoreRing } from '@/components/score-ring';
import * as Haptics from 'expo-haptics';
import type { DiagnosisResult, CoachingResult, CategoryAnalysis } from '@/lib/api/types';
import { useAuth } from '@/contexts/AuthContext';
import { saveScan, getLastScan } from '@/lib/api/scan-storage';

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

function CategoryCard({
  cat,
  isPro,
  delay,
}: {
  cat: CategoryAnalysis;
  isPro: boolean;
  delay: number;
}) {
  const openTutorial = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(cat.tutorialQuery)}`;
    Linking.openURL(url);
  };

  const tipText = isPro ? cat.tip : cat.tipShort;
  const scoreColor = cat.score >= 80 ? '#2D7D46' : cat.score >= 65 ? tokens.colors.gold : '#B94040';

  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(350)} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardIcon}>{CATEGORY_ICONS[cat.name]}</Text>
          <Text style={styles.cardName}>{cat.name}</Text>
          {cat.isPriority && (
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>focus</Text>
            </View>
          )}
        </View>
        <Text style={[styles.cardScore, { color: scoreColor }]}>{cat.score}</Text>
      </View>

      <ScoreBar score={cat.score} isPriority={cat.isPriority} />

      <Text style={styles.cardTip}>{tipText}</Text>

      {isPro ? (
        <Pressable onPress={openTutorial} style={styles.tutorialBtn}>
          <Text style={styles.tutorialText}>Watch Tutorial →</Text>
        </Pressable>
      ) : (
        <View style={styles.proLock}>
          <Text style={styles.proLockText}>Upgrade for detailed coaching + tutorial</Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ uri?: string; diagnosis?: string; coaching?: string }>();
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [coaching, setCoaching] = useState<CoachingResult | null>(null);
  const [scoreDelta, setScoreDelta] = useState<number | null>(null);
  const { user } = useAuth();
  const savedRef = useRef(false);

  // For now always Pro (paywall not yet wired)
  const isPro = true;

  const handleBack = () => {
    router.back();
  };

  useEffect(() => {
    let parsed: { diagnosis: DiagnosisResult | null; coaching: CoachingResult | null } = {
      diagnosis: null, coaching: null,
    };
    if (params.diagnosis) {
      try { parsed.diagnosis = JSON.parse(params.diagnosis) as DiagnosisResult; } catch { /* ignore */ }
    }
    if (params.coaching) {
      try { parsed.coaching = JSON.parse(params.coaching) as CoachingResult; } catch { /* ignore */ }
    }
    if (parsed.diagnosis) setDiagnosis(parsed.diagnosis);
    if (parsed.coaching) setCoaching(parsed.coaching);

    // Always fetch delta — works with mock fallback even when not logged in
    if (parsed.diagnosis) {
      getLastScan(user?.id ?? 'guest').then(last => {
        if (last) setScoreDelta(Math.round(parsed.diagnosis!.overallScore - last.overall_score));
      });
    }

    if (!user || !parsed.diagnosis || !parsed.coaching || savedRef.current) return;
    savedRef.current = true;

    saveScan({
      userId: user.id,
      imageUri: params.uri ?? '',
      diagnosis: parsed.diagnosis,
      coaching: parsed.coaching,
    });
  }, [params.diagnosis, params.coaching, user]);

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(main)/home');
  };

  const overallScore = diagnosis?.overallScore ?? 0;
  const verdict = diagnosis?.verdict ?? 'GO';
  const categories = diagnosis?.categories ?? [];
  const compliment = coaching?.compliment ?? '';

  const isGo = verdict === 'GO';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.brand}>REMAKE</Text>
          <View style={{ width: 34 }} />
        </View>

        {/* Score hero */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.hero}>
          <ScoreRing score={overallScore} visible />

          <View style={styles.verdictRow}>
            <View style={[styles.verdictBadge, isGo ? styles.verdictGo : styles.verdictFix]}>
              <Text style={[styles.verdictText, isGo ? styles.verdictTextGo : styles.verdictTextFix]}>
                {isGo ? '✓ GO' : '⚠ FIX'}
              </Text>
            </View>
            {scoreDelta !== null && (
              <Text style={[styles.delta, scoreDelta >= 0 ? styles.deltaUp : styles.deltaDown]}>
                {scoreDelta >= 0 ? '↑' : '↓'}{Math.abs(scoreDelta)}
              </Text>
            )}
          </View>

          {compliment ? (
            <Text style={styles.compliment}>{compliment}</Text>
          ) : null}
        </Animated.View>

        {/* Category cards */}
        <Animated.View entering={FadeIn.delay(200).duration(300)}>
          <Text style={styles.sectionLabel}>Breakdown</Text>
        </Animated.View>

        {categories.map((cat, i) => (
          <CategoryCard key={cat.name} cat={cat} isPro={isPro} delay={180 + i * 70} />
        ))}

        {/* Action button */}
        <Animated.View entering={FadeIn.delay(700).duration(300)} style={styles.actionWrap}>
          <Pressable
            style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.82 }]}
            onPress={handleDone}
          >
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.white },
  content: { paddingHorizontal: 20 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: tokens.colors.cream,
    borderWidth: 1, borderColor: tokens.colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 20, color: tokens.colors.text, lineHeight: 22 },
  brand: {
    fontFamily: tokens.fonts.serif,
    fontSize: 18, fontWeight: '400', letterSpacing: 0.12,
    color: tokens.colors.text,
  },
  hero: { alignItems: 'center', paddingVertical: 32, gap: 14 },
  verdictRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  verdictBadge: {
    paddingHorizontal: 18, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
  },
  verdictGo: { backgroundColor: '#EBF7EE', borderColor: '#2D7D46' },
  verdictFix: { backgroundColor: '#FFF4E5', borderColor: '#C47A00' },
  verdictText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13, fontWeight: '700', letterSpacing: 1.5,
  },
  verdictTextGo: { color: '#2D7D46' },
  verdictTextFix: { color: '#C47A00' },
  delta: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12, fontWeight: '600', letterSpacing: 0.3,
  },
  deltaUp: { color: '#2D7D46' },
  deltaDown: { color: '#B94040' },
  compliment: {
    fontFamily: tokens.fonts.serif,
    fontSize: 15, fontStyle: 'italic',
    color: tokens.colors.text, textAlign: 'center',
    lineHeight: 23, paddingHorizontal: 16,
  },
  sectionLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11, fontWeight: '600', letterSpacing: 1.8,
    textTransform: 'uppercase', color: tokens.colors.grayLight,
    marginTop: 4, marginBottom: 12,
  },
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: tokens.colors.border,
    marginBottom: 10, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIcon: { fontSize: 14, color: tokens.colors.pinkDeep },
  cardName: {
    fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '600',
    color: tokens.colors.text,
  },
  priorityBadge: {
    backgroundColor: tokens.colors.blush, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  priorityText: {
    fontFamily: tokens.fonts.regular, fontSize: 10,
    fontWeight: '600', color: tokens.colors.pinkDeep, letterSpacing: 0.5,
  },
  cardScore: {
    fontFamily: tokens.fonts.regular, fontSize: 22, fontWeight: '700',
  },
  barTrack: {
    height: 4, borderRadius: 2, backgroundColor: tokens.colors.border, overflow: 'hidden',
  },
  barFill: {
    height: '100%', borderRadius: 2, backgroundColor: tokens.colors.pinkDeep,
  },
  barFillPriority: { backgroundColor: tokens.colors.pinkRich },
  barFillLow: { backgroundColor: '#C44' },
  cardTip: {
    fontFamily: tokens.fonts.regular, fontSize: 13,
    color: tokens.colors.text, lineHeight: 20,
  },
  tutorialBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 20, borderWidth: 1,
    borderColor: tokens.colors.pinkDeep,
  },
  tutorialText: {
    fontFamily: tokens.fonts.regular, fontSize: 12,
    fontWeight: '600', color: tokens.colors.pinkDeep,
  },
  proLock: {
    backgroundColor: tokens.colors.cream, borderRadius: 8, padding: 10,
  },
  proLockText: {
    fontFamily: tokens.fonts.regular, fontSize: 12,
    color: tokens.colors.gray, textAlign: 'center',
  },
  actionWrap: { marginTop: 24 },
  doneBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 50,
    backgroundColor: tokens.colors.accent, alignItems: 'center',
  },
  doneText: {
    fontFamily: tokens.fonts.regular, fontSize: 13,
    fontWeight: '600', color: '#FFF9F7',
  },
});
