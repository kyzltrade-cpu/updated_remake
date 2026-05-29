import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import { MarketingNav } from '@/components/marketing-nav';

const FEATURES = [
  {
    num: '01',
    title: 'Product Scanner',
    desc: 'Scan a barcode or photo. See shade match, ingredients, and skin fit instantly.',
  },
  {
    num: '02',
    title: 'Beauty DNA',
    desc: 'Face shape, undertone, colour season, archetype — your complete beauty blueprint.',
  },
  {
    num: '03',
    title: 'Six-Category Scoring',
    desc: 'Blending, symmetry, colour harmony, coverage, cleanliness, and brow framing — all scored.',
  },
  {
    num: '04',
    title: 'Expert Coaching',
    desc: 'Specific, actionable tips for your exact features — not generic advice.',
  },
  {
    num: '05',
    title: 'Side-by-Side Compare',
    desc: 'Stack two products. See which one wins for your skin.',
  },
];

export default function FeaturesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 28 }]}>
      <MarketingNav step={1} onBack={() => router.back()} />

      <Animated.View entering={FadeInUp.delay(80).duration(600)} style={styles.header}>
        <Text style={styles.eyebrow}>What REMAKE Does</Text>
        <Text style={styles.title}>Five things{'\n'}working for you.</Text>
      </Animated.View>

      <View style={styles.list}>
        {FEATURES.map((f, i) => (
          <Animated.View key={f.num} entering={FadeInUp.delay(180 + i * 70).duration(450)}>
            <View style={styles.item}>
              <Text style={styles.itemNum}>{f.num}</Text>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{f.title}</Text>
                <Text style={styles.itemDesc}>{f.desc}</Text>
              </View>
            </View>
            {i < FEATURES.length - 1 && <View style={styles.divider} />}
          </Animated.View>
        ))}
      </View>

      <View style={styles.spacer} />

      <Animated.View entering={FadeInUp.delay(560).duration(500)}>
        <GlassButton
          title="See What Others Say"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(onboarding)/social-proof');
          }}
          variant="primary"
          style={styles.cta}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.cream,
    paddingHorizontal: 28,
  },
  header: { marginBottom: 16 },
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: tokens.colors.pinkDeep,
    marginBottom: 12,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 34,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 44,
  },
  list: {},
  item: {
    flexDirection: 'row',
    gap: 18,
    paddingVertical: 13,
    alignItems: 'flex-start',
  },
  itemNum: {
    fontFamily: tokens.fonts.serif,
    fontSize: 13,
    fontWeight: '400',
    color: tokens.colors.pinkDeep,
    opacity: 0.7,
    width: 24,
    marginTop: 2,
    flexShrink: 0,
  },
  itemBody: { flex: 1, gap: 4 },
  itemTitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '600',
    color: tokens.colors.text,
  },
  itemDesc: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.border,
    marginLeft: 42,
  },
  spacer: { flex: 1, minHeight: 8 },
  cta: { width: '100%' },
});
