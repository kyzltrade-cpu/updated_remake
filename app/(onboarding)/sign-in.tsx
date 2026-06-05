import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, TextInput, Alert, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { signIn, signInDev, DEV_BYPASS } from '@/lib/auth';
import { isValidEmail, sanitizeEmail } from '@/lib/validation';
import { loadGloDraft, clearGloDraft } from '@/lib/glo-profile';
import { createClient } from '@/lib/supabase';
import { tokens } from '@/components/theme';

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

          <Pressable onPress={() => router.push('/(onboarding)/create-account')} hitSlop={8}>
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
});
