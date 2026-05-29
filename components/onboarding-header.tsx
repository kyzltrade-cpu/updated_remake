import { useEffect } from 'react';
import { Pressable, Text, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';

interface OnboardingHeaderProps {
  step: number;
  total: number; // pass 0 for back-arrow-only (permission screens)
  onBack?: () => void;
}

const H_PADDING = 20;
const BACK_BTN_WIDTH = 36;
const GAP = 12;

export function OnboardingHeader({ step, total, onBack }: OnboardingHeaderProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Track width = screen - padding both sides - back btn - placeholder - gaps
  const trackWidth = width - H_PADDING * 2 - BACK_BTN_WIDTH * 2 - GAP * 2;

  const progress = useSharedValue(total > 0 ? step / total : 0);

  useEffect(() => {
    if (total > 0) {
      progress.value = withSpring(step / total, {
        damping: 22,
        stiffness: 130,
        mass: 0.6,
      });
    }
  }, [step, total]);

  const animatedFill = useAnimatedStyle(() => ({
    width: progress.value * trackWidth,
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.nav}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}

        {total > 0 && (
          <View style={[styles.track, { width: trackWidth }]}>
            <Animated.View style={[styles.fill, animatedFill]} />
          </View>
        )}

        <View style={styles.placeholder} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: H_PADDING,
    paddingBottom: 16,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
  },
  backBtn: {
    width: BACK_BTN_WIDTH,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  placeholder: {
    width: BACK_BTN_WIDTH,
    height: 36,
    flexShrink: 0,
  },
  backIcon: {
    fontSize: 28,
    color: tokens.colors.grayLight,
    lineHeight: 32,
    includeFontPadding: false,
  },
  track: {
    height: 3,
    backgroundColor: tokens.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    flex: 1,
  },
  fill: {
    height: 3,
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 3,
  },
});
