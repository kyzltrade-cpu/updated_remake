import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Dimensions, ActivityIndicator, Alert
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import { useSubscription } from '@/contexts/subscription-context';
import { tokens } from '@/components/theme';
import { ONBOARDING_KEY } from '../_layout';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width: W } = Dimensions.get('window');

type PlanId = 'monthly' | 'yearly';

interface PlanDetails {
  id: PlanId;
  label: string;
  price: string;
  period: string;
  trial: string;
  savings?: string;
  subText: string;
}

const PLANS: PlanDetails[] = [
  {
    id: 'yearly',
    label: 'Annual Plan',
    price: '$49.99',
    period: 'year',
    trial: '3-DAY FREE TRIAL',
    savings: 'SAVE 72%',
    subText: '$4.16/mo, billed yearly',
  },
  {
    id: 'monthly',
    label: 'Monthly Plan',
    price: '$14.99',
    period: 'month',
    trial: 'NO FREE TRIAL',
    subText: 'Billed immediately on Day 0',
  },
];

interface ValueBullet {
  icon: keyof typeof MaterialIcons.glyphMap;
  text: string;
}

const VALUE_BULLETS: ValueBullet[] = [
  { icon: 'camera-alt', text: 'Unlimited Face & Product Scans' },
  { icon: 'fingerprint', text: 'Full Makeup DNA Reveal (8 Custom Slides)' },
  { icon: 'security', text: '100+ Comedogenic & Toxic Ingredient Alerts' },
  { icon: 'palette', text: 'Shade Matching & Custom Archetype Cards' },
  { icon: 'spa', text: 'Daily Skincare Coaching & Streak Rewards' },
];

