import 'react-native-reanimated';
import { useEffect, useState, ReactNode } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { tokens } from '@/components/theme';
import { useBrandFonts } from '@/hooks/use-brand-fonts';
import { AuthProvider } from '@/contexts/AuthContext';
import { SettingsProvider } from '@/contexts/settings-context';
import { UserProvider } from '@/contexts/user-context';
import { SubscriptionProvider } from '@/contexts/subscription-context';
import { View } from 'react-native';
import { LoadingScreen } from '@/components/loading-screen';
import { AppSplashScreen } from '@/components/splash-screen';

// Prevent the native splash screen from automatically hiding before assets are loaded.
SplashScreen.preventAutoHideAsync().catch(() => {});

const ONBOARDING_KEY = '@remake_onboarding_complete';

function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <UserProvider>
          <SubscriptionProvider>{children}</SubscriptionProvider>
        </UserProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  const fontsLoaded = useBrandFonts();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [splashAnimationDone, setSplashAnimationDone] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      setOnboardingComplete(val === 'true');
    });
  }, []);

  // Hide native splash screen once our custom fonts have loaded.
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: tokens.colors.beige }} />;
  }

  if (onboardingComplete === null || !splashAnimationDone) {
    return <AppSplashScreen onAnimationComplete={() => setSplashAnimationDone(true)} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <Providers>
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
    </Providers>
    </GestureHandlerRootView>
  );
}

export { ONBOARDING_KEY };