import { createClient } from '@/lib/supabase'

const DEV_BYPASS = process.env.EXPO_PUBLIC_DEV_BYPASS === 'true'
const DEV_EMAIL = process.env.DEV_EMAIL || 'dev@remake.local'
const DEV_PASSWORD = process.env.DEV_PASSWORD || 'devpassword123'

export async function signUp(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { data, error }
}

export async function signIn(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signInWithOtp(email: string, options?: { data?: Record<string, unknown> }) {
  const supabase = createClient()
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
  const { data } = await supabase.auth.getSession()
  return data.session
}

// Dev bypass - creates/uses dev account without real auth
export async function signInDev() {
  if (!DEV_BYPASS) {
    throw new Error('Dev bypass disabled')
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