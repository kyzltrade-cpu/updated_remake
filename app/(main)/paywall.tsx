import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';

type Plan = 'weekly' | 'monthly' | 'yearly';

const PLANS: { id: Plan; label: string; price: string; sub: string; savings?: string; anchor?: boolean }[] = [
  {
    id: 'weekly',
    label: 'Weekly',
    price: '$2.99',
    sub: 'per week',
    anchor: true,
  },
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$5.99',
    sub: 'per month',
  },
  {
    id: 'yearly',
    label: 'Annual',
    price: '$49.99',
    sub: 'per year',
    savings: 'Save 68% vs weekly',
  },
];

const VALUE_BULLETS = [
  '✦  Detailed coaching per category',
  '✦  Watch Tutorial for every tip',
  '✦  Full DNA Reveal (8 slides)',
  '✦  Archetype identity card',
  '✦  Unlimited scans',
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<Plan>('yearly');
  const [loading, setLoading] = useState(false);

  const handleSelect = (plan: Plan) => {
    Haptics.selectionAsync();
    setSelectedPlan(plan);
  };

  const handleSubscribe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    // TODO: wire RevenueCat purchase flow
    // After payment: create account → dna-loading (no URI = calls Gemini API)
    setTimeout(() => {
      setLoading(false);
      router.replace('/(onboarding)/create-account');
    }, 1200);
  };

  const handleRestore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: RevenueCat restorePurchases
  };

  const handleClose = () => {
    router.back();
  };

  const handleDevBypass = () => {
    router.replace({ pathname: '/(main)/dna-reveal', params: { bypass: '1' } } as any);
  };

  const selected = PLANS.find(p => p.id === selectedPlan)!;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#1A1715', '#2A1A1A', '#1A1715']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Close */}
        <Pressable style={styles.closeBtn} onPress={handleClose}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        {/* Hero */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.hero}>
          <Text style={styles.eyebrow}>Your makeup DNA is ready.</Text>
          <Text style={styles.heading}>Unlock your full{'\n'}beauty profile</Text>
          <Text style={styles.sub}>
            Everything you need to look intentional, every day.
          </Text>
        </Animated.View>

        {/* Value bullets */}
        <Animated.View entering={FadeInUp.delay(150).duration(500)} style={styles.bullets}>
          {VALUE_BULLETS.map((b, i) => (
            <Text key={i} style={styles.bullet}>{b}</Text>
          ))}
        </Animated.View>

        {/* Plan picker */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.plans}>
          {PLANS.map(plan => (
            <Pressable
              key={plan.id}
              onPress={() => handleSelect(plan.id)}
              style={[
                styles.plan,
                selectedPlan === plan.id && styles.planSelected,
              ]}
            >
              <View style={styles.planLeft}>
                <View style={[styles.radio, selectedPlan === plan.id && styles.radioSelected]}>
                  {selectedPlan === plan.id && <View style={styles.radioDot} />}
                </View>
                <View>
                  <View style={styles.planLabelRow}>
                    <Text style={[styles.planLabel, selectedPlan === plan.id && styles.planLabelSelected]}>
                      {plan.label}
                    </Text>
                    {plan.savings && (
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>{plan.savings}</Text>
                      </View>
                    )}
                    {plan.anchor && (
                      <Text style={styles.anchorText}>most popular</Text>
                    )}
                  </View>
                  <Text style={[styles.planSub, selectedPlan === plan.id && styles.planSubSelected]}>
                    {plan.sub}
                  </Text>
                </View>
              </View>
              <Text style={[styles.planPrice, selectedPlan === plan.id && styles.planPriceSelected]}>
                {plan.price}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeIn.delay(500).duration(400)} style={styles.ctaWrap}>
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.88 }, loading && { opacity: 0.6 }]}
            onPress={handleSubscribe}
            disabled={loading}
          >
            <Text style={styles.ctaText}>
              {loading ? 'Processing...' : `Start for ${selected.price} / ${selected.sub.split(' ').pop()}`}
            </Text>
          </Pressable>

          <Text style={styles.legalNote}>
            Cancel anytime in App Store settings. No commitment.
          </Text>

          <Pressable onPress={handleRestore}>
            <Text style={styles.restore}>Restore purchases</Text>
          </Pressable>

          {__DEV__ && (
            <Pressable onPress={handleDevBypass} style={styles.devBypass}>
              <Text style={styles.devBypassText}>⚙ Dev: Skip paywall</Text>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1A1715' },
  content: { paddingHorizontal: 28 },
  closeBtn: {
    alignSelf: 'flex-end', marginTop: 16,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  closeText: { color: '#FFF9F7', fontSize: 14 },
  hero: { marginTop: 32, gap: 10 },
  eyebrow: {
    fontFamily: 'Inter', fontSize: 12, fontWeight: '600',
    color: '#C8A882', letterSpacing: 1.5, textTransform: 'uppercase',
  },
  heading: {
    fontFamily: 'Playfair Display', fontSize: 36, color: '#FFF9F7', lineHeight: 46,
  },
  sub: {
    fontFamily: 'Inter', fontSize: 15, color: 'rgba(255,249,247,0.65)', lineHeight: 23,
  },
  bullets: { marginTop: 28, gap: 10 },
  bullet: {
    fontFamily: 'Inter', fontSize: 14, color: 'rgba(255,249,247,0.85)', lineHeight: 22,
  },
  plans: { marginTop: 32, gap: 10 },
  plan: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  planSelected: {
    backgroundColor: 'rgba(200,168,130,0.14)',
    borderColor: '#C8A882',
  },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: 'rgba(255,249,247,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  radioSelected: { borderColor: '#C8A882' },
  radioDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#C8A882' },
  planLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  planLabel: {
    fontFamily: 'Inter', fontSize: 15, fontWeight: '600',
    color: 'rgba(255,249,247,0.75)',
  },
  planLabelSelected: { color: '#FFF9F7' },
  planSub: {
    fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,249,247,0.4)',
    marginTop: 2,
  },
  planSubSelected: { color: 'rgba(255,249,247,0.65)' },
  savingsBadge: {
    backgroundColor: 'rgba(200,168,130,0.25)', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  savingsText: {
    fontFamily: 'Inter', fontSize: 10, fontWeight: '700',
    color: '#C8A882',
  },
  anchorText: {
    fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,249,247,0.45)',
    fontStyle: 'italic',
  },
  planPrice: {
    fontFamily: 'Inter', fontSize: 18, fontWeight: '700',
    color: 'rgba(255,249,247,0.6)',
  },
  planPriceSelected: { color: '#FFF9F7' },
  ctaWrap: { marginTop: 28, gap: 14, alignItems: 'center' },
  cta: {
    width: '100%', backgroundColor: '#C8A882',
    borderRadius: 30, paddingVertical: 18, alignItems: 'center',
  },
  ctaText: {
    fontFamily: 'Inter', fontSize: 16, fontWeight: '700', color: '#1A1715',
  },
  legalNote: {
    fontFamily: 'Inter', fontSize: 11,
    color: 'rgba(255,249,247,0.4)', textAlign: 'center',
  },
  restore: {
    fontFamily: 'Inter', fontSize: 12,
    color: 'rgba(255,249,247,0.45)', textDecorationLine: 'underline',
  },
  devBypass: {
    marginTop: 8,
    paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  devBypassText: {
    fontFamily: 'Inter', fontSize: 11,
    color: 'rgba(255,249,247,0.35)',
    letterSpacing: 0.3,
  },
});
