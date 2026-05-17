import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import * as Haptics from 'expo-haptics';

const TESTIMONIALS = [
  {
    name: 'Ava M.',
    initial: 'A',
    avatarColor: '#D4A096',
    text: '"My contour looked perfect in selfies but terrible in daylight. REMAKE showed me exactly where the blend was off."',
  },
  {
    name: 'Sofia R.',
    initial: 'S',
    avatarColor: '#B8A8C8',
    text: '"The eye score caught that my liner was asymmetric before I even noticed. Game changer."',
  },
  {
    name: 'Priya K.',
    initial: 'P',
    avatarColor: '#A8C4B0',
    text: '"Three weeks of using REMAKE and my streak is at 21 days. I actually look forward to my morning scan."',
  },
];

const STARS = '★★★★★';

export default function SocialProofScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <Pressable onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 10 }]}>
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>

      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={[styles.header, { paddingTop: insets.top + 28 }]}>
        <Text style={styles.eyebrow}>Real Results</Text>
        <Text style={styles.title}>What people{'\n'}are saying.</Text>
      </Animated.View>

      <View style={styles.testimonials}>
        {TESTIMONIALS.map((t, i) => (
          <Animated.View key={i} entering={FadeInUp.delay(200 + i * 100).duration(500)}>
            <View style={styles.card}>
              <Text style={styles.stars}>{STARS}</Text>
              <Text style={styles.quote}>{t.text}</Text>
              <View style={styles.attribution}>
                <View style={[styles.avatar, { backgroundColor: t.avatarColor }]}>
                  <Text style={styles.avatarInitial}>{t.initial}</Text>
                </View>
                <Text style={styles.name}>{t.name}</Text>
                <Text style={styles.verified}>Verified user</Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </View>

      <View style={styles.spacer} />

      <Animated.View entering={FadeInUp.delay(520).duration(500)} style={styles.bottom}>
        <GlassButton
          title="Start My Profile"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(onboarding)/name');
          }}
          variant="primary"
          style={styles.cta}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.beige, paddingHorizontal: 28 },
  backBtn: {
    position: 'absolute', left: 20, zIndex: 10,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: tokens.colors.white,
    borderWidth: 1, borderColor: tokens.colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 20, color: tokens.colors.text, lineHeight: 22 },
  header: { marginBottom: 28 },
  eyebrow: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '500', letterSpacing: 1.2, textTransform: 'uppercase', color: tokens.colors.grayLight, marginBottom: 14 },
  title: { fontFamily: tokens.fonts.serif, fontSize: 32, fontWeight: '400', color: tokens.colors.text, lineHeight: 42 },
  testimonials: { gap: 12 },
  card: {
    backgroundColor: tokens.colors.white, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: tokens.colors.border, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  stars: { fontSize: 13, color: '#D4AF37', letterSpacing: 1 },
  quote: { fontFamily: tokens.fonts.serif, fontSize: 14, fontStyle: 'italic', color: tokens.colors.text, lineHeight: 22 },
  attribution: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '700', color: tokens.colors.white },
  name: { fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '600', color: tokens.colors.text },
  verified: { fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.grayLight, marginLeft: 'auto' },
  spacer: { flex: 1, minHeight: 24 },
  bottom: { alignItems: 'center' },
  cta: { width: '100%' },
});
