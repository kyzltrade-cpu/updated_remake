import { useEffect } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { tokens } from './theme';

interface AdvanceButtonProps {
  visible: boolean;
  onPress: () => void;
}

export function AdvanceButton({ visible, onPress }: AdvanceButtonProps) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = visible
      ? withSpring(1, { damping: 10, stiffness: 220, mass: 0.7 })
      : withSpring(0, { damping: 14, stiffness: 300 });
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.wrapper, style]}>
      <Pressable onPress={onPress} style={styles.btn}>
        <Text style={styles.arrow}>→</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 28,
    bottom: '35%',
    zIndex: 20,
  },
  btn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: tokens.colors.pinkDeep,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  arrow: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 28,
    includeFontPadding: false,
  },
});
