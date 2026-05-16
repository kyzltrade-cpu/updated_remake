import { useEffect, useRef, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { saveGloField } from '@/lib/glo-profile';

const STEPS = [
  'Reading your undertone...',
  'Mapping your face shape...',
  'Decoding your colour season...',
  'Building your profile...',
  'Almost there...',
];

// TODO: Replace with real Gemini 2.5 Flash call
// POST to https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
// Include base64 image in parts[].inlineData, prompt for undertone/face_shape/skin_hex/colour_season
// Store EXPO_PUBLIC_GEMINI_API_KEY in .env
async function analyseWithGemini(photoUri: string): Promise<{
  undertone: string;
  face_shape: string;
  skin_hex: string;
  colour_season: string;
  archetype: string;
}> {
  await new Promise(res => setTimeout(res, 5000));
  return {
    undertone: 'warm',
    face_shape: 'oval',
    skin_hex: '#C8956A',
    colour_season: 'Autumn Warm',
    archetype: 'Coquette Rose',
  };
}

export default function ProcessingScreen() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const startTime = useRef(Date.now());

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 1.4 - scale.value,
  }));

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2400, easing: Easing.linear }),
      -1,
    );
    scale.value = withRepeat(
      withTiming(1.3, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setStepIndex(i => (i + 1) % STEPS.length);
        setVisible(true);
      }, 300);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const run = async () => {
      const results = await analyseWithGemini(uri ?? '');
      await saveGloField(results);
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, 6000 - elapsed);
      setTimeout(() => router.replace('/(onboarding)/reveal'), remaining);
    };
    run();
  }, [uri]);

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <View style={styles.ringWrap}>
          <Animated.View style={[styles.pulse, pulseStyle]} />
          <Animated.View style={[styles.ring, ringStyle]}>
            <View style={styles.ringDot} />
          </Animated.View>
          <View style={styles.ringInner} />
        </View>

        {visible ? (
          <Animated.Text
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.step}
          >
            {STEPS[stepIndex]}
          </Animated.Text>
        ) : null}
      </View>

      <Text style={styles.brand}>REMAKE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.darkBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    gap: 36,
  },
  ringWrap: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(232,160,170,0.08)',
  },
  ring: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: 'rgba(232,160,170,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  ringDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.colors.pinkDeep,
    marginTop: -4,
  },
  ringInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: tokens.colors.pinkDeep,
    borderTopColor: 'transparent',
    borderRightColor: 'rgba(232,160,170,0.3)',
  },
  step: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    color: tokens.colors.grayLight,
    letterSpacing: 0.04,
  },
  brand: {
    position: 'absolute',
    bottom: 50,
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    letterSpacing: 0.16,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.15)',
    fontWeight: '500',
  },
});
