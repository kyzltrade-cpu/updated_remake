import { createClient } from '@/lib/supabase'

const DEV_BYPASS = process.env.EXPO_PUBLIC_DEV_BYPASS === 'true'

// DEV_EMAIL and DEV_PASSWORD must ONLY come from environment variables
// There are NO fallback defaults - dev bypass requires explicit credentials
const DEV_EMAIL = process.env.DEV_EMAIL
const DEV_PASSWORD = process.env.DEV_PASSWORD

export async function signUp(email: string, password: string) {
  const supabase = createClient()

  // Validate input
  if (!email || !email.includes('@')) {
    return { data: null, error: { message: 'Invalid email address', code: 'INVALID_EMAIL' } }
  }

  if (!password || password.length < 8) {
    return { data: null, error: { message: 'Password must be at least 8 characters', code: 'WEAK_PASSWORD' } }
  }

  const { data, error } = await supabase.auth.signUp({ email, password })
  return { data, error }
}

export async function signIn(email: string, password: string) {
  const supabase = createClient()

  // Validate input
  if (!email || !password) {
    return { data: null, error: { message: 'Email and password required', code: 'MISSING_CREDENTIALS' } }
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signInWithOtp(email: string, options?: { data?: Record<string, unknown> }) {
  const supabase = createClient()

  // Validate email
  if (!email || !email.includes('@')) {
    return { data: null, error: { message: 'Invalid email address', code: 'INVALID_EMAIL' } }
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options,
  })
  return { data, error }
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession() {
  const supabase = createClient()
  const data = await supabase.auth.getSession()
  return data.session
}

// Dev bypass - requires explicit environment variables
// DEV_BYPASS=true AND DEV_EMAIL + DEV_PASSWORD must all be set
export async function signInDev() {
  if (!DEV_BYPASS) {
    throw new Error('Dev bypass disabled')
  }

  if (!DEV_EMAIL || !DEV_PASSWORD) {
    console.error('[Security] DEV_BYPASS enabled but DEV_EMAIL/DEV_PASSWORD not set')
    throw new Error('Dev credentials not configured')
  }

  const supabase = createClient()

  // Try to sign in first
  const { data, error } = await supabase.auth.signInWithPassword({
    email: DEV_EMAIL,
    password: DEV_PASSWORD,
  })

  if (!error && data.session) {
    return { data, error: null }
  }

  // If sign in fails, try to sign up (for first time)
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: DEV_EMAIL,
    password: DEV_PASSWORD,
  })

  if (signUpError) {
    // If signup also fails (e.g. email already exists), try sign in again
    return supabase.auth.signInWithPassword({
      email: DEV_EMAIL,
      password: DEV_PASSWORD,
    })
  }

  return { data: signUpData, error: signUpError }
}

export { DEV_BYPASS }