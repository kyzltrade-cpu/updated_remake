import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from './AuthContext';
import { createClient } from '@/lib/supabase';

export interface UserProfile {
  name: string;
  email: string;
  initials: string;
}

interface UserContextValue {
  user: UserProfile | null;
  isLoggedIn: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!authUser) {
      setUser(null);
      return;
    }
    const name = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';
    const email = authUser.email || '';
    const initials = name.trim().split(/\s+/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    setUser({ name, email, initials });
  }, [authUser]);

  const logout = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      await AsyncStorage.multiRemove([
        '@remake_onboarding_complete',
        'remake_settings',
        'remake_profile_photo',
      ]);
      router.replace('/(onboarding)');
    } catch {
      Alert.alert('Error', 'Sign out failed. Please try again.');
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoggedIn: !!authUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}