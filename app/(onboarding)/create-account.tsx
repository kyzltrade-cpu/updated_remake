import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import { OnboardingPagination } from '@/components/onboarding-pagination';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { signInWithOtp, signInDev, DEV_BYPASS } from '@/lib/auth';
import { isValidEmail, isValidName, sanitizeName, sanitizeEmail } from '@/lib/validation';

export default function CreateAccountScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');

  const validateInputs = (): boolean => {
    let valid = true;

    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setEmailError('Please enter a valid email address');
      valid = false;
    } else {
      setEmailError('');
    }

    const cleanName = sanitizeName(name);
    if (!cleanName || !isValidName(cleanName)) {
      setNameError('Please enter your name');
      valid = false;
    } else {
      setNameError('');
    }

    return valid;
  };

  const handleContinue = async () => {
    if (!validateInputs()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      if (DEV_BYPASS) {
        await signInDev();
        await AsyncStorage.setItem('@remake_onboarding_complete', 'true');
        router.replace('/(main)/home');
      } else {
        const cleanEmail = sanitizeEmail(email);
        const cleanName = sanitizeName(name);

        const { error } = await signInWithOtp(cleanEmail, {
          data: { full_name: cleanName },
        });
        if (error) {
          Alert.alert('Sign in failed', error.message);
        } else {
          await AsyncStorage.setItem('@remake_onboarding_complete', 'true');
          router.replace('/(main)/home');
        }
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError('');
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (nameError) setNameError('');
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
        <Text style={styles.tag}>Create Account</Text>
        <Text style={styles.title}>Your journey{'\n'}starts here.</Text>
        <Text style={styles.sub}>Enter your email to get your free scan.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.form}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={[styles.input, nameError ? styles.inputError : null]}
            placeholder="Your name"
            placeholderTextColor={tokens.colors.grayLight}
            value={name}
            onChangeText={handleNameChange}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={100}
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        </View>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="you@example.com"
            placeholderTextColor={tokens.colors.grayLight}
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.bottom}>
        <GlassButton
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          style={styles.cta}
          disabled={!email.trim() || !name.trim() || loading}
        />
        <Text style={styles.legal}>By continuing you agree to our Terms of Service and Privacy Policy.</Text>
        <OnboardingPagination total={10} current={5} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.beige, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 50 },
  header: { alignItems: 'center', marginBottom: 40 },
  tag: { fontFamily: tokens.fonts.regular, fontSize: 11, letterSpacing: 0.16, textTransform: 'uppercase', color: tokens.colors.gray, fontWeight: '500', marginBottom: 20 },
  title: { fontFamily: tokens.fonts.serif, fontSize: 34, fontWeight: '400', color: tokens.colors.text, textAlign: 'center', lineHeight: 44, marginBottom: 12 },
  sub: { fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '300', color: tokens.colors.gray, textAlign: 'center' },
  form: { flex: 1 },
  inputWrapper: { marginBottom: 16 },
  inputLabel: { fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '500', color: tokens.colors.gray, marginBottom: 8, letterSpacing: 0.05 },
  input: { backgroundColor: tokens.colors.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontFamily: tokens.fonts.regular, fontSize: 15, color: tokens.colors.text, borderWidth: 1, borderColor: tokens.colors.border },
  inputError: { borderColor: '#ff3b30' },
  errorText: { color: '#ff3b30', fontSize: 12, marginTop: 4 },
  bottom: { alignItems: 'center', gap: 12 },
  cta: { width: '100%' },
  legal: { fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.grayLight, textAlign: 'center' },
});