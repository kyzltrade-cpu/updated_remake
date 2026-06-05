import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TextInput, Alert, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { signUp, signInDev, DEV_BYPASS } from '@/lib/auth';
import { isValidEmail, isValidPassword, sanitizeEmail } from '@/lib/validation';
import { loadGloDraft, clearGloDraft } from '@/lib/glo-profile';
import { tokens } from '@/components/theme';
import { createClient } from '@/lib/supabase';

const advance = (router: ReturnType<typeof useRouter>) => {
  router.replace('/(onboarding)/scan-prep');
};

export default function CreateAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailErr, setEmailErr] = useState('');
  const [passErr, setPassErr] = useState('');

  const handleDevAutoFill = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const rand = Math.floor(Math.random() * 1000000);
    setEmail(`test_${rand}@remake.beauty`);
    setPassword('TestPassword123!');
  };

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

        {__DEV__ && (
          <Animated.View entering={FadeInUp.delay(180).duration(500)} style={styles.devRow}>
            <Pressable onPress={handleDevAutoFill} style={styles.devBtn}>
              <Text style={styles.devBtnText}>⚡ Auto-Fill Dummy Account</Text>
            </Pressable>
          </Animated.View>
        )}

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
              <Svg width={14} height={17} viewBox="0 0 17 20" style={styles.ssoIcon}>
                <Path
                  d="M15.03 12.13c-.06-2.61 2.13-3.87 2.22-3.93-1.22-1.78-3.12-2.02-3.8-2.08-1.63-.17-3.19.96-4.02.96-.83 0-2.12-.94-3.5-.91-1.8.03-3.48 1.06-4.41 2.68-1.88 3.27-.48 8.12 1.34 10.74.89 1.28 1.93 2.72 3.31 2.66 1.33-.05 1.84-.86 3.45-.86 1.61 0 2.08.86 3.47.83 1.42-.03 2.33-1.29 3.21-2.58 1.02-1.49 1.44-2.93 1.46-3.01-.03-.01-2.81-1.08-2.83-4.29zM12.63 3.51c.73-.89 1.22-2.12 1.09-3.35-1.05.04-2.32.7-3.07 1.58-.65.75-1.22 2-1.07 3.2 1.17.09 2.32-.54 3.05-1.43z"
                  fill="#FFFFFF"
                />
              </Svg>
              <Text style={styles.appleBtnText}>Sign in with Apple</Text>
            </Pressable>
            <Pressable style={[styles.ssoBtn, styles.googleBtn]} onPress={handleDevOrCreate}>
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
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View entering={FadeInUp.delay(320).duration(500)} style={styles.footer}>
          <Pressable onPress={() => router.push('/(onboarding)/sign-in')} hitSlop={12}>
            <Text style={styles.signInLink}>
              Already have an account? <Text style={styles.signInLinkBold}>Sign In</Text>
            </Text>
          </Pressable>
          <Text style={styles.legal}>
            By continuing you agree to our{' '}
            <Text style={styles.legalLink} onPress={() => router.push('/(onboarding)/legal')}>
              Terms & Privacy Policy
            </Text>
            .
          </Text>
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
  devRow: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  devBtn: {
    backgroundColor: 'rgba(217,138,150,0.12)', // light soft pink
    borderColor: tokens.colors.pinkRich,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  devBtnText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    color: tokens.colors.pinkRich,
    fontWeight: '700',
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
  legalLink: {
    color: tokens.colors.pinkDeep,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
