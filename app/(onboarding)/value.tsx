import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Dimensions, Image } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Mockup Proportions (iPhone 16 Pro Frame) ──────────────────────────────────
const FRAME_W = 1350;
const FRAME_H = 2760;
const FRAME_RATIO = FRAME_H / FRAME_W;

// Transparent inner screen coordinates inside the 1350x2760 frame
const SCREEN_X = 72;
const SCREEN_Y = 69;
const SCREEN_W = 1206;
const SCREEN_H = 2622;

const MAX_PHONE_H = SH * 0.50;
const PHONE_W = Math.min(SW * 0.56, MAX_PHONE_H / FRAME_RATIO);
const PHONE_H = PHONE_W * FRAME_RATIO;

// Scaled calculations for the absolute positioned app screenshot
const INNER_W = PHONE_W * (SCREEN_W / FRAME_W);
const INNER_H = PHONE_H * (SCREEN_H / FRAME_H);
const INNER_L = PHONE_W * (SCREEN_X / FRAME_W);
const INNER_T = PHONE_H * (SCREEN_Y / FRAME_H);
const INNER_R = PHONE_W * (42 / FRAME_W); // 42px corner radius on 1350px frame matches perfectly

// ─── Phone mockup ──────────────────────────────────────────────────────────────
function PhoneMockup() {
  return (
    <Animated.View entering={FadeIn.delay(200).duration(700)}>
      <View style={[styles.phoneContainer, { width: PHONE_W, height: PHONE_H }]}>
        
        {/* Inner App Screen Screenshot */}
        <Image
          source={require('@/assets/images/app-preview.png')}
          style={[
            styles.innerScreen,
            {
              width: INNER_W,
              height: INNER_H,
              left: INNER_L,
              top: INNER_T,
              borderRadius: INNER_R,
            }
          ]}
          resizeMode="cover"
        />

        {/* Photorealistic iPhone 16 Pro Frame Overlay */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image
            source={require('@/assets/images/iphone-frame.png')}
            style={styles.frameImage}
            resizeMode="stretch"
          />
        </View>

      </View>
    </Animated.View>
  );
}

// ─── Value screen ──────────────────────────────────────────────────────────────
export default function ValueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.topRow}>
        <Text style={styles.wordmark}>REMAKE</Text>
        <Pressable onPress={() => router.push('/(onboarding)/sign-in')} hitSlop={10}>
          <Text style={styles.signInLink}>Sign In</Text>
        </Pressable>
      </Animated.View>

      <View style={styles.phoneWrap}>
        <PhoneMockup />
      </View>

      <Animated.Text entering={FadeInUp.delay(400).duration(500)} style={styles.headline}>
        {'Scan any beauty\nproduct.'}
      </Animated.Text>
      <Animated.Text entering={FadeInUp.delay(480).duration(500)} style={styles.sub}>
        Know instantly if it's right for your skin — before you buy.
      </Animated.Text>

      <View style={styles.spacer} />

      <Animated.View entering={FadeInUp.delay(560).duration(500)} style={styles.bottom}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/skin-type');
          }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>Get Started — it's free</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(onboarding)/sign-in')} hitSlop={8}>
          <Text style={styles.altLink}>
            Already have an account?{' '}
            <Text style={styles.altLinkBold}>Sign In</Text>
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.cream,
    paddingHorizontal: 28,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  wordmark: {
    fontFamily: tokens.fonts.serif,
    fontSize: 22,
    fontWeight: '400',
    color: tokens.colors.pinkRich,
    letterSpacing: 2,
  },
  signInLink: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '500',
    color: tokens.colors.pinkDeep,
  },
  phoneWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },

  // Soft high-end float shadow for the device mockup
  phoneContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 18,
    backgroundColor: 'transparent',
  },
  innerScreen: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  frameImage: {
    width: '100%',
    height: '100%',
  },

  headline: {
    fontFamily: tokens.fonts.serif,
    fontSize: 36,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 48,
    marginBottom: 10,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 23,
  },
  spacer: { flex: 1, minHeight: 12 },
  bottom: { gap: 14 },
  cta: {
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  altLink: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: tokens.colors.gray,
    textAlign: 'center',
  },
  altLinkBold: {
    color: tokens.colors.pinkDeep,
    fontWeight: '600',
  },
});
