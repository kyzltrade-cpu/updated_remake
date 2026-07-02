import { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { tokens } from './theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Exact scaled logo paths from our high-fidelity SVG trace
const LOGO_PATHS = {
  hair: [
    {
      d: "M 163.3 67.1 L 165.6 64.6 L 165.9 64.0 L 169.7 55.4 L 170.0 51.0 L 169.0 46.8 L 168.7 46.2 L 165.2 39.5 L 158.9 34.1 L 151.3 31.6 L 150.6 31.6 L 145.6 31.3 L 140.2 33.2 L 136.3 35.4 L 133.8 38.3 L 132.5 40.5 L 131.0 44.9 L 131.3 50.6 L 133.8 56.3 L 137.0 61.4 L 148.7 72.2 L 190.3 98.9 L 206.8 112.2 L 214.8 122.1 L 216.7 125.9 L 220.2 135.1 L 220.5 135.7 L 222.1 150.3 L 221.4 155.1 L 220.5 158.9 L 219.5 162.1 L 219.2 162.7 L 216.7 168.4",
      length: 239.4
    }
  ],
  face: [
    {
      d: "M 101.7 194.4 L 108.4 194.1 L 101.4 194.4 L 97.9 193.5 L 94.4 190.6 L 92.9 187.8 L 92.2 182.4 L 92.9 182.1 L 92.9 179.8 L 93.8 178.3 L 93.5 173.2 L 87.8 164.9 L 91.3 160.2 L 86.2 155.1 L 85.6 153.5 L 89.7 145.2 L 87.1 141.4 L 83.0 139.2 L 77.9 134.1 L 78.3 131.3 L 89.7 118.9 L 93.2 113.5 L 97.6 101.4 L 97.6 92.2 L 96.7 88.4 L 97.0 85.9 L 96.3 85.6 L 96.3 77.6 L 97.0 77.0 L 97.3 72.2 L 97.6 71.6 L 101.1 61.4 L 106.2 52.5 L 110.0 48.4 L 113.8 52.5 L 113.5 56.7 L 114.8 61.7 L 117.3 68.7 L 122.4 76.7 L 127.5 83.3 L 138.3 94.1 L 164.6 116.0 L 175.1 124.6 L 185.2 134.8 L 190.3 141.1 L 194.8 148.7 L 197.9 157.9 L 199.2 164.3 L 199.2 171.3 L 197.9 179.2 L 195.7 185.6 L 192.2 192.9 L 185.6 203.3 L 175.7 215.1 L 157.3 234.8 L 154.4 217.6 L 153.5 212.2 L 151.3 204.9 L 148.4 200.2 L 143.7 195.1 L 140.8 193.2 L 134.8 190.6 L 125.6 190.6 L 118.6 192.5 L 108.4 194.4 L 117.9 192.2 L 117.0 192.9",
      length: 513.5
    },
    {
      d: "M 155.4 235.1 L 155.1 234.4 L 150.6 243.0 L 148.1 247.8 L 144.3 256.3 L 141.4 270.0",
      length: 39.2
    },
    {
      d: "M 112.2 49.0 L 111.6 47.8 L 115.4 41.7 L 121.1 34.8 L 126.2 30.0",
      length: 24.5
    }
  ],
  features: [
    {
      d: "M 107.5 100.8 L 113.5 99.5 L 117.6 99.8 L 123.0 100.8 L 127.8 103.3 L 133.8 107.8 L 128.4 103.7",
      length: 35.4
    },
    {
      d: "M 107.1 126.8 L 108.7 126.5 L 115.4 125.2 L 109.4 126.2 L 113.8 122.4 L 111.0 122.7 L 109.4 121.1 L 107.1 122.7 L 106.5 124.6 L 102.1 123.0 L 99.8 122.4",
      length: 37.3
    },
    {
      d: "M 130.3 117.3 L 128.4 118.9 L 127.8 119.2 L 121.7 121.7 L 115.7 123.0 L 114.4 122.4 L 120.8 122.1",
      length: 23.7
    },
    {
      d: "M 109.4 116.3 L 109.7 111.3 L 110.0 112.9",
      length: 6.6
    },
    {
      d: "M 82.4 138.9 L 79.8 136.7",
      length: 3.4
    },
    {
      d: "M 184.0 94.8 L 181.1 92.9",
      length: 3.5
    },
    {
      d: "M 135.1 91.3 L 130.3 86.5",
      length: 6.8
    },
    {
      d: "M 135.7 191.3 L 133.5 191.0",
      length: 2.2
    },
    {
      d: "M 140.5 65.2 L 138.9 63.7",
      length: 2.2
    },
    {
      d: "M 123.3 191.6 L 124.9 191.3",
      length: 1.6
    }
  ]
};

export function AppSplashScreen({ onAnimationComplete }: { onAnimationComplete?: () => void }) {
  // Shared values for drawing animations
  const hairDraw = useSharedValue(1);       // 1 = hidden, 0 = fully drawn
  const faceDraw = useSharedValue(1);       // 1 = hidden, 0 = fully drawn
  const featuresDraw = useSharedValue(1);   // 1 = hidden, 0 = fully drawn

  // Overall container controls
  const containerOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);

  // Text / wordmark animations
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(12);

  // Background glow animation
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Kick off hair swoop and profile lines simultaneously
    hairDraw.value = withTiming(0, {
      duration: 1100,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
    });

    faceDraw.value = withTiming(0, {
      duration: 1200,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
    });

    // 2. Secondary fine features (eye, brow) start drawing with a slight offset
    featuresDraw.value = withDelay(
      350,
      withTiming(0, {
        duration: 900,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
      })
    );

    // 3. Elegant text fade-in and soft radial background glow
    textOpacity.value = withDelay(
      850,
      withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.quad),
      })
    );
    textTranslateY.value = withDelay(
      850,
      withTiming(0, {
        duration: 800,
        easing: Easing.out(Easing.quad),
      })
    );

    glowOpacity.value = withDelay(
      900,
      withTiming(1, {
        duration: 1200,
        easing: Easing.out(Easing.quad),
      })
    );

    // 4. Fire clean tactile feedback once outline snaps into focus
    const hapticTimer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 1000);

    // 5. Smooth exit zoom (cinematic reveal transitions into home/onboarding)
    const exitTimer = setTimeout(() => {
      containerOpacity.value = withTiming(0, {
        duration: 500,
        easing: Easing.inOut(Easing.quad),
      });
      containerScale.value = withTiming(1.08, {
        duration: 550,
        easing: Easing.in(Easing.cubic),
      });
    }, 2450);

    // 6. Final callback trigger
    const completeTimer = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 3000);

    return () => {
      clearTimeout(hapticTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  // Shared container style
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value,
      transform: [{ scale: containerScale.value }],
    };
  });

  // Text animation style
  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [{ translateY: textTranslateY.value }],
    };
  });

  // Background ambient glow style
  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value * 0.42,
    };
  });

  // Generate dynamic stroke props for drawing each line category
  const createAnimatedPathProps = (progressValue: SharedValue<number>, length: number) => {
    return useAnimatedProps(() => {
      return {
        strokeDashoffset: progressValue.value * length,
      };
    });
  };

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <View style={styles.center}>
        {/* Main Logo Container */}
        <View style={styles.svgWrapper}>
          <Svg
            width={170}
            height={170}
            viewBox="0 0 300 300"
            style={styles.svg}
          >
            {/* 1. Hair Swoop Line */}
            {LOGO_PATHS.hair.map((p, i) => {
              const animProps = createAnimatedPathProps(hairDraw, p.length);
              return (
                <AnimatedPath
                  key={`hair-${i}`}
                  d={p.d}
                  stroke={tokens.colors.pinkDeep}
                  strokeWidth={2.8}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={p.length}
                  animatedProps={animProps}
                />
              );
            })}

            {/* 2. Face Profile Silhouette */}
            {LOGO_PATHS.face.map((p, i) => {
              const animProps = createAnimatedPathProps(faceDraw, p.length);
              return (
                <AnimatedPath
                  key={`face-${i}`}
                  d={p.d}
                  stroke={tokens.colors.pinkDeep}
                  strokeWidth={2.8}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={p.length}
                  animatedProps={animProps}
                />
              );
            })}

            {/* 3. Detail Features (eyes, brows, lashes) */}
            {LOGO_PATHS.features.map((p, i) => {
              const animProps = createAnimatedPathProps(featuresDraw, p.length);
              return (
                <AnimatedPath
                  key={`feat-${i}`}
                  d={p.d}
                  stroke={tokens.colors.pinkDeep}
                  strokeWidth={2.2}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={p.length}
                  animatedProps={animProps}
                />
              );
            })}
          </Svg>
        </View>

        {/* Wordmark and Tagline */}
        <Animated.View style={[styles.brandBlock, animatedTextStyle]}>
          <Text style={styles.wordmark}>REMAKE</Text>
          <Text style={styles.tagline}>Your makeup, analysed. Daily.</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.beige,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: tokens.colors.pinkRich,
    filter: 'blur(75px)', // Premium ambient blur
  },
  center: {
    alignItems: 'center',
    gap: 16,
  },
  svgWrapper: {
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  svg: {
    overflow: 'visible',
  },
  brandBlock: {
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontFamily: tokens.fonts.serif,
    fontSize: 50,
    fontWeight: '400',
    color: tokens.colors.pinkRich,
    letterSpacing: 4,
    paddingHorizontal: 20, // Prevent Playfair slant clipping
    textAlign: 'center',
  },
  tagline: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '300',
    color: tokens.colors.gray,
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
});
