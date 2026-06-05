import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TextInput, Alert, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { signUp, signInDev, DEV_BYPASS } from '@/lib/auth';
import { isValidEmail, isValidPassword, sanitizeEmail } from '@/lib/validation';
import { loadGloDraft, clearGloDraft } from '@/lib/glo-profile';
import { tokens } from '@/components/theme';
import { createClient } from '@/lib/supabase';

const advance = (router: ReturnType<typeof useRouter>) => {
  router.replace('/(onboarding)/first-scan');
};

export default function CreateAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailErr, setEmailErr] = useState('');
  const [passErr, setPassErr] = useState('');

  const handleDevOrCreate = async () => {
    if (DEV_BYPASS) {
      const { data } = await signInDev();
      const draft = await loadGloDraft();
      if (data?.session?.user?.id && Object.keys(draft).length > 0) {
        const supabase = createClient() as any;
        await supabase.from('profiles').update({ onboarding_data: draft }).eq('id', data.session.user.id);
      }
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
      const { data, error } = await signUp(clean, password);
      if (error) { Alert.alert('Sign up failed', error.message); }
      else {
        const draft = await loadGloDraft();
        if (data?.user?.id && Object.keys(draft).length > 0) {
          const supabase = createClient() as any;
          await supabase.from('profiles').update({ onboarding_data: draft }).eq('id', data.user.id);
        }
        await clearGloDraft(); 
        advance(router); 
      }
    } catch { Alert.alert('Error', 'Something went wrong. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.root, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
        <Animated.Text entering={FadeInUp.delay(80).duration(500)} style={styles.title}>
          Save your{'\n'}progress.
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(140).duration(500)} style={styles.sub}>
          Don't lose your Beauty DNA. Save it now.
        </Animated.Text>

        <Animated.View entering={FadeInUp.delay(220).duration(500)} style={styles.formContainer}>
          {/* Email Form */}
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

          {/* Primary CTA Sign-up button */}
          <Pressable
            onPress={handleDevOrCreate}
            disabled={loading}
            style={[styles.cta, loading && styles.ctaDim]}
          >
            <Text style={styles.ctaText}>{loading ? 'Creating…' : 'Create Account'}</Text>
          </Pressable>

          {/* Elegant Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* SSO Buttons */}
          <View style={styles.ssoButtons}>
            <Pressable style={[styles.ssoBtn, styles.appleBtn]} onPress={handleDevOrCreate}>
              <Text style={styles.appleBtnText}>🍎  Sign in with Apple</Text>
            </Pressable>
            <Pressable style={[styles.ssoBtn, styles.googleBtn]} onPress={handleDevOrCreate}>
              <Text style={styles.googleBtnText}>G  Sign in with Google</Text>
            </Pressable>
          </View>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View entering={FadeInUp.delay(320).duration(500)} style={styles.footer}>
          <Pressable onPress={() => router.push('/(onboarding)/sign-in')} hitSlop={12}>
            <Text style={styles.signInLink}>
              Already have an account? <Text style={styles.signInLinkBold}>Sign In</Text>
            </Text>
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
    marginBottom: 8,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    color: tokens.colors.gray,
    marginBottom: 28,
    lineHeight: 22,
  },
  formContainer: {
    gap: 14,
  },
  field: {
    gap: 6,
  },
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
  inputErr: {
    borderColor: tokens.colors.pinkDeep,
  },
  errText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: tokens.colors.pinkDeep,
  },
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
    marginTop: 4,
  },
  ctaDim: {
    opacity: 0.6,
  },
  ctaText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  dividerText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: tokens.colors.grayLight,
    fontWeight: '500',
  },
  ssoButtons: {
    gap: 10,
  },
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
  footer: {
    gap: 10,
    alignItems: 'center',
  },
  signInLink: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: tokens.colors.gray,
    textAlign: 'center',
    marginBottom: 8,
  },
  signInLinkBold: {
    fontWeight: '700',
    color: tokens.colors.pinkDeep,
    textDecorationLine: 'underline',
  },
  legal: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: tokens.colors.grayLight,
    textAlign: 'center',
    lineHeight: 16,
  },
});
