import { Modal, View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { Sparkles, Crown, X } from 'lucide-react-native';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

interface ScanLimitModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ScanLimitModal({ visible, onClose }: ScanLimitModalProps) {
  const router = useRouter();

  // Aura breathing animations
  const auraScale = useSharedValue(0.9);
  const auraOp = useSharedValue(0.22);

  // Sheen sweep animation for the main CTA button
  const shineX = useSharedValue(-150);

  useEffect(() => {
    if (visible) {
      // Trigger delicate warnings haptics
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      // Start the breathing aura
      auraScale.value = withRepeat(
        withSequence(
          withTiming(1.35, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.9, { duration: 1600, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
      auraOp.value = withRepeat(
        withSequence(
          withTiming(0.12, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.22, { duration: 1600, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );

      // Start the button shine sweep
      shineX.value = withRepeat(
        withSequence(
          withTiming(150, { duration: 1500, easing: Easing.out(Easing.quad) }),
          withTiming(-150, { duration: 0 }),
          withDelay(2500, withTiming(-150, { duration: 0 }))
        ),
        -1,
        false
      );
    }
  }, [visible]);

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    router.push('/(main)/paywall');
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const auraAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: auraScale.value }],
    opacity: auraOp.value,
  }));

  const sheenAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shineX.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Blur backdrop using high-end BlurView */}
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFillObject} />
        
        {/* Transparent dismiss handler when tapping outside */}
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />

        {/* Modal content card */}
        <Animated.View 
          entering={FadeInDown.springify().damping(16).stiffness(110)}
          style={styles.card}
        >
          {/* Top closing cross */}
          <Pressable style={styles.closeBtn} onPress={handleClose}>
            <X size={18} color={tokens.colors.gray} />
          </Pressable>

          {/* Sparkly Premium Icon Container */}
          <View style={styles.iconWrapper}>
            {/* Pulsating breathing aura behind the icon */}
            <Animated.View style={[styles.aura, auraAnimatedStyle]} />
            
            <View style={styles.iconCircle}>
              <Crown size={28} color={tokens.colors.pinkDeep} strokeWidth={2.2} />
            </View>
            
            <View style={styles.decorSparkleTL}>
              <Sparkles size={14} color={tokens.colors.goldSoft} />
            </View>
            <View style={styles.decorSparkleBR}>
              <Sparkles size={16} color={tokens.colors.pink} />
            </View>
          </View>

          {/* Text headers */}
          <Text style={styles.eyebrow}>ReMake Pro</Text>
          
          <Text style={styles.title}>
            scan limit reached! 💖
          </Text>

          <Text style={styles.body}>
            ready to unlock your signature beauty era? upgrade to{' '}
            <Text style={styles.boldText}>ReMake Pro</Text> to get unlimited scans, custom shade matching, and your complete makeup DNA analysis 🎀✨
          </Text>

          {/* CTA Upgrade Button with Satin Shine Sheen */}
          <Pressable onPress={handleUpgrade} style={styles.upgradeBtnContainer}>
            <LinearGradient
              colors={[tokens.colors.pinkDeep, tokens.colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeBtn}
            >
              {/* Sliding sheen sweep */}
              <Animated.View style={[styles.sheenWrapper, sheenAnimatedStyle]}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.45)', 'rgba(255, 255, 255, 0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sheen}
                />
              </Animated.View>
              <Text style={styles.upgradeText}>Unlock Unlimited Era</Text>
            </LinearGradient>
          </Pressable>

          {/* Dismiss button */}
          <Pressable onPress={handleClose} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>Maybe Later</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 13, 20, 0.35)', // darkBg translucent tint
  },
  card: {
    width: Math.min(SCREEN_WIDTH - 44, 340),
    backgroundColor: tokens.colors.ivory,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: tokens.colors.pinkLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  aura: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: tokens.colors.pink,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.colors.white,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  decorSparkleTL: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  decorSparkleBR: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    fontWeight: '600',
    color: tokens.colors.gray,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 21,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: tokens.colors.pinkRich,
    textAlign: 'center',
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  body: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: tokens.colors.text,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  boldText: {
    fontWeight: '600',
    color: tokens.colors.accent,
  },
  upgradeBtnContainer: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 12,
  },
  upgradeBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sheenWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 150,
  },
  sheen: {
    flex: 1,
  },
  upgradeText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dismissBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  dismissText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '500',
    color: tokens.colors.gray,
    letterSpacing: 0.5,
  },
});
