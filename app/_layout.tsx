import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokens } from '@/components/theme';
import { useBrandFonts } from '@/hooks/use-brand-fonts';
import { View, Text, ActivityIndicator } from 'react-native';

const ONBOARDING_KEY = '@remake_onboarding_complete';

export default function RootLayout() {
  const fontsLoaded = useBrandFonts();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setOnboardingComplete(val === 'true');
    });
  }, []);

  if (!fontsLoaded || onboardingComplete === null) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.colors.beige, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={tokens.colors.gold} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: tokens.colors.beige },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="(onboarding)" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(main)" options={{ animation: 'fade' }} />
      </Stack>
    </>
  );
}

export { ONBOARDING_KEY };