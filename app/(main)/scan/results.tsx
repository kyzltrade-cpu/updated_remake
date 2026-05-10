import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { ScoreRing } from '@/components/score-ring';
import { CategoryItem } from '@/components/category-item';
import { SuggestionItem } from '@/components/suggestion-item';
import { LoadingOverlay } from '@/components/loading-overlay';
import * as Haptics from 'expo-haptics';

const MOCK_CATEGORIES = [
  { name: 'Complexion', score: 92, description: 'Foundation match, blending, texture, coverage & skin finish.' },
  { name: 'Eyes', score: 85, description: 'Shadow blending, liner precision, lash definition & brow shape.' },
  { name: 'Lips', score: 88, description: 'Color accuracy, lip line precision, symmetry & application evenness.' },
  { name: 'Sculpt & Glow', score: 80, description: 'Contour placement, blush positioning, highlight & bronzer diffusion.' },
];

const MOCK_SUGGESTIONS = [
  { text: 'Blend your base along the jawline — the transition should be invisible in natural light.', emphasis: 'transition should be invisible' },
  { text: 'Soften the outer-V eyeshadow edge with a clean brush for a seamless diffusion.', emphasis: 'seamless diffusion' },
  { text: 'Bring blush placement slightly higher toward the temples to lift the face shape.', emphasis: 'lift the face shape' },
];

const COMPLIMENTS: Record<string, string> = {
  flawless: 'Absolutely stunning execution — your makeup artistry is impeccable and camera-ready.',
  strong: 'Beautiful work with excellent technique — subtle refinements will elevate it further.',
  refine: 'Great foundation to build on — targeted adjustments will make your look truly shine.',
};

export default function ResultsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(main)/scan');
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(main)/home');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingOverlay visible={loading} />
      </View>
    );
  }

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

        <Animated.View entering={FadeInUp.delay(100).duration(800)} style={styles.hero}>
          <ScoreRing score={99} visible />
          <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.complimentArea}>
            <Text style={styles.compliment}>{COMPLIMENTS.strong}</Text>
          </Animated.View>
        </Animated.View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Breakdown</Text>
          {MOCK_CATEGORIES.map((cat, i) => (
            <CategoryItem key={cat.name} name={cat.name} score={cat.score} description={cat.description} delay={i} />
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Suggestions</Text>
          {MOCK_SUGGESTIONS.map((s, i) => (
            <SuggestionItem key={i} text={s.text} emphasis={s.emphasis} delay={i + 4} />
          ))}
        </View>

        <View style={styles.bottomCta}>
          <Pressable style={styles.retakeBtn} onPress={handleRetake}>
            <Text style={styles.retakeText}>Retake</Text>
          </Pressable>
          <Pressable style={styles.doneBtn} onPress={handleDone}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>
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