import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, TextInput, Alert,
  KeyboardAvoidingView, Platform, ScrollView, Pressable,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import { signUp, signInDev, DEV_BYPASS } from '@/lib/auth';
import { isValidEmail, isValidPassword, sanitizeEmail } from '@/lib/validation';
import { clearGloDraft } from '@/lib/glo-profile';
import * as Haptics from 'expo-haptics';

export default function CreateAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const validate = (): boolean => {
    let valid = true;

    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setEmailError('Enter a valid email address');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!isValidPassword(password)) {
      setPasswordError('At least 8 characters with a letter and number');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (password !== confirmPassword) {
      setConfirmError('Passwords don\'t match');
      valid = false;
    } else {
      setConfirmError('');
    }

    return valid;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      if (DEV_BYPASS) {
        await signInDev();
        await clearGloDraft();
        router.replace('/(onboarding)/dna-loading');
        return;
      }

      const { error } = await signUp(sanitizeEmail(email), password);
      if (error) {
        Alert.alert('Sign up failed', error.message);
      } else {
        await clearGloDraft();
        router.replace('/(onboarding)/dna-loading');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(onboarding)/dna-loading');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.kav, { backgroundColor: tokens.colors.beige }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(80).duration(500)} style={styles.header}>
          <Text style={styles.eyebrow}>Almost there</Text>
          <Text style={styles.title}>Create your account{'\n'}to see your Beauty Wrapped.</Text>
          <Text style={styles.sub}>Save your results, track your progress, and unlock personalised coaching.</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(240).duration(500)} style={styles.form}>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="you@example.com"
              placeholderTextColor={tokens.colors.grayLight}
              value={email}
              onChangeText={t => { setEmail(t); if (emailError) setEmailError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailError ? <Text style={styles.error}>{emailError}</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputFlex, passwordError ? styles.inputError : null]}
                placeholder="Min. 8 chars, 1 letter, 1 number"
                placeholderTextColor={tokens.colors.grayLight}
                value={password}
                onChangeText={t => { setPassword(t); if (passwordError) setPasswordError(''); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Confirm password</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputFlex, confirmError ? styles.inputError : null]}
                placeholder="Repeat your password"
                placeholderTextColor={tokens.colors.grayLight}
                value={confirmPassword}
                onChangeText={t => { setConfirmPassword(t); if (confirmError) setConfirmError(''); }}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
                <Text style={styles.eyeText}>{showConfirm ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            {confirmError ? <Text style={styles.error}>{confirmError}</Text> : null}
          </View>

        </Animated.View>

        <View style={styles.spacer} />

        <Animated.View entering={FadeInUp.delay(440).duration(500)} style={styles.bottom}>
          <GlassButton
            title={loading ? 'Creating account…' : 'Create Account'}
            onPress={handleCreate}
            variant="primary"
            style={styles.cta}
            disabled={!email.trim() || !password || !confirmPassword || loading}
          />
          <Text style={styles.legal}>By continuing you agree to our Terms of Service and Privacy Policy.</Text>
          <Pressable onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28 },
  header: { marginBottom: 32 },
  eyebrow: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '500', letterSpacing: 1.2, textTransform: 'uppercase', color: tokens.colors.grayLight, marginBottom: 14 },
  title: { fontFamily: tokens.fonts.serif, fontSize: 32, fontWeight: '400', color: tokens.colors.text, lineHeight: 42, marginBottom: 10 },
  sub: { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '300', color: tokens.colors.gray, lineHeight: 22 },
  form: { gap: 16 },
  field: { gap: 6 },
  fieldLabel: { fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '500', color: tokens.colors.gray, letterSpacing: 0.1 },
  input: { backgroundColor: tokens.colors.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontFamily: tokens.fonts.regular, fontSize: 15, color: tokens.colors.text, borderWidth: 1.5, borderColor: tokens.colors.border },
  inputFlex: { flex: 1 },
  inputError: { borderColor: '#FF3B30' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eyeBtn: { paddingHorizontal: 4, paddingVertical: 4 },
  eyeText: { fontFamily: tokens.fonts.regular, fontSize: 13, color: tokens.colors.gray, textDecorationLine: 'underline' },
  error: { fontFamily: tokens.fonts.regular, fontSize: 12, color: '#FF3B30' },
  spacer: { flex: 1, minHeight: 32 },
  bottom: { alignItems: 'center', gap: 10 },
  cta: { width: '100%' },
  legal: { fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.grayLight, textAlign: 'center' },
  skipBtn: { paddingVertical: 8 },
  skipText: { fontFamily: tokens.fonts.regular, fontSize: 13, color: tokens.colors.gray, textDecorationLine: 'underline' },
});
