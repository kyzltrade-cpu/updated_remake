import { View, StyleSheet } from 'react-native';
import { tokens } from '@/components/theme';

interface OnboardingPaginationProps {
  total: number;
  current: number;
}

export function OnboardingPagination({ total, current }: OnboardingPaginationProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === current ? styles.dotActive : i < current ? styles.dotFilled : styles.dotEmpty,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
  dotActive: {
    width: 20,
    backgroundColor: tokens.colors.pinkDeep,
  },
  dotFilled: {
    width: 5,
    backgroundColor: tokens.colors.pinkMid,
  },
  dotEmpty: {
    width: 5,
    backgroundColor: tokens.colors.border,
  },
});