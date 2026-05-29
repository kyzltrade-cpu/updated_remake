import { Pressable, Text, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';

interface MarketingNavProps {
  step: number; // 1–3
  onBack?: () => void;
}

export function MarketingNav({ step, onBack }: MarketingNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}

      <View style={styles.dotsRow}>
        {[1, 2, 3].map(i => (
          <View
            key={i}
            style={[
              styles.dot,
              i < step  && styles.dotPast,
              i === step && styles.dotActive,
              i > step  && styles.dotFuture,
            ]}
          />
        ))}
      </View>

      <View style={styles.placeholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: { width: 36, height: 36 },
  backIcon: {
    fontSize: 28,
    color: tokens.colors.grayLight,
    lineHeight: 32,
    includeFontPadding: false,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dotActive: {
    width: 20,
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 10,
  },
  dotPast: {
    backgroundColor: tokens.colors.pinkDeep,
    opacity: 0.35,
    borderRadius: 2.5,
  },
  dotFuture: {
    backgroundColor: tokens.colors.border,
    borderRadius: 2.5,
  },
});
