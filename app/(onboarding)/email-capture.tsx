import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '@/components/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { isValidEmail, sanitizeEmail } from '@/lib/validation';

export default function EmailCaptureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string }>();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleAnalyse = async () => {
    const clean = sanitizeEmail(email);
    if (!clean || !isValidEmail(clean)) {
      setError('Enter a valid email address');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem('@remake_pending_email', clean);
    router.replace({
      pathname: '/(onboarding)/dna-loading',
      params: { uri: params.uri },
    });
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace({
      pathname: '/(onboarding)/dna-loading',
      params: { uri: params.uri },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[tokens.colors.darkBg, '#2A0822', tokens.colors.darkBg]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.top}>
          <Text style={styles.eyebrow}>Almost there</Text>
          <Text style={styles.headline}>Where do we send{'\n'}your Beauty DNA?</Text>
          <Text style={styles.sub}>We'll email your full results after the analysis.</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.inputWrap}>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="you@example.com"
            placeholderTextColor="rgba(255,249,247,0.3)"
            value={email}
            onChangeText={t => { setEmail(t); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          {error ? (
            <Animated.Text entering={FadeIn.duration(200)} style={styles.errorText}>{error}</Animated.Text>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.bottom}>
          <Pressable
            style={({ pressed }) => [
              styles.cta,
              !email.trim() && styles.ctaDisabled,
              pressed && { opacity: 0.88 },
            ]}
            onPress={handleAnalyse}
            disabled={!email.trim()}
          >
            <Text style={styles.ctaText}>Analyse my look →</Text>
          </Pressable>

          <Pressable onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 90,
    paddingBottom: 50,
    justifyContent: 'space-between',
  },
  top: { gap: 12 },
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3.5,
    color: tokens.colors.pinkMid,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: tokens.fonts.serif,
    fontSize: 36,
    color: tokens.colors.white,
    lineHeight: 46,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    color: 'rgba(255,249,247,0.55)',
    lineHeight: 23,
  },
  inputWrap: { gap: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    color: tokens.colors.white,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  inputError: { borderColor: '#E85A39' },
  errorText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    color: '#E85A39',
  },
  bottom: { gap: 14, alignItems: 'center' },
  cta: {
    width: '100%',
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.white,
  },
  skipBtn: { paddingVertical: 8 },
  skipText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: 'rgba(255,249,247,0.4)',
    textDecorationLine: 'underline',
  },
});
