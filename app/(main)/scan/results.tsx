import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { ScoreRing } from '@/components/score-ring';
import * as Haptics from 'expo-haptics';
import type { DiagnosisResult, CoachingResult, CategoryAnalysis } from '@/lib/api/types';

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

function FocusCard({ cat, isPro }: { cat: CategoryAnalysis; isPro: boolean }) {
  const openTutorial = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(cat.tutorialQuery)}`);
  };
  const scoreColor = cat.score >= 80 ? '#2D7D46' : cat.score >= 65 ? tokens.colors.gold : '#B94040';

  return (
    <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.focusCard}>
      <View style={styles.focusLabel}>
        <Text style={styles.focusLabelText}>YOUR NEXT WIN</Text>
      </View>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardIcon}>{CATEGORY_ICONS[cat.name]}</Text>
          <Text style={styles.cardName}>{cat.name}</Text>
        </View>
        <Text style={[styles.cardScore, { color: scoreColor }]}>{cat.score}</Text>
      </View>
      <ScoreBar score={cat.score} isPriority />
      <Text style={styles.focusWinIntro}>You're this close — one small tweak here will make the biggest difference:</Text>
      <Text style={styles.focusTip}>{isPro ? cat.tip : cat.tipShort}</Text>
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

function CategoryCard({ cat, isPro, delay }: { cat: CategoryAnalysis; isPro: boolean; delay: number }) {
  const openTutorial = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(cat.tutorialQuery)}`);
  };
  const scoreColor = cat.score >= 80 ? '#2D7D46' : cat.score >= 65 ? tokens.colors.gold : '#B94040';

  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(350)} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardIcon}>{CATEGORY_ICONS[cat.name]}</Text>
          <Text style={styles.cardName}>{cat.name}</Text>
        </View>
        <Text style={[styles.cardScore, { color: scoreColor }]}>{cat.score}</Text>
      </View>
      <ScoreBar score={cat.score} isPriority={false} />
      <Text style={styles.cardTip}>{isPro ? cat.tip : cat.tipShort}</Text>
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

