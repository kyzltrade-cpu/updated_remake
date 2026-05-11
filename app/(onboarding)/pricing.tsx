import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import { OnboardingPagination } from '@/components/onboarding-pagination';
import * as Haptics from 'expo-haptics';

type Plan = 'weekly' | 'yearly';

const WEEKLY_PRICE = '$4.99';
const YEARLY_PRICE = '$39.99';
const YEARLY_EQUIV = '$0.77';
const YEARLY_SAVINGS = 'Save 33%';

export default function PricingScreen() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>('yearly');

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
        <Text style={styles.tag}>Choose Your Plan</Text>
      </Animated.View>

      {/* Toggle */}
      <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.toggleWrap}>
        <View style={styles.toggle}>
          <Pressable
            style={[styles.toggleOption, plan === 'weekly' && styles.toggleOptionActive]}
            onPress={() => { Haptics.selectionAsync(); setPlan('weekly'); }}
          >
            <Text style={[styles.toggleText, plan === 'weekly' && styles.toggleTextActive]}>Weekly</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleOption, plan === 'yearly' && styles.toggleOptionActive]}
            onPress={() => { Haptics.selectionAsync(); setPlan('yearly'); }}
          >
            <Text style={[styles.toggleText, plan === 'yearly' && styles.toggleTextActive]}>Yearly</Text>
            <View style={[styles.saveChip, plan === 'yearly' && styles.saveChipActive]}>
              <Text style={styles.saveChipText}>Best Value</Text>
            </View>
          </Pressable>
        </View>
      </Animated.View>

      {/* Plan card */}
      <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.cardWrap}>
        <Pressable
          style={[styles.planCard, plan === 'yearly' && styles.planCardActive]}
          onPress={() => { Haptics.selectionAsync(); setPlan('yearly'); }}
        >
          <Text style={styles.price}>
            {plan === 'weekly' ? WEEKLY_PRICE : YEARLY_PRICE}
            <Text style={styles.period}> /{plan === 'weekly' ? 'week' : 'year'}</Text>
          </Text>
          {plan === 'yearly' && (
            <Text style={styles.equiv}>{YEARLY_EQUIV}/week · {YEARLY_SAVINGS}</Text>
          )}
        </Pressable>
      </Animated.View>

      {/* Plan note */}
      <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.note}>
        {plan === 'yearly' ? (
          <Text style={styles.noteText}>7-day free trial included. Cancel anytime.</Text>
        ) : (
          <Text style={styles.noteText}>No trial. Start using REMAKE today.</Text>
        )}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.bottom}>
        <GlassButton
          title="Start Free Scan"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(onboarding)/create-account');
          }}
          variant="primary"
          style={styles.cta}
        />
        <OnboardingPagination total={10} current={4} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.beige,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 50,
  },
  header: { alignItems: 'center', marginBottom: 32 },
  tag: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    letterSpacing: 0.16,
    textTransform: 'uppercase',
    color: tokens.colors.gray,
    fontWeight: '500',
  },

  // Toggle
  toggleWrap: { alignItems: 'center', marginBottom: 28 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.white,
    borderRadius: 14,
    padding: 4,
    gap: 2,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 10,
    gap: 8,
  },
  toggleOptionActive: {
    backgroundColor: tokens.colors.text,
  },
  toggleText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '500',
    color: tokens.colors.gray,
  },
  toggleTextActive: {
    color: tokens.colors.white,
  },
  saveChip: {
    backgroundColor: tokens.colors.pinkLight + '60',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saveChipActive: {
    backgroundColor: tokens.colors.gold,
  },
  saveChipText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 9,
    fontWeight: '600',
    color: tokens.colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.05,
  },

  // Card
  cardWrap: { alignItems: 'center', marginBottom: 20 },
  planCard: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 48,
    borderRadius: 20,
    backgroundColor: tokens.colors.white,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
  },
  planCardActive: {
    borderColor: tokens.colors.gold,
    backgroundColor: tokens.colors.ivory,
  },
  price: {
    fontFamily: tokens.fonts.serif,
    fontSize: 36,
    fontWeight: '400',
    color: tokens.colors.text,
  },
  period: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '300',
    color: tokens.colors.gray,
  },
  equiv: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    color: tokens.colors.gold,
    marginTop: 6,
    fontWeight: '500',
  },

  // Note
  note: { alignItems: 'center', marginBottom: 0 },
  noteText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: tokens.colors.gray,
    fontWeight: '300',
  },

  // Bottom
  bottom: { alignItems: 'center', gap: 12, marginTop: 'auto' },
  cta: { width: '100%' },
});