import { router } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_KEY } from './_layout';

export default function Index() {
  useEffect(() => {
    const check = async () => {
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