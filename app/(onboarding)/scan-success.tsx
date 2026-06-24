import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { tokens } from '@/components/theme';
import { ONBOARDING_KEY } from '../_layout';

const { width: W } = Dimensions.get('window');

export default function ScanSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleProceed = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(onboarding)/trial-timeline');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 32 }]}>
      {/* Subtle Ambient Glow */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      <View style={styles.body}>
        {/* Success Icon */}
        <Animated.View entering={ZoomIn.delay(200).duration(600)} style={styles.iconCircle}>
          <MaterialIcons name="check" size={36} color={tokens.colors.white} />
        </Animated.View>

        <Animated.Text entering={FadeInUp.delay(300).duration(500)} style={styles.eyebrow}>
          PROFILE READY
        </Animated.Text>
        
        <Animated.Text entering={FadeInUp.delay(400).duration(500)} style={styles.title}>
          {'Your Beauty DNA\nis Created! ✨'}
        </Animated.Text>
        
        <Animated.Text entering={FadeInUp.delay(500).duration(500)} style={styles.sub}>
          We have finished analyzing your features. Your custom profile is now sealed in your Profile.
        </Animated.Text>

        {/* Feature Highlights Card */}
        <Animated.View entering={FadeInUp.delay(650).duration(600)} style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.badgeCircle}>
              <Text style={styles.badgeText}>🧬</Text>
            </View>
            <View style={styles.cardTextCol}>
              <Text style={styles.cardItemTitle}>Beauty DNA Sealed</Text>
              <Text style={styles.cardItemSub}>Your color season & archetype are locked.</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardRow}>
            <View style={styles.badgeCircle}>
              <Text style={styles.badgeText}>🛡️</Text>
            </View>
            <View style={styles.cardTextCol}>
              <Text style={styles.cardItemTitle}>Skin Watchdog Active</Text>
              <Text style={styles.cardItemSub}>We'll scan for 100+ barrier-destroying ingredients.</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardRow}>
            <View style={styles.badgeCircle}>
              <Text style={styles.badgeText}>📸</Text>
            </View>
            <View style={styles.cardTextCol}>
              <Text style={styles.cardItemTitle}>Unlimited Scanning</Text>
              <Text style={styles.cardItemSub}>Instantly inspect any cosmetic or skincare product.</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInUp.delay(800).duration(500)} style={styles.bottom}>
        <Pressable
          onPress={handleProceed}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        >
          <Text style={styles.ctaText}>Get Started ✦</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.cream },
  ambientGlow: {
    position: 'absolute',
    top: -100,
    alignSelf: 'center',
    width: W * 1.2,
    height: W * 1.2,
    borderRadius: W * 0.6,
    backgroundColor: 'rgba(232,57,154,0.06)',
  },
  body: { paddingHorizontal: 28, paddingTop: 40, alignItems: 'center' },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: tokens.colors.pinkDeep,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3.5,
    color: tokens.colors.pinkDeep,
    marginBottom: 12,
    textAlign: 'center',
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 36,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 46,
    marginBottom: 12,
    textAlign: 'center',
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 22,
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
    gap: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  badgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: tokens.colors.pinkLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 18,
  },
  cardTextCol: {
    flex: 1,
    gap: 2,
  },
  cardItemTitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '600',
    color: tokens.colors.text,
  },
  cardItemSub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '300',
    color: tokens.colors.gray,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    width: '100%',
  },
  bottom: { width: '100%', paddingHorizontal: 28 },
  cta: {
    backgroundColor: tokens.colors.accent,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: tokens.colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '600',
    color: tokens.colors.white,
    letterSpacing: 0.5,
  },
});