function getOccasionTag(score: number, verdict: string): string {
  if (score >= 85) return 'Camera-ready for any occasion ✓';
  if (verdict === 'GO') return 'Polished for everyday';
  return 'Strong for casual — refine before evening';
}

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ uri?: string; diagnosis?: string; coaching?: string }>();
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [coaching, setCoaching] = useState<CoachingResult | null>(null);
  const [scoreDelta, setScoreDelta] = useState<number | null>(null);

  const isPro = true;

  useEffect(() => {
    if (params.diagnosis) {
      try { setDiagnosis(JSON.parse(params.diagnosis) as DiagnosisResult); } catch { /* ignore */ }
    }
    if (params.coaching) {
      try { setCoaching(JSON.parse(params.coaching) as CoachingResult); } catch { /* ignore */ }
    }
  }, [params.diagnosis, params.coaching]);

  useEffect(() => {
    if (!diagnosis) return;
    const score = diagnosis.overallScore;
    AsyncStorage.getItem('last_scan_score').then(prev => {
      if (prev !== null) setScoreDelta(score - parseInt(prev, 10));
      AsyncStorage.setItem('last_scan_score', String(score));
    });
  }, [diagnosis]);

  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(main)/scan');
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(main)/home');
  };

  const overallScore = diagnosis?.overallScore ?? 0;
  const verdict = diagnosis?.verdict ?? 'GO';
  const allCategories = diagnosis?.categories ?? [];
  const compliment = coaching?.compliment ?? '';

  const priorityCat = allCategories.find(c => c.isPriority) ?? null;
  const otherCats = allCategories.filter(c => !c.isPriority);
  const colourHarmonyCat = allCategories.find(c => c.name === 'Colour Harmony') ?? null;
  const isGo = verdict === 'GO';
  const occasionTag = overallScore > 0 ? getOccasionTag(overallScore, verdict) : null;

  const deltaDisplay = scoreDelta !== null
    ? (scoreDelta > 0 ? `+${scoreDelta}` : String(scoreDelta))
    : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={handleRetake}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.brand}>REMAKE</Text>
          <View style={{ width: 34 }} />
        </View>

        {/* Score hero */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.hero}>
          <ScoreRing score={overallScore} visible />

          <View style={styles.heroMeta}>
            {deltaDisplay !== null && (
              <Animated.Text
                entering={FadeIn.delay(300).duration(400)}
                style={[styles.deltaLine, scoreDelta! > 0 ? styles.deltaLineUp : styles.deltaLineFlat]}
              >
                {scoreDelta! > 0 ? `▲ ${deltaDisplay} from last scan` : scoreDelta! === 0 ? 'Holding steady' : 'Every scan makes you better ✦'}
              </Animated.Text>
            )}

            <View style={[styles.verdictBadge, isGo ? styles.verdictGo : styles.verdictFix]}>
              <Text style={[styles.verdictText, isGo ? styles.verdictTextGo : styles.verdictTextFix]}>
                {isGo ? '✓ GO' : '⚠ FIX'}
              </Text>
            </View>

            {occasionTag && (
              <Text style={styles.occasionTag}>{occasionTag}</Text>
            )}
          </View>
        </Animated.View>

        {/* Colour harmony note */}
        {colourHarmonyCat && (
          <Animated.View entering={FadeIn.delay(350).duration(400)} style={[
            styles.harmonyBanner,
            colourHarmonyCat.score >= 80 ? styles.harmonyGood : colourHarmonyCat.score >= 65 ? styles.harmonyMid : styles.harmonyLow,
          ]}>
            <Text style={styles.harmonyIcon}>◉</Text>
            <Text style={[
              styles.harmonyText,
              colourHarmonyCat.score >= 80 ? styles.harmonyTextGood : colourHarmonyCat.score >= 65 ? styles.harmonyTextMid : styles.harmonyTextLow,
            ]}>
              {colourHarmonyCat.tipShort}
            </Text>
          </Animated.View>
        )}

        {/* Priority focus card */}
        {priorityCat && <FocusCard cat={priorityCat} isPro={isPro} />}

        {/* All other categories */}
        <Animated.View entering={FadeIn.delay(350).duration(300)}>
          <Text style={styles.sectionLabel}>All Categories</Text>
        </Animated.View>

        {otherCats.map((cat, i) => (
          <CategoryCard key={cat.name} cat={cat} isPro={isPro} delay={380 + i * 70} />
        ))}

        {/* Compliment */}
        {compliment ? (
          <Animated.View entering={FadeIn.delay(600).duration(400)} style={styles.complimentCard}>
            <Text style={styles.compliment}>{compliment}</Text>
          </Animated.View>
        ) : null}

        {/* Action buttons */}
        <Animated.View entering={FadeIn.delay(700).duration(300)} style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.retakeBtn, pressed && { opacity: 0.75 }]}
            onPress={handleRetake}
          >
            <Text style={styles.retakeText}>Re-check</Text>
          </Pressable>
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
  brand: {
    fontFamily: tokens.fonts.serif, fontSize: 18, fontWeight: '400', letterSpacing: 0.12,
    color: tokens.colors.text,
  },
  hero: { alignItems: 'center', paddingTop: 20, paddingBottom: 8 },
  heroMeta: { alignItems: 'center', gap: 10, marginTop: 16 },
  deltaLine: { fontFamily: tokens.fonts.regular, fontSize: 12, letterSpacing: 0.2 },
  deltaLineUp: { color: '#2D7D46' },
  deltaLineFlat: { color: tokens.colors.grayLight },
  verdictBadge: { paddingHorizontal: 20, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  verdictGo: { backgroundColor: '#EBF7EE', borderColor: '#2D7D46' },
  verdictFix: { backgroundColor: '#FFF4E5', borderColor: '#C47A00' },
  verdictText: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },
  verdictTextGo: { color: '#2D7D46' },
  verdictTextFix: { color: '#C47A00' },
  occasionTag: {
    fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.grayLight, textAlign: 'center',
  },
  harmonyBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderLeftWidth: 3, borderWidth: 0,
    marginBottom: 14,
  },
  harmonyGood: { backgroundColor: '#F0FAF3', borderLeftColor: '#2D7D46' },
  harmonyMid: { backgroundColor: '#FFFBEB', borderLeftColor: '#C47A00' },
  harmonyLow: { backgroundColor: '#FEF2F2', borderLeftColor: '#B94040' },
  harmonyIcon: { fontSize: 12, marginTop: 2 },
  harmonyText: { fontFamily: tokens.fonts.regular, fontSize: 12.5, lineHeight: 19, flex: 1 },
  harmonyTextGood: { color: '#2D7D46' },
  harmonyTextMid: { color: '#C47A00' },
  harmonyTextLow: { color: '#B94040' },
  focusCard: {
    backgroundColor: tokens.colors.white, borderRadius: 18, padding: 20,
    borderWidth: 1.5, borderColor: tokens.colors.pinkDeep,
    marginBottom: 16, gap: 10,
    shadowColor: tokens.colors.pinkDeep, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
  },
  focusLabel: {
    alignSelf: 'flex-start', backgroundColor: tokens.colors.blush, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3, marginBottom: 2,
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
  tutorialBtn: {
    alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 20, borderWidth: 1, borderColor: tokens.colors.pinkDeep,
  },
  tutorialText: { fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '600', color: tokens.colors.pinkDeep },
  proLock: { backgroundColor: tokens.colors.cream, borderRadius: 8, padding: 10 },
  proLockText: { fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.gray, textAlign: 'center' },
  complimentCard: {
    backgroundColor: tokens.colors.cream, borderRadius: 16, padding: 20,
    marginTop: 8, marginBottom: 4,
  },
  compliment: {
    fontFamily: tokens.fonts.serif, fontSize: 15, fontStyle: 'italic',
    color: tokens.colors.text, textAlign: 'center', lineHeight: 24,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  retakeBtn: {
    flex: 1, paddingVertical: 15, borderRadius: 50,
    borderWidth: 1.5, borderColor: tokens.colors.border, alignItems: 'center',
  },
  retakeText: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '500', color: tokens.colors.text },
  doneBtn: {
    flex: 1, paddingVertical: 15, borderRadius: 50,
    backgroundColor: tokens.colors.accent, alignItems: 'center',
  },
  doneText: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '600', color: '#FFF9F7' },
});
