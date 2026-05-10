import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import { OnboardingPagination } from '@/components/onboarding-pagination';
import * as Haptics from 'expo-haptics';

const PLANS = [
  { label: 'Weekly', price: '$4.99', sub: '/week' },
  { label: 'Yearly', price: '$39.99', sub: '/year', popular: true },
];

export default function PricingScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState(1);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
        <Text style={styles.tag}>Choose Your Plan</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.plans}>
        {PLANS.map((plan, i) => (
          <Pressable key={i} onPress={() => { Haptics.selectionAsync(); setSelected(i); }}>
            <Animated.View entering={FadeInUp.delay(300 + i * 100).duration(600)} style={[styles.planCard, plan.popular && styles.planCardPopular, selected === i && styles.planCardSelected]}>
              {plan.popular && <Text style={styles.popularBadge}>Best Value</Text>}
              <Text style={styles.planLabel}>{plan.label}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
              <Text style={styles.planSub}>{plan.sub}</Text>
            </Animated.View>
          </Pressable>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.bottom}>
        <GlassButton title="Start Free Scan" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(onboarding)/create-account'); }} variant="primary" style={styles.cta} />
        <Text style={styles.tos}>Cancel anytime. 7-day free trial on annual plan.</Text>
        <OnboardingPagination total={10} current={4} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.beige, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 50 },
  header: { alignItems: 'center', marginBottom: 36 },
  tag: { fontFamily: tokens.fonts.regular, fontSize: 11, letterSpacing: 0.16, textTransform: 'uppercase', color: tokens.colors.gray, fontWeight: '500' },
  plans: { flex: 1, flexDirection: 'row', gap: 14 },
  planCard: { flex: 1, backgroundColor: tokens.colors.white, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: tokens.colors.border, justifyContent: 'center', alignItems: 'center' },
  planCardPopular: { borderColor: tokens.colors.gold, borderWidth: 1.5, backgroundColor: tokens.colors.ivory },
  planCardSelected: { borderColor: tokens.colors.gold, borderWidth: 2, backgroundColor: tokens.colors.ivory },
  popularBadge: { fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '600', letterSpacing: 0.1, textTransform: 'uppercase', color: tokens.colors.gold, backgroundColor: tokens.colors.goldSoft + '40', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 12, overflow: 'hidden' },
  planLabel: { fontFamily: tokens.fonts.regular, fontSize: 13, color: tokens.colors.gray, marginBottom: 8 },
  planPrice: { fontFamily: tokens.fonts.serif, fontSize: 26, fontWeight: '400', color: tokens.colors.text },
  planSub: { fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.grayLight },
  bottom: { alignItems: 'center', gap: 12 },
  cta: { width: '100%' },
  tos: { fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.grayLight, textAlign: 'center' },
});