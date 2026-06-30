import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { OnboardingHeader } from '@/components/onboarding-header';
import { tokens } from '@/components/theme';

function StarButton({ filled, onPress }: { filled: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPress={() => {
        scale.value = withSpring(1.35, { damping: 8 }, () => { scale.value = withSpring(1, { damping: 10 }); });
        Haptics.selectionAsync();
        onPress();
      }}
    >
      <Animated.Text style={[styles.star, filled && styles.starFilled, s]}>
        {filled ? '★' : '☆'}
      </Animated.Text>
    </Pressable>
  );
}

export default function RatingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);

  const advance = () => router.push('/(onboarding)/create-account');

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={0} total={0} onBack={() => router.back()} />
      <View style={[styles.body, { paddingTop: 20 }]}>
        <Animated.View entering={FadeIn.delay(100).duration(600)} style={styles.badgeCard}>
          <Text style={styles.badgeStars}>★★★★★</Text>
          <Text style={styles.badgeCount}>Esthetician & Skin Expert Approved</Text>
        </Animated.View>

        <Animated.Text entering={FadeInUp.delay(180).duration(500)} style={styles.title}>
          {'Give us\na rating.'}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(240).duration(500)} style={styles.sub}>
          REMAKE was built for people like you — let us know how we're doing.
        </Animated.Text>

        <Animated.View entering={FadeInUp.delay(320).duration(500)} style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(n => (
            <StarButton key={n} filled={n <= rating} onPress={() => setRating(n)} />
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(420).duration(500)} style={styles.avatarsRow}>
          {['M', 'S', 'J', 'A'].map((l, i) => (
            <View key={i} style={[styles.avatar, { marginLeft: i > 0 ? -10 : 0 }]}>
              <Text style={styles.avatarL}>{l}</Text>
            </View>
          ))}
          <Text style={styles.usersText}>  Loved by 1,000+ Beta Testers</Text>
        </Animated.View>
      </View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.bottom}>
        <Pressable
          onPress={() => {
            if (rating > 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            advance();
          }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>{rating > 0 ? 'Submit Rating' : 'Continue'}</Text>
        </Pressable>
        <Pressable onPress={advance} hitSlop={8}>
          <Text style={styles.skip}>Maybe later</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.cream },
  body: { paddingHorizontal: 28 },
  badgeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.07)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  badgeStars: { color: tokens.colors.gold, fontSize: 14 },
  badgeCount: { fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '600', color: tokens.colors.text },
  title: { fontFamily: tokens.fonts.serif, fontSize: 38, fontWeight: '400', color: tokens.colors.text, lineHeight: 50, marginBottom: 10 },
  sub: { fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '300', color: tokens.colors.gray, marginBottom: 32, lineHeight: 20 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  star: { fontSize: 44, color: tokens.colors.border },
  starFilled: { color: tokens.colors.gold },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: tokens.colors.pinkDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: tokens.colors.cream,
  },
  avatarL: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', fontFamily: tokens.fonts.regular },
  usersText: { fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.gray, marginLeft: 6 },
  bottom: { paddingHorizontal: 28, gap: 12 },
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
  ctaText: { fontFamily: tokens.fonts.regular, fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  skip: { fontFamily: tokens.fonts.regular, fontSize: 13, color: tokens.colors.gray, textAlign: 'center' },
});
