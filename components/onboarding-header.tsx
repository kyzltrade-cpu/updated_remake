import { useEffect } from 'react';
import { Pressable, Text, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';

interface OnboardingHeaderProps {
  step: number;
  total: number;
  onBack?: () => void;
}

export function OnboardingHeader({ step, total, onBack }: OnboardingHeaderProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const progress = useSharedValue(total > 0 ? step / total : 0);

  useEffect(() => {
    if (total > 0) {
      progress.value = withSpring(step / total, { damping: 22, stiffness: 130, mass: 0.6 });
    }
  }, [step, total]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={{ paddingTop: insets.top }}>
      {total > 0 && (
        <View style={[styles.track, { width }]}>
          <Animated.View style={[styles.fill, fillStyle]} />
        </View>
      )}
      {onBack && (
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 3,
    backgroundColor: tokens.colors.border,
  },
  fill: {
    height: 3,
    backgroundColor: tokens.colors.pinkDeep,
  },
  backBtn: {
    marginTop: 10,
    marginLeft: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: {
    fontSize: 32,
    color: tokens.colors.text,
    lineHeight: 36,
    includeFontPadding: false,
  },
});
