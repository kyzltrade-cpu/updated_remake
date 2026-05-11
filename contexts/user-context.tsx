import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const USER_KEY = '@remake_user';
const ONBOARDING_KEY = '@remake_onboarding_complete';

export interface User {
  name: string;
  email: string;
  initials: string;
}

interface UserContextValue {
  user: User | null;
  isLoggedIn: boolean;
  login: (name: string, email: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(USER_KEY).then(saved => {
      if (saved) setUser(JSON.parse(saved));
    });
  }, []);

  const login = useCallback((name: string, email: string) => {
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const newUser: User = { name, email, initials };
    AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    if (typeof window !== 'undefined' && window.navigator?.platform !== undefined) {
      // Already on mobile
    }
    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'false');
    setUser(null);
    if (Haptics.ImpactFeedbackStyle) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace('/(onboarding)');
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoggedIn: !!user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}