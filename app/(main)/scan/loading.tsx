import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Alert } from 'react-native';
import { LoadingScreen } from '@/components/loading-screen';
import { analyzeImage, getCoaching } from '@/lib/api';
import { getOnboardingData } from '@/lib/onboarding-store';

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

  useEffect(() => {
    const run = async () => {
      const validUri = validateImageUri(params.uri);
      if (!validUri) {
        router.replace('/(main)/scan');
        return;
      }

      try {
        const { priorityCategory, skillLevel } = await getOnboardingData();
        const diagnosis = await analyzeImage({
          imageUri: validUri,
          priorityCategory: priorityCategory ?? 'Blending',
          skillLevel: skillLevel ?? 'Intermediate',
        });
        const coaching = await getCoaching({ diagnosis });

        router.replace({
          pathname: '/(main)/scan/results',
          params: {
            uri: validUri,
            diagnosis: JSON.stringify(diagnosis),
            coaching: JSON.stringify(coaching),
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
    <View style={{ flex: 1, backgroundColor: '#FBE8E3' }}>
      <LoadingScreen />
    </View>
  );
}
