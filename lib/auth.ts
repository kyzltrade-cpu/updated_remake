import { createClient } from '@/lib/supabase'
import {
  isValidEmail,
  isValidPassword,
  sanitizeEmail,
  sanitizeName,
  validationResult,
  type ValidationResult
} from '@/lib/validation'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import * as AppleAuthentication from 'expo-apple-authentication'

const DEV_BYPASS = process.env.EXPO_PUBLIC_DEV_BYPASS === 'true'

// DEV_EMAIL and DEV_PASSWORD must ONLY come from environment variables
const DEV_EMAIL = process.env.EXPO_PUBLIC_DEV_EMAIL
const DEV_PASSWORD = process.env.EXPO_PUBLIC_DEV_PASSWORD

/**
 * Validates sign up input
 */
function validateSignUpInput(email: string, password: string): ValidationResult {
  const cleanEmail = sanitizeEmail(email);

  if (!isValidEmail(cleanEmail)) {
    return validationResult(false, 'Please enter a valid email address');
  }

  if (!isValidPassword(password)) {
    return validationResult(false, 'Password must be at least 8 characters with letters and numbers');
  }

  return validationResult(true);
}

/**
 * Validates sign in input
 */
function validateSignInInput(email: string, password: string): ValidationResult {
  if (!email || !password) {
    return validationResult(false, 'Email and password are required');
  }

  const cleanEmail = sanitizeEmail(email);
  if (!isValidEmail(cleanEmail)) {
    return validationResult(false, 'Please enter a valid email address');
  }

  return validationResult(true);
}

/**
 * Validates OTP sign in
 */
function validateOtpInput(email: string): ValidationResult {
  const cleanEmail = sanitizeEmail(email);

  if (!isValidEmail(cleanEmail)) {
    return validationResult(false, 'Please enter a valid email address');
  }

  return validationResult(true);
}

export async function signUp(email: string, password: string) {
  const validation = validateSignUpInput(email, password);
  if (!validation.valid) {
    return { data: null, error: { message: validation.error!, code: 'VALIDATION_ERROR' } };
  }

  const supabase = createClient()
  const cleanEmail = sanitizeEmail(email);

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: password, // Don't sanitize password - preserve original
  });

  return { data, error };
}

export async function signIn(email: string, password: string) {
  const validation = validateSignInInput(email, password);
  if (!validation.valid) {
    return { data: null, error: { message: validation.error!, code: 'VALIDATION_ERROR' } };
  }

  const supabase = createClient()
  const cleanEmail = sanitizeEmail(email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: password,
  });

  return { data, error };
}

export async function signInWithOtp(email: string, options?: { data?: Record<string, unknown> }) {
  const validation = validateOtpInput(email);
  if (!validation.valid) {
    return { data: null, error: { message: validation.error!, code: 'VALIDATION_ERROR' } };
  }

  const supabase = createClient()
  const cleanEmail = sanitizeEmail(email);

  // Sanitize name immutably to avoid mutating the caller's object
  const sanitizedOptions = options?.data?.full_name && typeof options.data.full_name === 'string'
    ? { ...options, data: { ...options.data, full_name: sanitizeName(options.data.full_name) } }
    : options;

  const { data, error } = await supabase.auth.signInWithOtp({
    email: cleanEmail,
    options: sanitizedOptions,
  });

  return { data, error };
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession() {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  return data?.session ?? null
}

// Dev bypass - requires explicit environment variables
// DEV_BYPASS=true AND DEV_EMAIL + DEV_PASSWORD must all be set
export async function signInDev() {
  if (!DEV_BYPASS) {
    throw new Error('Dev bypass disabled');
  }

  if (!DEV_EMAIL || !DEV_PASSWORD) {
    console.error('[Security] DEV_BYPASS enabled but DEV_EMAIL/DEV_PASSWORD not set');
    throw new Error('Dev credentials not configured');
  }

  const supabase = createClient()

  // Try to sign in first
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: DEV_EMAIL,
    password: DEV_PASSWORD,
  });

  if (!error && signInData?.session) {
    return { data: signInData, error: null };
  }

  // If sign in fails, try to sign up (for first time)
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: DEV_EMAIL,
    password: DEV_PASSWORD,
  });

  if (signUpError) {
    // If signup also fails (e.g. email already exists), try sign in again
    return supabase.auth.signInWithPassword({
      email: DEV_EMAIL,
      password: DEV_PASSWORD,
    });
  }

  return { data: signUpData, error: signUpError };
}

// Configure Google Sign-In lazily or once
let googleConfigured = false;
function configureGoogle() {
  if (googleConfigured) return;

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  GoogleSignin.configure({
    webClientId,
    iosClientId,
    offlineAccess: false,
  });
  googleConfigured = true;
}

/**
 * Native Sign-In with Google
 */
export async function signInWithGoogle() {
  try {
    configureGoogle();

    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    
    // Support newer structure (v11+) and older structure
    const idToken = response.data?.idToken || (response as any).idToken;

    if (!idToken) {
      throw new Error('Google Sign-In: No ID token returned.');
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    return { data, error };
  } catch (err: any) {
    const msg = err.message || '';
    if (msg.includes('Sign in action cancelled') || err.code === '12501' || err.code === 'SIGN_IN_CANCELLED') {
      return { data: null, error: { message: 'Sign in was cancelled.', code: 'CANCELED' } };
    }
    console.error('[Auth] Google Sign-In error:', err);
    return { data: null, error: { message: err.message || 'Google Sign-In failed.', code: 'ERROR' } };
  }
}

/**
 * Native Sign-In with Apple
 */
export async function signInWithApple() {
  try {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      return { data: null, error: { message: 'Apple Sign-In is not available on this device.', code: 'UNAVAILABLE' } };
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Apple Sign-In: No identity token returned.');
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    return { data, error };
  } catch (err: any) {
    if (err.code === 'ERR_CANCELED') {
      return { data: null, error: { message: 'Sign in was cancelled.', code: 'CANCELED' } };
    }
    console.error('[Auth] Apple Sign-In error:', err);
    return { data: null, error: { message: err.message || 'Apple Sign-In failed.', code: 'ERROR' } };
  }
}

export { DEV_BYPASS }