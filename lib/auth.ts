import { createClient } from '@/lib/supabase'
import {
  isValidEmail,
  isValidPassword,
  sanitizeEmail,
  sanitizeName,
  validationResult,
  type ValidationResult
} from '@/lib/validation'

const DEV_BYPASS = process.env.EXPO_PUBLIC_DEV_BYPASS === 'true'

// DEV_EMAIL and DEV_PASSWORD must ONLY come from environment variables
const DEV_EMAIL = process.env.DEV_EMAIL
const DEV_PASSWORD = process.env.DEV_PASSWORD

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

  // Sanitize name if provided
  if (options?.data?.full_name && typeof options.data.full_name === 'string') {
    options.data.full_name = sanitizeName(options.data.full_name);
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email: cleanEmail,
    options,
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

export { DEV_BYPASS }