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
  const isDevMode = process.env.EXPO_PUBLIC_DEV_BYPASS === 'true'

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithDevBypass = async () => {
    if (!isDevMode) return
    const { data, error } = await signInDev()
    if (error) throw error
    // Session will update via onAuthStateChange
  }

  return (
    <AuthContext.Provider value={{ session, user, isLoading, isDevMode, signInWithDevBypass }}>
      {children}
    </AuthContext.Provider>
  )
}