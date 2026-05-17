import { Pressable, Text, StyleSheet, View } from 'react-native';
import { tokens } from './theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface OnboardingHeaderProps {
  step: number;
  total: number;
  onBack?: () => void;
}

export function OnboardingHeader({ step, total, onBack }: OnboardingHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.nav}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}

        <View style={styles.dotsRow}>
          {Array.from({ length: total }, (_, i) => {
            const n = i + 1;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  n < step  && styles.dotPast,
                  n === step && styles.dotActive,
                  n > step  && styles.dotFuture,
                ]}
              />
            );
          })}
        </View>

        <View style={styles.placeholder} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  nav: {
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
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dotActive: {
    width: 18,
    backgroundColor: tokens.colors.pinkDeep,
  },
  dotPast: {
    backgroundColor: tokens.colors.pinkDeep,
    opacity: 0.38,
  },
  dotFuture: {
    backgroundColor: tokens.colors.border,
  },
});
