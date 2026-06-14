import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanLoadingScreen } from '@/components/scan-loading-screen';
import { analyzeImage, getCoaching } from '@/lib/api';
import { getOnboardingData } from '@/lib/onboarding-store';
import { saveScan, getLastScan } from '@/lib/api/scan-storage';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/settings-context';

function validateImageUri(uri: string | undefined): string | null {
  if (!uri) {
    Alert.alert('Error', 'No image provided');
    return null;
  }
  const allowed = ['file://', 'content://'];
  if (!allowed.some(s => uri.startsWith(s))) {
    Alert.alert('Error', 'Invalid image source');
    return null;
  }
  if (uri.includes('..') || uri.includes('%2e%2e')) {
    Alert.alert('Error', 'Invalid image path');
    return null;
  }
  return uri;
}

export default function LoadingPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string }>();
  const { user } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    const run = async () => {
      const validUri = validateImageUri(params.uri);
      if (!validUri) {
        router.replace('/(main)/scan');
        return;
      }

      try {
        const { priorityCategory, skillLevel } = await getOnboardingData();
        const referenceUri = settings.referencePhoto ?? undefined;
        const diagnosis = await analyzeImage({
          imageUri: validUri,
          priorityCategory: priorityCategory ?? 'Blending',
          skillLevel: skillLevel ?? 'Intermediate',
          referenceUri,
        });
        const coaching = await getCoaching({ diagnosis });

        let lastScore: number | undefined;
        if (user?.id) {
          try {
            const last = await getLastScan(user.id);
            if (last) lastScore = last.overall_score;
          } catch (e) {
            console.warn('[loading] failed to get last scan:', e);
          }
          saveScan({
            userId: user.id,
            imageUri: validUri,
            diagnosis,
            coaching,
          }).catch((err) => console.warn('[loading] saveScan failed:', err));
        }

        router.replace({
          pathname: '/(main)/scan/results',
          params: {
            uri: validUri,
            diagnosis: JSON.stringify(diagnosis),
            coaching: JSON.stringify(coaching),
            lastScore: lastScore !== undefined ? String(lastScore) : undefined,
          },
        });
      } catch {
        Alert.alert('Analysis failed', 'Please try again.', [
          { text: 'OK', onPress: () => router.replace('/(main)/scan') },
        ]);
      }
    };

    run();
  }, [params.uri]);

  return (
    <View style={{ flex: 1 }}>
      <ScanLoadingScreen imageUri={params.uri ?? ''} />
    </View>
  );
}
