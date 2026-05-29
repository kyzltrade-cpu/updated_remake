import { ReactNode } from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';

interface SelectCardProps {
  label: string;
  description?: string;
  left?: ReactNode;
  right?: ReactNode;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function SelectCard({
  label,
  description,
  left,
  right,
  active,
  onPress,
  disabled = false,
}: SelectCardProps) {
  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        active && styles.cardActive,
        disabled && styles.cardDisabled,
        pressed && !disabled && styles.cardPressed,
      ]}
    >
      {/* Left accent bar — only visible when active */}
      {active && <View style={styles.accent} />}

      {left && <View style={styles.leftSlot}>{left}</View>}

      <View style={styles.body}>
        <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>

      {right ?? null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: tokens.colors.pinkDeep,
    backgroundColor: 'rgba(232,57,154,0.04)',
  },
  cardDisabled: {
    opacity: 0.35,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  // Absolutely positioned left accent bar
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: tokens.colors.pinkDeep,
  },
  leftSlot: {
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  label: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '600',
    color: tokens.colors.text,
  },
  labelActive: {
    color: tokens.colors.pinkDeep,
  },
  description: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 18,
  },
});
