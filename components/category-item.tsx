import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';

interface CategoryItemProps {
  name: string;
  score: number;
  description: string;
  delay?: number;
}

export function CategoryItem({ name, score, description, delay = 0 }: CategoryItemProps) {
  const [open, setOpen] = useState(false);
  const barWidth = useSharedValue(0);
  const itemOpacity = useSharedValue(0);
  const itemTranslateY = useSharedValue(8);
  const chevronRotation = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => {
      itemOpacity.value = withTiming(1, { duration: 500 });
      itemTranslateY.value = withTiming(0, { duration: 500 });
      barWidth.value = withDelay(delay * 120, withTiming(score, { duration: 1000 }));
    }, 400 + delay * 120);
    return () => clearTimeout(t);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: itemOpacity.value,
    transform: [{ translateY: itemTranslateY.value }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !open;
    setOpen(next);
    chevronRotation.value = withSpring(next ? 90 : 0);
  };

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Pressable onPress={toggle} style={styles.header}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{name}</Text>
          <Animated.Text style={[styles.chevron, chevronStyle]}>›</Animated.Text>
        </View>
        <Text style={styles.score}>{score}</Text>
      </Pressable>
      <View style={styles.bar}>
        <Animated.View style={[styles.barFill, barStyle]} />
      </View>
      <View style={styles.descWrapper}>
        {open && <Text style={styles.descText}>{description}</Text>}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: tokens.colors.text,
    letterSpacing: 0.02,
  },
  chevron: {
    fontSize: 14,
    color: tokens.colors.grayLight,
  },
  score: {
    fontFamily: tokens.fonts.serif,
    fontSize: 15,
    color: tokens.colors.pinkRich,
    letterSpacing: -0.2,
  },
  bar: {
    width: '100%',
    height: 3,
    backgroundColor: tokens.colors.cream,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: tokens.colors.pinkDeep,
  },
  descWrapper: {
    marginTop: 0,
    overflow: 'hidden',
  },
  descText: {
    fontSize: 12.5,
    lineHeight: 19,
    color: tokens.colors.gray,
    fontWeight: '300',
    fontStyle: 'italic',
    padding: 10,
    backgroundColor: tokens.colors.cream,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginTop: 10,
  },
});