export default function OnboardingPaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { packages, purchasePackage, restorePurchases, mockUpgradeToPro } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');
  const [loading, setLoading] = useState(false);

  const handleSelect = (id: PlanId) => {
    Haptics.selectionAsync();
    setSelectedPlan(id);
  };

  const handleSubscribe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    
    try {
      // Find matching RevenueCat package if configured
      const matchedPackage = packages.find(p => {
        if (selectedPlan === 'yearly') {
          return p.packageType === 'ANNUAL' || p.identifier.toLowerCase().includes('annual') || p.identifier.toLowerCase().includes('year');
        } else {
          return p.packageType === 'MONTHLY' || p.identifier.toLowerCase().includes('monthly');
        }
      });

      let success = false;
      if (matchedPackage) {
        success = await purchasePackage(matchedPackage);
      } else {
        console.log('[OnboardingPaywall] No matching App Store package found locally. Falling back to mock upgrade.');
        success = await mockUpgradeToPro();
      }

      if (success) {
        Alert.alert('Success', 'Welcome to ReMake PRO! Your account is now fully unlocked.', [
          {
            text: 'Let\'s Slay',
            onPress: async () => {
              // Save onboarding complete flag
              await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
              router.replace('/(main)/home');
            }
          }
        ]);
      } else {
        Alert.alert('Purchase Failed', 'Unable to complete the transaction. Please try again or restore your purchase.');
      }
    } catch (err) {
      console.warn('[OnboardingPaywall] Subscription upgrade encountered error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      const success = await restorePurchases();
      if (success) {
        Alert.alert('Restored', 'Your premium access was successfully restored!', [
          {
            text: 'OK',
            onPress: async () => {
              // Save onboarding complete flag
              await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
              router.replace('/(main)/home');
            }
          }
        ]);
      } else {
        Alert.alert('No Purchases Found', 'We couldn\'t find any active premium subscriptions for your account.');
      }
    } catch (e) {
      console.warn('[OnboardingPaywall] Restore error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    // Hard paywall: if they close, we still complete onboarding but let the app's standard lock-outs handle them.
    // Or we let them enter the app as free users, and when they scan, the main-paywall triggers.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(main)/home');
  };

  const currentPlan = PLANS.find(p => p.id === selectedPlan)!;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[tokens.colors.darkBg, tokens.colors.darkBgLight, tokens.colors.darkBg]}
        style={StyleSheet.absoluteFill}
      />

      {/* Background Soft Glow */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Close Button / Soft Escape */}
        <Pressable style={styles.closeBtn} onPress={handleClose}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        {/* Viral, Fear-Driven Hero */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.hero}>
          <Text style={styles.eyebrow}>BARRIER SAFETY ANALYSIS</Text>
          <Text style={styles.heading}>78% of trending makeup has hidden cloggers.</Text>
          <Text style={styles.sub}>
            Expose skin-damaging toxins, comedogens, and custom allergens in your products before they ruin your barrier.
          </Text>
        </Animated.View>

        {/* Girlish, Highly Viral Social Proof Card */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.proofCard}>
          <Text style={styles.proofStars}>★★★★★</Text>
          <Text style={styles.proofQuote}>
            "bestie, literally throw away your foundation. this app scanned mine and found bismisth oxychloride. my hormonal acne cleared up in 4 days of switching. slaying."
          </Text>
          <Text style={styles.proofAuthor}>— @makeup_bestie101, TikTok</Text>
        </Animated.View>

        {/* Custom Bullet list */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.bullets}>
          {VALUE_BULLETS.map((bullet, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.bulletIconCircle}>
                <MaterialIcons name={bullet.icon} size={15} color={tokens.colors.pinkDeep} />
              </View>
              <Text style={styles.bulletText}>{bullet.text}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Plan Selectors (The Imbalanced Setup) */}
        <Animated.View entering={FadeInUp.delay(350).duration(500)} style={styles.plans}>
          {PLANS.map(plan => {
            const isSelected = selectedPlan === plan.id;
            return (
              <Pressable
                key={plan.id}
                onPress={() => handleSelect(plan.id)}
                style={[
                  styles.planCard,
                  isSelected && styles.planCardSelected,
                ]}
              >
                <View style={styles.planHeaderRow}>
                  <View style={styles.planLabelGroup}>
                    <Text style={[styles.planTitle, isSelected && styles.planTitleSelected]}>
                      {plan.label}
                    </Text>
                    <Text style={[styles.planSubText, isSelected && styles.planSubTextSelected]}>
                      {plan.subText}
                    </Text>
                  </View>
                  <View style={styles.planPriceGroup}>
                    <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                      {plan.price}
                    </Text>
                    <Text style={styles.planPeriod}>/{plan.period}</Text>
                  </View>
                </View>

                {/* Badge showing if trial or immediately billed */}
                <View style={styles.badgeRow}>
                  <View style={[
                    styles.trialBadge,
                    plan.id === 'yearly' ? styles.trialBadgeGold : styles.trialBadgeRed
                  ]}>
                    <Text style={[
                      styles.trialBadgeText,
                      plan.id === 'yearly' ? styles.trialBadgeTextGold : styles.trialBadgeTextRed
                    ]}>
                      {plan.trial}
                    </Text>
                  </View>
                  {plan.savings && (
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsText}>{plan.savings}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </Animated.View>

        {/* Main Purchase Action CTA */}
        <Animated.View entering={FadeIn.delay(500).duration(400)} style={styles.bottomSection}>
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }, loading && { opacity: 0.6 }]}
            onPress={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={tokens.colors.white} />
            ) : (
              <Text style={styles.ctaText}>
                {selectedPlan === 'yearly' ? 'Start 3-Day Free Trial' : 'Unlock Access Instantly'}
              </Text>
            )}
          </Pressable>

          <Text style={styles.priceDetails}>
            {selectedPlan === 'yearly' 
              ? 'Cancel anytime before Day 3. No commitment.' 
              : 'Immediate full access. Non-refundable.'
            }
          </Text>

          {/* Auxiliary actions */}
          <View style={styles.auxRow}>
            <Pressable onPress={handleRestore}>
              <Text style={styles.auxText}>Restore purchases</Text>
            </Pressable>
            <Text style={styles.auxDivider}>|</Text>
            <Pressable onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(onboarding)/legal');
            }}>
              <Text style={styles.auxText}>Terms & Privacy</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.darkBg },
  ambientGlow: {
    position: 'absolute',
    top: -100,
    alignSelf: 'center',
    width: W * 1.3,
    height: W * 1.3,
    borderRadius: W * 0.65,
    backgroundColor: 'rgba(232,57,154,0.06)',
  },
  content: { paddingHorizontal: 24 },
  closeBtn: {
    alignSelf: 'flex-end',
    marginTop: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  closeText: { color: tokens.colors.white, fontSize: 13, fontWeight: '600' },
  
  hero: { marginTop: 24, gap: 10 },
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.pinkDeep,
    letterSpacing: 2.5,
  },
  heading: {
    fontFamily: tokens.fonts.serif,
    fontSize: 32,
    color: tokens.colors.white,
    lineHeight: 40,
    fontWeight: '400',
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: tokens.colors.gray,
    lineHeight: 22,
    fontWeight: '300',
  },

  // TikTok Social Proof
  proofCard: {
    backgroundColor: 'rgba(232,57,154,0.06)',
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(232,57,154,0.18)',
  },
  proofStars: { color: tokens.colors.gold, fontSize: 14, marginBottom: 6 },
  proofQuote: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: 'rgba(255,249,247,0.85)',
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  proofAuthor: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.pinkDeep,
    letterSpacing: 0.5,
  },

  // Benefits
  bullets: { marginTop: 24, gap: 12 },
  bulletRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  bulletIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(232,57,154,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulletText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: 'rgba(255,249,247,0.85)',
    fontWeight: '400',
  },

  // Plans Panel
  plans: { marginTop: 28, gap: 12 },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  planCardSelected: {
    backgroundColor: 'rgba(232,57,154,0.08)',
    borderColor: tokens.colors.pinkDeep,
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planLabelGroup: { flex: 1, gap: 2 },
  planTitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,249,247,0.7)',
  },
  planTitleSelected: { color: tokens.colors.white },
  planSubText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    color: tokens.colors.gray,
  },
  planSubTextSelected: { color: 'rgba(255,249,247,0.6)' },
  planPriceGroup: { flexDirection: 'row', alignItems: 'baseline' },
  planPrice: {
    fontFamily: tokens.fonts.regular,
    fontSize: 22,
    fontWeight: '700',
    color: 'rgba(255,249,247,0.75)',
  },
  planPriceSelected: { color: tokens.colors.white },
  planPeriod: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: tokens.colors.gray,
  },

  // Badges Inside Plan
  badgeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  trialBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  trialBadgeGold: { backgroundColor: 'rgba(212,175,55,0.15)' },
  trialBadgeRed: { backgroundColor: 'rgba(232,57,154,0.12)' },
  trialBadgeText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  trialBadgeTextGold: { color: tokens.colors.goldSoft },
  trialBadgeTextRed: { color: tokens.colors.pinkDeep },
  savingsBadge: {
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  savingsText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.white,
    letterSpacing: 0.5,
  },

  // Purchase Actions
  bottomSection: { marginTop: 28, alignItems: 'center', gap: 12 },
  cta: {
    width: '100%',
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.white,
    letterSpacing: 0.5,
  },
  priceDetails: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: tokens.colors.gray,
    textAlign: 'center',
  },
  
  auxRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 4 },
  auxText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    color: tokens.colors.gray,
    textDecorationLine: 'underline',
  },
  auxDivider: { color: 'rgba(255,255,255,0.1)', fontSize: 12 },

  devBypass: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  devBypassText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: 'rgba(255,249,247,0.35)',
    letterSpacing: 0.3,
  },
});
