import { Stack } from 'expo-router';
import { tokens } from '@/components/theme';

export default function MainLayout() {
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