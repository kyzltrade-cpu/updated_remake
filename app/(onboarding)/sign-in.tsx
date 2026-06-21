import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, TextInput, Alert, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { signIn, signInDev, DEV_BYPASS, signInWithGoogle, signInWithApple } from '@/lib/auth';
import { isValidEmail, sanitizeEmail } from '@/lib/validation';
import { loadGloDraft, clearGloDraft } from '@/lib/glo-profile';
import { createClient } from '@/lib/supabase';
import { tokens } from '@/components/theme';
import Svg, { Path } from 'react-native-svg';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailErr, setEmailErr] = useState('');
  const [passErr, setPassErr] = useState('');

  const advance = () => router.replace('/(main)/home');

  const handleSignIn = async () => {
    if (DEV_BYPASS) {
      const { data } = await signInDev();
      const draft = await loadGloDraft();
      if (data?.session?.user?.id && Object.keys(draft).length > 0) {
        const supabase = createClient() as any;
        await supabase.from('profiles').update({ onboarding_data: draft }).eq('id', data.session.user.id);
      }
      await clearGloDraft();
      advance();
      return;
    }

    let valid = true;
    const clean = sanitizeEmail(email);
    if (!clean || !isValidEmail(clean)) {
      setEmailErr('Enter a valid email');
      valid = false;
    } else {
      setEmailErr('');
    }
    if (!password) {
      setPassErr('Enter your password');
      valid = false;
    } else {
      setPassErr('');
    }
    if (!valid) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const { data, error } = await signIn(clean, password);
      if (error) {
        Alert.alert('Sign in failed', error.message);
      } else {
        const draft = await loadGloDraft();
        if (data?.user?.id && Object.keys(draft).length > 0) {
          const supabase = createClient() as any;
          await supabase.from('profiles').update({ onboarding_data: draft }).eq('id', data.user.id);
        }
        await clearGloDraft();
        advance();
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const { data, error } = await signInWithGoogle();
      if (error) {
        if (error.code !== 'CANCELED') {
          Alert.alert('Google Sign-In failed', error.message);
        }
      } else {
        const draft = await loadGloDraft();
        if (data?.user?.id && Object.keys(draft).length > 0) {
          const supabase = createClient() as any;
          await supabase.from('profiles').update({ onboarding_data: draft }).eq('id', data.user.id);
        }
        await clearGloDraft();
        advance();
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const { data, error } = await signInWithApple();
      if (error) {
        if (error.code !== 'CANCELED') {
          Alert.alert('Apple Sign-In failed', error.message);
        }
      } else {
        const draft = await loadGloDraft();
        if (data?.user?.id && Object.keys(draft).length > 0) {
          const supabase = createClient() as any;
          await supabase.from('profiles').update({ onboarding_data: draft }).eq('id', data.user.id);
        }
        await clearGloDraft();
        advance();
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}>
        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <Animated.Text entering={FadeInUp.delay(80).duration(500)} style={styles.title}>
          Welcome back.
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(140).duration(500)} style={styles.sub}>
          Sign in to your REMAKE account.
        </Animated.Text>

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

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              style={[styles.input, passErr ? styles.inputErr : null]}
              placeholder="Your password"
              placeholderTextColor="rgba(61,53,50,0.28)"
              value={password}
              onChangeText={t => { setPassword(t); setPassErr(''); }}
              secureTextEntry
              autoCapitalize="none"
            />
            {passErr ? <Text style={styles.errText}>{passErr}</Text> : null}
          </View>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View entering={FadeInUp.delay(360).duration(500)} style={styles.bottom}>
          <Pressable
            onPress={handleSignIn}
            disabled={loading}
            style={[styles.cta, loading && styles.ctaDim]}
          >
            <Text style={styles.ctaText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
          </Pressable>

          {/* Elegant Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* SSO Buttons */}
          <View style={styles.ssoButtons}>
            <Pressable style={[styles.ssoBtn, styles.appleBtn]} onPress={handleAppleSignIn}>
              <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.ssoIcon}>
                <Path
                  d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-.1 3.77.46 1.51.56 2.68 1.67 3.32 2.6-2.52 1.48-2.11 4.74.45 5.79-1.01 2.54-2.11 5.1-4.14 7.14M15.96 4.17c.66-.81 1.11-1.93.99-3.05-1.04.04-2.3.69-3.05 1.56-.65.76-1.22 1.9-1.07 3.01 1.17.09 2.32-.54 3.13-1.52z"
                  fill="#FFFFFF"
                />
              </Svg>
              <Text style={styles.appleBtnText}>Sign in with Apple</Text>
            </Pressable>
            <Pressable style={[styles.ssoBtn, styles.googleBtn]} onPress={handleGoogleSignIn}>
              <Svg width={15} height={15} viewBox="0 0 24 24" style={styles.ssoIcon}>
                <Path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <Path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <Path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <Path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </Svg>
              <Text style={styles.googleBtnText}>Sign in with Google</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(onboarding)/value');
          }} hitSlop={8}>
            <Text style={styles.altLink}>
              No account?{' '}
              <Text style={styles.altLinkBold}>Create one free</Text>
            </Text>
          </Pressable>
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
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    color: tokens.colors.text,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  inputErr: { borderColor: tokens.colors.pinkDeep },
  errText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: tokens.colors.pinkDeep,
  },
  bottom: { gap: 14 },
  cta: {
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 7,
  },
  ctaDim: { opacity: 0.6 },
  ctaText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  altLink: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: tokens.colors.gray,
    textAlign: 'center',
  },
  altLinkBold: {
    color: tokens.colors.pinkDeep,
    fontWeight: '600',
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
    flexDirection: 'row',
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ssoIcon: {
    marginRight: 2,
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
});
