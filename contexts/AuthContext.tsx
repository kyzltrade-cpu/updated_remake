import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { signInDev } from '@/lib/auth'
import type { Session, User } from '@supabase/supabase-js'

interface AuthContextType {
  session: Session | null
  user: User | null
  isLoading: boolean
  isDevMode: boolean
  signInWithDevBypass: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isDevMode: false,
  signInWithDevBypass: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isDevMode = false

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    const checkSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        if (mounted) {
          setSession(initialSession)
          setUser(initialSession?.user ?? null)
        }
      } catch (e) {
        console.warn('[AuthContext] Failed to get initial session:', e)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signInWithDevBypass = async () => {
    if (!isDevMode) return
    const { error } = await signInDev()
    if (error) throw error
    // Session updates via onAuthStateChange
  }

  return (
    <AuthContext.Provider value={{ session, user, isLoading, isDevMode, signInWithDevBypass }}>
      {children}
    </AuthContext.Provider>
  )
}
