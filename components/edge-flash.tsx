import { useEffect } from 'react';
import { StyleSheet, Platform, View, Dimensions } from 'react-native';
import Svg, { Defs, Rect, LinearGradient as SvgLinearGradient, Stop, Mask, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);
const { width: W, height: H } = Dimensions.get('window');

const ANIMATION_DURATION = 250;

const DEPTH_TOP    = H * 0.22;
const DEPTH_BOTTOM = H * 0.26;
const DEPTH_H      = W * 0.09;

// Corner radius of the transparent opening
const CORNER_R = 140;

export function EdgeFlashOverlay({ visible }: { visible: boolean }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, {
      duration: ANIMATION_DURATION,
      easing: visible ? Easing.out(Easing.ease) : Easing.in(Easing.ease),
    });
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (Platform.OS !== 'ios') return null;

  // Opening rectangle dimensions
  const openX = DEPTH_H;
  const openY = DEPTH_TOP;
  const openW = W - DEPTH_H * 2;
  const openH = H - DEPTH_TOP - DEPTH_BOTTOM;

  return (
    <AnimatedView pointerEvents="none" style={[StyleSheet.absoluteFill, animatedStyle]}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          {/* Mask: white everywhere except a rounded rect in the centre (black = transparent) */}
          <Mask id="openingMask">
            <Rect x="0" y="0" width={W} height={H} fill="white" />
            <Rect x={openX} y={openY} width={openW} height={openH} rx={CORNER_R} ry={CORNER_R} fill="black" />
          </Mask>

          {/* Top */}
          <SvgLinearGradient id="gt" x1="0" y1="0" x2="0" y2={DEPTH_TOP} gradientUnits="userSpaceOnUse">
            <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={1} />
            <Stop offset="40%"  stopColor="#FFFFFF" stopOpacity={1} />
            <Stop offset="60%"  stopColor="#FFFFFF" stopOpacity={0} />
          </SvgLinearGradient>

          {/* Bottom */}
          <SvgLinearGradient id="gb" x1="0" y1={H} x2="0" y2={H - DEPTH_BOTTOM} gradientUnits="userSpaceOnUse">
            <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={1} />
            <Stop offset="40%"  stopColor="#FFFFFF" stopOpacity={1} />
            <Stop offset="60%"  stopColor="#FFFFFF" stopOpacity={0} />
          </SvgLinearGradient>

          {/* Left */}
          <SvgLinearGradient id="gl" x1="0" y1="0" x2={DEPTH_H} y2="0" gradientUnits="userSpaceOnUse">
            <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={1}    />
            <Stop offset="12%"  stopColor="#FFFFFF" stopOpacity={1}    />
            <Stop offset="40%"  stopColor="#FFFFFF" stopOpacity={0.60} />
            <Stop offset="70%"  stopColor="#FFFFFF" stopOpacity={0.25} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0}    />
          </SvgLinearGradient>

          {/* Right */}
          <SvgLinearGradient id="gr" x1={W} y1="0" x2={W - DEPTH_H} y2="0" gradientUnits="userSpaceOnUse">
            <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={1}    />
            <Stop offset="12%"  stopColor="#FFFFFF" stopOpacity={1}    />
            <Stop offset="40%"  stopColor="#FFFFFF" stopOpacity={0.60} />
            <Stop offset="70%"  stopColor="#FFFFFF" stopOpacity={0.25} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0}    />
          </SvgLinearGradient>
        </Defs>

        {/* All four gradient rects clipped by the rounded-opening mask */}
        <G mask="url(#openingMask)">
          <Rect x={0} y={0}                width={W}      height={DEPTH_TOP}    fill="url(#gt)" />
          <Rect x={0} y={H - DEPTH_BOTTOM} width={W}      height={DEPTH_BOTTOM} fill="url(#gb)" />
          <Rect x={0} y={0}                width={DEPTH_H} height={H}           fill="url(#gl)" />
          <Rect x={W - DEPTH_H} y={0}      width={DEPTH_H} height={H}           fill="url(#gr)" />
        </G>
      </Svg>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({});
