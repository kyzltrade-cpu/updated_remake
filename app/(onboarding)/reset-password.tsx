import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, TextInput, Alert, Pressable,
  KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { updatePassword } from '@/lib/auth';
import { createClient } from '@/lib/supabase';
import { isValidPassword } from '@/lib/validation';
import { tokens } from '@/components/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const url = Linking.useURL();
  
  const [password, setPassword] = useState('');
  const [passErr, setPassErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionSet, setSessionSet] = useState(false);
  const [success, setSuccess] = useState(false);

  // Helper to parse deep link and establish Supabase session
  const parseAndSetSession = async (fullUrl: string) => {
    try {
      console.log('[ResetPassword] Processing deep link:', fullUrl);
      
      let tokenString = '';
      if (fullUrl.includes('#')) {
        tokenString = fullUrl.split('#')[1];
      } else if (fullUrl.includes('?')) {
        tokenString = fullUrl.split('?')[1];
      }
      
      if (!tokenString) {
        setSessionLoading(false);
        return;
      }
      
      // Convert query/hash string into searchable params
      const pairs = tokenString.split('&');
      let accessToken = '';
      let refreshToken = '';
      
      pairs.forEach(pair => {
        const [key, val] = pair.split('=');
        if (key === 'access_token') accessToken = decodeURIComponent(val);
        if (key === 'refresh_token') refreshToken = decodeURIComponent(val);
      });
      
      if (accessToken && refreshToken) {
        console.log('[ResetPassword] Tokens found! Authenticating session...');
        setSessionLoading(true);
        
        const supabase = createClient();
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (error) {
          console.error('[ResetPassword] Supabase setSession failed:', error.message);
          Alert.alert(
            'Link Expired', 
            'This password reset link is invalid or has expired. Please request a new link.',
            [{ text: 'OK', onPress: () => router.replace('/sign-in') }]
          );
        } else {
          console.log('[ResetPassword] Session established successfully.');
          setSessionSet(true);
        }
      } else {
        console.warn('[ResetPassword] Access token or refresh token missing from deep link.');
      }
    } catch (e) {
      console.error('[ResetPassword] Unexpected error during deep link handling:', e);
    } finally {
      setSessionLoading(false);
    }
  };

  // Process initial deep link on mount, and any changes
  useEffect(() => {
    if (url) {
      parseAndSetSession(url);
    } else {
      // If opened directly without a deep link token, let's timeout the loading indicator
      const timer = setTimeout(() => {
        setSessionLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [url]);

  const handleUpdatePassword = async () => {
    if (!isValidPassword(password)) {
      setPassErr('Min. 8 chars with a letter and number');
      return;
    } else {
      setPassErr('');
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        Alert.alert('Update Failed', error.message);
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
      {/* Header back to sign in if link is invalid or directly opened */}
      <Pressable onPress={() => router.replace('/sign-in')} style={styles.backBtn} hitSlop={12}>
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <View style={{ flex: 1 }}>
          {sessionLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color={tokens.colors.pinkDeep} style={{ marginBottom: 16 }} />
              <Text style={styles.loadingText}>Verifying secure link...</Text>
            </View>
          ) : !sessionSet ? (
            <View style={styles.center}>
              <Text style={styles.errorTitle}>Invalid Link</Text>
              <Text style={styles.errorTextDesc}>
                This password reset link is invalid, incomplete, or opened outside of its secure email envelope. Please request a new link from the forgot password page.
              </Text>
              <Pressable
                onPress={() => router.replace('/forgot-password')}
                style={[styles.cta, { width: '100%', marginTop: 24 }]}
              >
                <Text style={styles.ctaText}>Request New Link</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <Animated.Text entering={FadeInUp.delay(80).duration(500)} style={styles.title}>
                {success ? "Success!" : "New password."}
              </Animated.Text>
              <Animated.Text entering={FadeInUp.delay(140).duration(500)} style={styles.sub}>
                {success 
                  ? "Your password has been successfully updated. Let's get you back in."
                  : "Type your new password below to update and secure your REMAKE account."
                }
              </Animated.Text>

              {!success && (
                <Animated.View entering={FadeInUp.delay(220).duration(500)} style={styles.form}>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>New Password</Text>
                    <TextInput
                      style={[styles.input, passErr ? styles.inputErr : null]}
                      placeholder="Minimum 8 characters"
                      placeholderTextColor="rgba(61,53,50,0.28)"
                      value={password}
                      onChangeText={t => { setPassword(t); setPassErr(''); }}
                      secureTextEntry
                      autoCapitalize="none"
                      autoFocus
                    />
                    {passErr ? <Text style={styles.errText}>{passErr}</Text> : null}
                  </View>
                </Animated.View>
              )}

              <View style={{ flex: 1 }} />

              <Animated.View entering={FadeInUp.delay(300).duration(500)} style={{ marginBottom: 16 }}>
                {success ? (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.replace('/home');
                    }}
                    style={styles.cta}
                  >
                    <Text style={styles.ctaText}>Enter App</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={handleUpdatePassword}
                    disabled={loading}
                    style={[styles.cta, loading && styles.ctaDim]}
                  >
                    <Text style={styles.ctaText}>{loading ? 'Updating…' : 'Update Password'}</Text>
                  </Pressable>
                )}
              </Animated.View>
            </View>
          )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    color: tokens.colors.gray,
  },
  errorTitle: {
    fontFamily: tokens.fonts.serif,
    fontSize: 28,
    color: tokens.colors.text,
    marginBottom: 12,
  },
  errorTextDesc: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: tokens.colors.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
});
