import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { OnboardingHeader } from '@/components/onboarding-header';
import { tokens } from '@/components/theme';

const REVIEWS = [
  {
    name: 'Mia T.',
    stars: 5,
    text: 'First scan nailed my shade. I\'ve been buying the wrong foundation for three years.',
  },
  {
    name: 'Sarah K.',
    stars: 5,
    text: 'Stopped guessing, stopped wasting money. My routine finally makes sense.',
  },
  {
    name: 'Priya R.',
    stars: 5,
    text: 'The ingredient screening alone is worth it. My skin hasn\'t reacted once since I started using it.',
  },
];

export default function SocialProofScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={12} total={18} onBack={() => router.back()} />

      <View style={styles.body}>
        <Animated.View entering={FadeIn.delay(100).duration(600)} style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeStar}>★★★★★</Text>
            <Text style={styles.badgeText}>4.9 on the App Store</Text>
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInUp.delay(180).duration(500)} style={styles.title}>
          {'Real people.\nReal results.'}
        </Animated.Text>

        <View style={styles.reviews}>
          {REVIEWS.map((r, i) => (
            <Animated.View
              key={r.name}
              entering={FadeInUp.delay(280 + i * 70).duration(480)}
              style={styles.reviewCard}
            >
              <View style={styles.reviewTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>{r.name[0]}</Text>
                </View>
                <View style={styles.reviewMeta}>
                  <Text style={styles.reviewName}>{r.name}</Text>
                  <Text style={styles.stars}>{'★'.repeat(r.stars)}</Text>
                </View>
              </View>
              <Text style={styles.reviewText}>{r.text}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInUp.delay(520).duration(500)} style={styles.bottom}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/pain-point');
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
  badgeRow: { marginBottom: 16 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  badgeStar: { color: tokens.colors.gold, fontSize: 12 },
  badgeText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.text,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 32,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 42,
    marginBottom: 22,
  },
  reviews: { gap: 10 },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 16,
    gap: 10,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: tokens.colors.pinkDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewMeta: { gap: 1 },
  reviewName: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.text,
  },
  stars: { color: tokens.colors.gold, fontSize: 11 },
  reviewText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '300',
    color: tokens.colors.text,
    lineHeight: 20,
  },
  bottom: { paddingHorizontal: 28 },
  cta: {
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 7,
  },
  ctaText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
