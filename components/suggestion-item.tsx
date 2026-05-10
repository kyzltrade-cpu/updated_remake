import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { tokens } from '@/components/theme';

interface SuggestionItemProps {
  text: string;
  emphasis: string;
  delay?: number;
}

export function SuggestionItem({ text, emphasis, delay = 0 }: SuggestionItemProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(6);

  useEffect(() => {
    opacity.value = withDelay(400 + delay * 120, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(400 + delay * 120, withTiming(0, { duration: 500 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Parse text and inject emphasis
  const parts = text.split(emphasis);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.dot} />
      <Text style={styles.text}>
        {parts[0]}
        <Text style={styles.emphasis}>{emphasis}</Text>
        {parts[1]}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
    alignItems: 'flex-start',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: tokens.colors.pinkDeep,
    marginTop: 7,
    opacity: 0.6,
    flexShrink: 0,
  },
  text: {
    fontSize: 13.5,
    lineHeight: 22,
    color: tokens.colors.gray,
    fontWeight: '300',
    letterSpacing: 0.01,
    flex: 1,
  },
  emphasis: {
    fontFamily: tokens.fonts.serif,
    fontStyle: 'italic',
    color: tokens.colors.text,
    fontWeight: '400',
  },
});