import { router } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_KEY } from './_layout';
import { createClient } from '@/lib/supabase';

export default function Index() {
  useEffect(() => {
    const check = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Heal the onboarding complete flag if they are active on Supabase
          await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
          router.replace('/home');
          return;
        }
      } catch (e) {
        console.warn('[Index Router] Failed to check active session:', e);
      }

      const val = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (val === 'true') {
        router.replace('/home');
      } else {
        router.replace('/value');
      }
    };
    check();
  }, []);

  return null;
}
