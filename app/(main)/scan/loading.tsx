import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanLoadingScreen } from '@/components/scan-loading-screen';
import { analyzeImage, getCoaching } from '@/lib/api';
import { analyzeDna } from '@/lib/api/dna';
import { getOnboardingData } from '@/lib/onboarding-store';
import { saveScan, getLastScan, saveDnaResult } from '@/lib/api/scan-storage';
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

        // Perform both makeup analysis and beauty DNA evaluation in parallel!
        const [diagnosis, dna] = await Promise.all([
          analyzeImage({
            imageUri: validUri,
            priorityCategory: priorityCategory ?? 'Blending',
            skillLevel: skillLevel ?? 'Intermediate',
            referenceUri,
          }),
          analyzeDna({
            imageUri: validUri,
            priorityCategory: priorityCategory ?? 'Blending',
          })
        ]);

        const coaching = await getCoaching({ diagnosis });

        let lastScore: number | undefined;
        if (user?.id) {
          try {
            const last = await getLastScan(user.id);
            if (last) lastScore = last.overall_score;
          } catch (e) {
            console.warn('[loading] failed to get last scan:', e);
          }

          // Save the scan record and update their Profile DNA results in parallel
          await Promise.all([
            saveScan({
              userId: user.id,
              imageUri: validUri,
              diagnosis,
              coaching,
            }),
            saveDnaResult(user.id, dna)
          ]).catch((err) => console.warn('[loading] parallel DB saves failed:', err));
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
      } catch (err) {
        console.error('[loading] scan analysis failed:', err);
        router.replace('/(main)/scan/error');
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
