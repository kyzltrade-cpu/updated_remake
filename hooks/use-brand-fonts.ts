import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display';

export function useBrandFonts() {
  const [loaded] = useFonts({
    Inter: Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    'Playfair Display': PlayfairDisplay_400Regular,
  });
  return loaded;
}