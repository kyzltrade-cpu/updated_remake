import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function OnboardingSplashFallback() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(onboarding)/value');
  }, []);

  return null;
}
