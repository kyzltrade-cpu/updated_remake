import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, TextInput, Alert, Pressable,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { sendResetPasswordEmail } from '@/lib/auth';
import { isValidEmail, sanitizeEmail } from '@/lib/validation';
import { tokens } from '@/components/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailErr, setEmailErr] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSendReset = async () => {
    let valid = true;
    const clean = sanitizeEmail(email);
    if (!clean || !isValidEmail(clean)) {
      setEmailErr('Enter a valid email');
      valid = false;
    } else {
      setEmailErr('');
    }
    if (!valid) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const { error } = await sendResetPasswordEmail(clean);
      if (error) {
        Alert.alert('Request Failed', error.message);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccess(true);
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}
      onPress={Keyboard.dismiss}
      accessible={false}
    >
      {/* Back */}
      <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <View style={{ flex: 1 }}>
          <Animated.Text entering={FadeInUp.delay(80).duration(500)} style={styles.title}>
            {success ? "Check inbox." : "Reset password."}
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(140).duration(500)} style={styles.sub}>
            {success 
              ? `We have sent a secure password reset link to ${email}. Please check your email to continue.`
              : "Enter the email associated with your REMAKE account and we'll send you a secure link to reset your password."
            }
          </Animated.Text>

          {!success && (
            <Animated.View entering={FadeInUp.delay(220).duration(500)} style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={[styles.input, emailErr ? styles.inputErr : null]}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(61,53,50,0.28)"
                  value={email}
                  onChangeText={t => { setEmail(t); setEmailErr(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
                {emailErr ? <Text style={styles.errText}>{emailErr}</Text> : null}
              </View>
            </Animated.View>
          )}

          <View style={{ flex: 1 }} />

          <Animated.View entering={FadeInUp.delay(300).duration(500)} style={{ marginBottom: 16 }}>
            {success ? (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>Back to Sign In</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleSendReset}
                disabled={loading}
                style={[styles.cta, loading && styles.ctaDim]}
              >
                <Text style={styles.ctaText}>{loading ? 'Sending link…' : 'Send Reset Link'}</Text>
              </Pressable>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.cream,
    paddingHorizontal: 28,
  },
  backBtn: {
    marginBottom: 24,
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: tokens.colors.text,
    lineHeight: 36,
    includeFontPadding: false,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 38,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 50,
    marginBottom: 8,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    color: tokens.colors.gray,
    marginBottom: 36,
    lineHeight: 22,
  },
  form: { gap: 16 },
  field: { gap: 6 },
  fieldLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.gray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
    fontFamily: tokens.fonts.regular,
    color: tokens.colors.text,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputErr: {
    borderColor: tokens.colors.pinkDeep,
    backgroundColor: 'rgba(232,160,170,0.05)',
  },
  errText: {
    fontSize: 12,
    fontFamily: tokens.fonts.regular,
    color: tokens.colors.pinkDeep,
    marginTop: 2,
  },
  cta: {
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDim: {
    opacity: 0.62,
  },
  ctaText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
