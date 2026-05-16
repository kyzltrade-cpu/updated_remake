import { router } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEV_BYPASS } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { ONBOARDING_KEY } from './_layout';

export default function Index() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const check = async () => {
      if (DEV_BYPASS && user) {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        router.replace('/(main)/home');
        return;
      }

      const val = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (val === 'true' && user) {
        router.replace('/(main)/home');
      } else {
        router.replace('/(onboarding)');
      }
    };
    check();
  }, [isLoading, user]);

  return null;
}