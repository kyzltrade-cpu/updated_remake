import { Stack, Redirect } from 'expo-router';
import { tokens } from '@/components/theme';
import { useAuth } from '@/contexts/AuthContext';
import { View } from 'react-native';
import { LoadingScreen } from '@/components/loading-screen';
import { AppSplashScreen } from '@/components/splash-screen';

export default function MainLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.colors.beige }}>
        <AppSplashScreen />
      </View>
    );
  }

  const isDevMode = false;

  if (!user && !isDevMode) {
    return <Redirect href="/(onboarding)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tokens.colors.beige },
        animation: 'slide_from_right',
      }}
    />
  );
}
