import { useEffect } from 'react';
import { StyleSheet, Platform, View, Dimensions } from 'react-native';
import Svg, { Defs, Rect, RadialGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);
const { width: W, height: H } = Dimensions.get('window');

const ANIMATION_DURATION = 250;

export function EdgeFlashOverlay({ visible }: { visible: boolean }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.ease),
      });
    } else {
      opacity.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (Platform.OS !== 'ios') return null;

  return (
    <AnimatedView
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, animatedStyle]}
    >
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <RadialGradient
            id="ringLight"
            cx="50%"
            cy="50%"
            r="50%"
            fx="50%"
            fy="50%"
          >
            <Stop offset="0%" stopColor="white" stopOpacity={0} />
            <Stop offset="70%" stopColor="white" stopOpacity={0} />
            <Stop offset="85%" stopColor="white" stopOpacity={0.5} />
            <Stop offset="100%" stopColor="white" stopOpacity={1} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={W} height={H} fill="url(#ringLight)" />
      </Svg>
    </AnimatedView>
  );
}