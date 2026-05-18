import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeIn, FadeOut, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_KEY } from '../_layout';
import { analyzeDna } from '@/lib/api/dna';
import { getOnboardingData } from '@/lib/onboarding-store';
import type { PriorityCategory } from '@/lib/onboarding-store';
import { saveDnaResult } from '@/lib/api/scan-storage';
import { useAuth } from '@/contexts/AuthContext';

const LOADING_STEPS = [
  'Reading your face shape...',
  'Mapping your skin undertones...',
  'Finding your colour season...',
  'Matching your brow blueprint...',
  'Building your archetype...',
  'Almost ready...',
];

function PulsingRing() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 }),
      ),
      -1,
      false,
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.ringWrap}>
      <Animated.View style={[styles.ringOuter, ringStyle]} />
      <View style={styles.ringMiddle} />
      <View style={styles.ringInner}>
        <Text style={styles.dnaEmoji}>✦</Text>
      </View>
    </View>
  );
}

function StepText({ text }: { text: string }) {
  return (
    <Animated.Text
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(300)}
      style={styles.stepText}
      key={text}
    >
      {text}
    </Animated.Text>
  );
}

export default function DnaLoadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string }>();
  const { user } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex(i => Math.min(i + 1, LOADING_STEPS.length - 1));
    }, 900);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const run = async () => {
      if (params.uri) {
        // Initial onboarding path: save URI for post-payment processing, skip API call
        await AsyncStorage.setItem('pending_dna_uri', params.uri);
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        // Let loading animation play through
        await new Promise<void>(resolve => setTimeout(resolve, 3400));
        router.replace('/(main)/dna-reveal');
        return;
      }

      // Post-payment path: read saved URI and call API now
      try {
        const pendingUri = await AsyncStorage.getItem('pending_dna_uri');
        if (!pendingUri) {
          router.replace('/(main)/dna-reveal');
          return;
        }
        const { priorityCategory } = await getOnboardingData();
        const dna = await analyzeDna({
          imageUri: pendingUri,
          priorityCategory: (priorityCategory ?? 'Blending') as PriorityCategory,
        });
        await AsyncStorage.setItem('dna_result', JSON.stringify(dna));
        if (user?.id) saveDnaResult(user.id, dna).catch(() => null);
        router.replace('/(main)/dna-reveal');
      } catch {
        router.replace('/(main)/dna-reveal');
      }
    };

    run();
  }, []);

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0A0A0A', '#1A1210', '#0A0A0A']} style={StyleSheet.absoluteFill} />

      <Animated.View entering={FadeIn.duration(800)} style={styles.content}>
        <PulsingRing />

        <View style={styles.textArea}>
          <Text style={styles.headline}>Discovering your{'\n'}Beauty DNA</Text>
          <StepText text={LOADING_STEPS[stepIndex]} />
        </View>

        <View style={styles.dotsRow}>
          {LOADING_STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i <= stepIndex ? styles.progressDotActive : styles.progressDotEmpty,
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', paddingHorizontal: 40, gap: 48 },

  ringWrap: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center' },
  ringOuter: {
    position: 'absolute',
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(200,168,130,0.25)',
    shadowColor: '#C8A882',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  ringMiddle: {
    position: 'absolute',
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(200,168,130,0.55)',
  },
  ringInner: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(200,168,130,0.12)',
    borderWidth: 1.5,
    borderColor: '#C8A882',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dnaEmoji: { fontSize: 22, color: '#C8A882' },

  textArea: { alignItems: 'center', gap: 12 },
  headline: {
    fontFamily: 'Playfair Display',
    fontSize: 28, color: '#FFF9F7',
    textAlign: 'center', lineHeight: 38,
  },
  stepText: {
    fontFamily: 'Inter',
    fontSize: 14, color: 'rgba(255,249,247,0.55)',
    letterSpacing: 0.3,
  },

  dotsRow: { flexDirection: 'row', gap: 6 },
  progressDot: {
    width: 5, height: 5, borderRadius: 2.5,
  },
  progressDotActive: { backgroundColor: '#C8A882' },
  progressDotEmpty: { backgroundColor: 'rgba(255,249,247,0.15)' },
});
