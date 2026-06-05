import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';

const { width: SW } = Dimensions.get('window');

const GUIDELINES = [
  {
    icon: '🧼',
    title: 'Bare Face / No Makeup',
    desc: 'Make sure your face is 100% clean and makeup-free so the scanner reads your true skin tone and shade.',
  },
  {
    icon: '☀️',
    title: 'Natural Lighting',
    desc: 'Face a window or a well-lit area. Avoid strong shadows or heavy backlight.',
  },
  {
    icon: '👓',
    title: 'Clear Face',
    desc: 'Remove glasses, hats, and push back any hair blocking your eyes or forehead.',
  },
  {
    icon: '😐',
    title: 'Neutral Expression',
    desc: 'Look straight at the camera with a relaxed, natural face (no angling or wide smiles).',
  },
];

export default function ScanPrepScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(onboarding)/first-scan');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      {/* Scrollable Container for content */}
      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
          <Text style={styles.sparkleIcon}>✦</Text>
          <Text style={styles.title}>Preparing your{'\n'}first scan.</Text>
          <Text style={styles.sub}>
            To calibrate your overall makeup score and map your skin tone accurately, let's get a clean photo.
          </Text>
        </Animated.View>

        {/* Guidelines List (Minimal Luxury Rows) */}
        <View style={styles.guidelines}>
          {GUIDELINES.map((item, i) => (
            <Animated.View
              key={item.title}
              entering={FadeInUp.delay(200 + i * 100).duration(500)}
              style={styles.card}
            >
              <View style={styles.iconBox}>
                <Text style={styles.iconText}>{item.icon}</Text>
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Secure Note */}
        <Animated.View entering={FadeIn.delay(600).duration(600)} style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            🔒 Secure Scan: Your photo is encrypted, processed in-memory, and is never stored permanently on our servers.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Floating CTA Button at the bottom */}
      <Animated.View entering={FadeInUp.delay(650).duration(500)} style={styles.bottom}>
        <Pressable onPress={handleStart} style={styles.cta}>
          <Text style={styles.ctaText}>Start Scan  ✦</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.cream,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 20,
    gap: 6,
  },
  sparkleIcon: {
    fontSize: 22,
    color: tokens.colors.pinkDeep,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 30,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 38,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 20,
  },
  guidelines: {
    gap: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    gap: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(217,138,150,0.08)', // subtle brand pink hue
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  iconText: {
    fontSize: 18,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  cardDesc: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11.5,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 16,
  },
  privacyNote: {
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  privacyText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: tokens.colors.gray,
    textAlign: 'center',
    lineHeight: 16,
  },
  bottom: {
    paddingHorizontal: 28,
    marginTop: 8,
  },
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
