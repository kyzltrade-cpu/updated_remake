import { router } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_KEY } from './_layout';

export default function Index() {
  useEffect(() => {
    const check = async () => {
      if (process.env.EXPO_PUBLIC_DEV_BYPASS === 'true') {
        await AsyncStorage.removeItem(ONBOARDING_KEY);
        router.replace('/(onboarding)');
        return;
      }
      const val = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (val === 'true') {
        router.replace('/(main)/home');
      } else {
        router.replace('/(onboarding)');
      }
    };
    check();
  }, []);

  return null;
}