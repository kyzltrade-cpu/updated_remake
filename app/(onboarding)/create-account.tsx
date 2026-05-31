import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TextInput, Alert, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { signUp, signInDev, DEV_BYPASS } from '@/lib/auth';
import { isValidEmail, isValidPassword, sanitizeEmail } from '@/lib/validation';
import { clearGloDraft } from '@/lib/glo-profile';
import { tokens } from '@/components/theme';

const advance = (router: ReturnType<typeof useRouter>) => {
  router.replace('/(onboarding)/first-scan');
};

export default function CreateAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailErr, setEmailErr] = useState('');
  const [passErr, setPassErr] = useState('');

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    advance(router);
  };

  const handleDevOrCreate = async () => {
    if (DEV_BYPASS) {
      await signInDev();
      await clearGloDraft();
      advance(router);
      return;
    }
    let valid = true;
    const clean = sanitizeEmail(email);
    if (!clean || !isValidEmail(clean)) { setEmailErr('Enter a valid email'); valid = false; } else setEmailErr('');
    if (!isValidPassword(password)) { setPassErr('Min. 8 chars with a letter and number'); valid = false; } else setPassErr('');
    if (!valid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const { error } = await signUp(clean, password);
      if (error) { Alert.alert('Sign up failed', error.message); }
      else { await clearGloDraft(); advance(router); }
    } catch { Alert.alert('Error', 'Something went wrong. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.root, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }]}>
        <Animated.Text entering={FadeInUp.delay(80).duration(500)} style={styles.title}>
          Save your{'\n'}progress.
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(140).duration(500)} style={styles.sub}>
          Don't lose your Beauty DNA. Save it now.
        </Animated.Text>

        {!showEmail ? (
          <Animated.View entering={FadeInUp.delay(220).duration(500)} style={styles.buttons}>
            <Pressable style={[styles.ssoBtn, styles.appleBtn]} onPress={handleDevOrCreate}>
              <Text style={styles.appleBtnText}>🍎  Sign in with Apple</Text>
            </Pressable>
            <Pressable style={[styles.ssoBtn, styles.googleBtn]} onPress={handleDevOrCreate}>
              <Text style={styles.googleBtnText}>G  Sign in with Google</Text>
            </Pressable>
            <Pressable onPress={() => setShowEmail(true)} hitSlop={8}>
              <Text style={styles.emailToggle}>Use email & password</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(300)} style={styles.emailForm}>
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
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput
                style={[styles.input, passErr ? styles.inputErr : null]}
                placeholder="Min. 8 chars, 1 letter, 1 number"
                placeholderTextColor="rgba(61,53,50,0.28)"
                value={password}
                onChangeText={t => { setPassword(t); setPassErr(''); }}
                secureTextEntry
                autoCapitalize="none"
              />
              {passErr ? <Text style={styles.errText}>{passErr}</Text> : null}
            </View>
            <Pressable
              onPress={handleDevOrCreate}
              disabled={loading}
              style={[styles.cta, loading && styles.ctaDim]}
            >
              <Text style={styles.ctaText}>{loading ? 'Creating…' : 'Create Account'}</Text>
            </Pressable>
          </Animated.View>
        )}

        <View style={{ flex: 1 }} />

        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.footer}>
          <Pressable onPress={handleSkip} hitSlop={8}>
            <Text style={styles.skip}>Would you like to sign in later? <Text style={styles.skipBold}>Skip</Text></Text>
          </Pressable>
          <Text style={styles.legal}>By continuing you agree to our Terms & Privacy Policy.</Text>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.cream,
    paddingHorizontal: 28,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 40,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 52,
    marginBottom: 10,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    color: tokens.colors.gray,
    marginBottom: 36,
    lineHeight: 22,
  },
  buttons: { gap: 12 },
  ssoBtn: {
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleBtn: {
    backgroundColor: tokens.colors.text,
  },
  appleBtnText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  googleBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  googleBtnText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '600',
    color: tokens.colors.text,
  },
  emailToggle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: tokens.colors.pinkDeep,
    textAlign: 'center',
    paddingVertical: 4,
  },
  emailForm: { gap: 14 },
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
    paddingVertical: 14,
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    color: tokens.colors.text,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  inputErr: { borderColor: tokens.colors.pinkDeep },
  errText: { fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.pinkDeep },
  cta: {
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 7,
    marginTop: 6,
  },
  ctaDim: { opacity: 0.6 },
  ctaText: { fontFamily: tokens.fonts.regular, fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  footer: { gap: 10, alignItems: 'center' },
  skip: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: tokens.colors.gray,
    textAlign: 'center',
  },
  skipBold: { fontWeight: '700', color: tokens.colors.text, textDecorationLine: 'underline' },
  legal: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: tokens.colors.grayLight,
    textAlign: 'center',
    lineHeight: 16,
  },
});
