import { Pressable, Text, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { tokens } from './theme';

interface CalCardProps {
  icon?: string;
  label: string;
  description?: string;
  active: boolean;
  onPress: () => void;
  index?: number;
  disabled?: boolean;
}

export function CalCard({ icon, label, description, active, onPress, index = 0, disabled }: CalCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (disabled) return;
    scale.value = withSpring(0.97, { damping: 10, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    });
    Haptics.selectionAsync();
    onPress();
  };

  return (
    <Animated.View entering={FadeInUp.delay(index * 55).duration(380)} style={animStyle}>
      <Pressable onPress={handlePress} style={[styles.card, active && styles.cardActive, disabled && !active && styles.cardDisabled]}>
        {icon ? (
          <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
        ) : null}
        <View style={styles.text}>
          <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
          {description ? (
            <Text style={[styles.desc, active && styles.descActive]}>{description}</Text>
          ) : null}
        </View>
        {active ? (
          <View style={styles.check}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 17,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.07)',
    gap: 13,
  },
  cardActive: {
    backgroundColor: tokens.colors.pinkDeep,
    borderColor: tokens.colors.pinkDeep,
  },
  cardDisabled: {
    opacity: 0.4,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: tokens.colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  icon: {
    fontSize: 20,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '600',
    color: tokens.colors.text,
    letterSpacing: 0.1,
  },
  labelActive: {
    color: '#FFFFFF',
  },
  desc: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '400',
    color: tokens.colors.gray,
    lineHeight: 17,
  },
  descActive: {
    color: 'rgba(255,255,255,0.72)',
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
