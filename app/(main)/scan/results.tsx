import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { ScoreRing } from '@/components/score-ring';
import { CategoryItem } from '@/components/category-item';
import { SuggestionItem } from '@/components/suggestion-item';
import * as Haptics from 'expo-haptics';
import type { DiagnosisResult, CoachingResult } from '@/lib/api/types';

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string; diagnosis?: string; coaching?: string }>();
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [coaching, setCoaching] = useState<CoachingResult | null>(null);

  useEffect(() => {
    // Parse data passed from loading page
    if (params.diagnosis) {
      try {
        setDiagnosis(JSON.parse(params.diagnosis) as DiagnosisResult);
      } catch (e) {
        console.error('Failed to parse diagnosis:', e);
      }
    }
    if (params.coaching) {
      try {
        setCoaching(JSON.parse(params.coaching) as CoachingResult);
      } catch (e) {
        console.error('Failed to parse coaching:', e);
      }
    }
  }, [params.diagnosis, params.coaching]);

  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(main)/scan');
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(main)/home');
  };

  const getCompliment = (score: number): string => {
    if (score >= 90) return 'Absolutely stunning execution — your makeup artistry is impeccable and camera-ready.';
    if (score >= 80) return 'Beautiful work with excellent technique — subtle refinements will elevate it further.';
    return 'Great foundation to build on — targeted adjustments will make your look truly shine.';
  };

  const categories = diagnosis?.categories ?? [];
  const suggestions = coaching?.suggestions ?? [];
  const overallScore = diagnosis?.overallScore ?? 0;
  const compliment = coaching?.compliment ?? getCompliment(overallScore);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={handleRetake}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.brand}>REMAKE</Text>
          <View style={styles.spacer} />
        </View>

        <Animated.View entering={FadeIn.duration(400)} style={styles.hero}>
          <ScoreRing score={overallScore} visible />
          <Animated.View entering={FadeIn.duration(400)} style={styles.complimentArea}>
            <Text style={styles.compliment}>{compliment}</Text>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(300)}>
          <View style={styles.divider} />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(80).duration(300)}>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Breakdown</Text>
            {categories.map((cat, i) => (
              <CategoryItem key={cat.name} name={cat.name} score={cat.score} description={cat.description} delay={i} />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(160).duration(300)}>
          <View style={styles.divider} />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(220).duration(300)}>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Suggestions</Text>
            {suggestions.map((s, i) => (
              <SuggestionItem key={i} text={s.text} emphasis={s.emphasis} delay={i + 4} />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(280).duration(300)}>
          <View style={styles.bottomCta}>
            <Pressable style={styles.retakeBtn} onPress={handleRetake}>
              <Text style={styles.retakeText}>Retake</Text>
            </Pressable>
            <Pressable style={styles.doneBtn} onPress={handleDone}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.white },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 50 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 14, backgroundColor: tokens.colors.white },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: tokens.colors.cream, borderWidth: 1, borderColor: tokens.colors.border, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 20, color: tokens.colors.text },
  brand: { fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '500', letterSpacing: 0.12, textTransform: 'uppercase', color: tokens.colors.gray },
  spacer: { width: 34 },
  hero: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 28 },
  complimentArea: { marginTop: 24, paddingHorizontal: 20 },
  compliment: { fontFamily: tokens.fonts.serif, fontSize: 15, fontStyle: 'italic', color: tokens.colors.text, textAlign: 'center', lineHeight: 24 },
  divider: { height: 1, marginHorizontal: 28, backgroundColor: tokens.colors.pinkDeep, opacity: 0.15 },
  section: { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 8 },
  sectionHeader: { fontFamily: tokens.fonts.regular, fontSize: 11, letterSpacing: 0.16, textTransform: 'uppercase', color: tokens.colors.grayLight, fontWeight: '500', marginBottom: 20 },
  bottomCta: { flexDirection: 'row', gap: 10, paddingHorizontal: 28, paddingTop: 16 },
  retakeBtn: { flex: 1, paddingVertical: 15, borderRadius: 50, borderWidth: 1, borderColor: tokens.colors.border, alignItems: 'center', backgroundColor: 'transparent' },
  retakeText: { fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '500', letterSpacing: 0.1, textTransform: 'uppercase', color: tokens.colors.text },
  doneBtn: { flex: 1, paddingVertical: 15, borderRadius: 50, borderWidth: 1, borderColor: tokens.colors.goldSoft, alignItems: 'center', backgroundColor: tokens.colors.white, shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  doneText: { fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '500', letterSpacing: 0.1, textTransform: 'uppercase', color: tokens.colors.gold },
});