import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Dimensions, Image } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Dimensions ────────────────────────────────────────────────────────────────
const IMG_RATIO = 2622 / 1206;

// iPhone 15 Pro bezel ≈ 4 % of body width each side.
// At our render scale that is ~4 pt — a thin ring, not a thick case.
const RING      = 4;    // metallic band visible from front (all four sides)
const GASKET    = 1;    // near-black glass-seal between ring and screen
const BODY_R    = 22;   // outer body corner radius
const SCREEN_R  = 17;   // screen-glass corner (slightly inside body arc)

const MAX_BODY_H = SH * 0.54;
const PHONE_H    = Math.min(SW * 0.50 * IMG_RATIO, MAX_BODY_H - (RING + GASKET) * 2);
const PHONE_W    = PHONE_H / IMG_RATIO;
const BODY_W     = PHONE_W + (RING + GASKET) * 2;
const BODY_H     = PHONE_H + (RING + GASKET) * 2;

// ─── Side buttons ──────────────────────────────────────────────────────────────
// iPhone 15 Pro physical proportions scaled to our render size:
//   Action button  ~4 % of BODY_H
//   Volume up/down ~10 % each
//   Power          ~14 %
const BTN_PROTRUDE = 2.5;
const BTN_W        = BTN_PROTRUDE + 2;
const ACTION_H     = BODY_H * 0.040;
const VOL_H        = BODY_H * 0.100;
const POWER_H      = BODY_H * 0.140;

// ─── Metallic ring gradient ────────────────────────────────────────────────────
// Horizontal L→R: chamfered left & right edges catch light, flat face is dark.
// At RING=4 pt only the edge strips are visible, which is exactly right.
const RING_COLORS = ['#606062', '#3A3A3C', '#222224', '#3A3A3C', '#606062'] as const;
const RING_LOCS   = [0, 0.06, 0.5, 0.94, 1] as const;

const BTN_COLORS  = ['#5A5A5C', '#3C3C3E'] as const;

// ─── Side button ───────────────────────────────────────────────────────────────
function SideButton({ top, height, side }: { top: number; height: number; side: 'left' | 'right' }) {
  const isLeft = side === 'left';
  return (
    <LinearGradient
      colors={BTN_COLORS}
      start={{ x: isLeft ? 0 : 1, y: 0 }}
      end={{ x: isLeft ? 1 : 0, y: 0 }}
      style={[
        styles.sideBtn,
        {
          top,
          height,
          [isLeft ? 'left' : 'right']: -BTN_PROTRUDE,
          borderTopLeftRadius:     isLeft ? 0 : 2,
          borderBottomLeftRadius:  isLeft ? 0 : 2,
          borderTopRightRadius:    isLeft ? 2 : 0,
          borderBottomRightRadius: isLeft ? 2 : 0,
        },
      ]}
    />
  );
}

// ─── Phone mockup ──────────────────────────────────────────────────────────────
function PhoneMockup() {
  return (
    <View style={{ paddingHorizontal: BTN_PROTRUDE + 1 }}>
      <Animated.View entering={FadeIn.delay(200).duration(700)}>

        {/* Shadow lives here so overflow:hidden on body doesn't clip it */}
        <View style={styles.shadowHost}>

          {/* Metallic band — horizontal gradient, thin ring around screen */}
          <LinearGradient
            colors={RING_COLORS}
            locations={RING_LOCS}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.body}
          >
            {/* Top chamfer — 1 pt bright line on the flat top edge */}
            <View style={styles.chamferTop} />
            {/* Bottom edge — dim reflection */}
            <View style={styles.chamferBottom} />

            {/* Left side buttons */}
            <SideButton side="left" top={BODY_H * 0.115} height={ACTION_H} />
            <SideButton side="left" top={BODY_H * 0.200} height={VOL_H} />
            <SideButton side="left" top={BODY_H * 0.330} height={VOL_H} />

            {/* Right: power button */}
            <SideButton side="right" top={BODY_H * 0.250} height={POWER_H} />

            {/* Near-black gasket + screen */}
            <View style={styles.gasket}>
              <View style={styles.screen}>
                <Image
                  source={require('@/assets/images/app-preview.png')}
                  style={{ width: PHONE_W, height: PHONE_H }}
                  resizeMode="stretch"
                />
                {/* Screen glass glare — subtle diagonal highlight */}
                <LinearGradient
                  colors={['rgba(255,255,255,0.055)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.55, y: 0.55 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
              </View>
            </View>
          </LinearGradient>

        </View>
      </Animated.View>
    </View>
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

  // Soft directional shadow — phone floating above surface
  shadowHost: {
    borderRadius: BODY_R,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 22,
  },

  // Body: metallic ring (only RING pt visible on each side; rest hidden by screen)
  body: {
    width: BODY_W,
    height: BODY_H,
    borderRadius: BODY_R,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // 0.5 pt hairline border — top edge slightly bright, bottom slightly dim
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.10)',
    borderTopColor: 'rgba(255,255,255,0.25)',
    borderBottomColor: 'rgba(0,0,0,0.50)',
  },

  // 1 pt highlight on the flat top/bottom edges between the corner arcs
  chamferTop: {
    position: 'absolute',
    top: 0,
    left: BODY_R,
    right: BODY_R,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  chamferBottom: {
    position: 'absolute',
    bottom: 0,
    left: BODY_R,
    right: BODY_R,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  // Side buttons — thin slivers, same tone as ring
  sideBtn: {
    position: 'absolute',
    width: BTN_W,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.07)',
    borderTopColor: 'rgba(255,255,255,0.16)',
  },

  // Near-black gasket between ring and screen glass
  gasket: {
    width: PHONE_W + GASKET * 2,
    height: PHONE_H + GASKET * 2,
    borderRadius: SCREEN_R + GASKET,
    backgroundColor: '#060608',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Screen — content is clipped here
  screen: {
    width: PHONE_W,
    height: PHONE_H,
    borderRadius: SCREEN_R,
    overflow: 'hidden',
    backgroundColor: '#000',
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
