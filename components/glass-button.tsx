import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';

type Variant = 'primary' | 'secondary' | 'ghost';

interface GlassButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function GlassButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
}: GlassButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === 'primary' && styles.textPrimary,
          variant === 'secondary' && styles.textSecondary,
          variant === 'ghost' && styles.textGhost,
          disabled && styles.textDisabled,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 16,
    paddingHorizontal: 44,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: tokens.colors.goldSoft,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  secondary: {
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.25,
  },
  text: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.12,
    textTransform: 'uppercase',
  },
  textPrimary: {
    color: tokens.colors.gold,
  },
  textSecondary: {
    color: tokens.colors.text,
  },
  textGhost: {
    color: tokens.colors.text,
  },
  textDisabled: {
    color: tokens.colors.grayLight,
  },
});