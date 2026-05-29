import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';
import { ob } from '@/components/onboarding-styles';
import { GlassButton } from '@/components/glass-button';
import { OnboardingHeader } from '@/components/onboarding-header';
import { isValidEmail, sanitizeEmail } from '@/lib/validation';

export default function EmailCaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleContinue = async () => {
    const clean = sanitizeEmail(email);
    if (!clean || !isValidEmail(clean)) {
      setError('Enter a valid email address');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem('@remake_pending_email', clean);
    router.push('/(onboarding)/tracking-permission');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.kav]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[ob.root, { paddingBottom: insets.bottom + 40 }]}>
        <OnboardingHeader step={0} total={0} onBack={() => router.back()} />

        <Animated.View entering={FadeInUp.delay(80).duration(500)} style={ob.header}>
          <Text style={ob.eyebrow}>Almost there</Text>
          <Text style={ob.title}>Where should we{'\n'}send your results?</Text>
          <Text style={ob.sub}>
            Your DNA card and scan history are saved to your account. Never shared.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(220).duration(500)}>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="you@example.com"
            placeholderTextColor={tokens.colors.grayLight}
            value={email}
            onChangeText={t => { setEmail(t); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
          {error ? (
            <Animated.Text entering={FadeIn.duration(200)} style={styles.errorText}>
              {error}
            </Animated.Text>
          ) : null}
        </Animated.View>

        <View style={ob.spacer} />

        <Animated.View entering={FadeInUp.delay(380).duration(500)} style={styles.bottom}>
          <GlassButton
            title="Create My Account"
            onPress={handleContinue}
            variant="primary"
            style={styles.cta}
            disabled={!email.trim()}
          />
          <Text style={ob.footnote}>Free account · No card required</Text>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kav: {
    flex: 1,
    backgroundColor: tokens.colors.cream,
  },
  input: {
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    color: tokens.colors.text,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
  },
  inputError: { borderColor: '#E85A39' },
  errorText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    color: '#E85A39',
    marginTop: 6,
  },
  bottom: { gap: 10, alignItems: 'center' },
  cta: { width: '100%' },
});
