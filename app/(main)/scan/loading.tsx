import { useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Alert } from 'react-native';
import { LoadingScreen } from '@/components/loading-screen';
import { analyzeImage, getCoaching } from '@/lib/api';

function validateImageUri(uri: string | undefined): string | null {
  if (!uri) {
    Alert.alert('Error', 'No image provided');
    return null;
  }

  const allowedSchemes = ['file://', 'content://'];
  const isAllowed = allowedSchemes.some(scheme => uri.startsWith(scheme));

  if (!isAllowed) {
    if (__DEV__) console.error('[Security] Invalid image URI scheme rejected:', uri.substring(0, 50));
    Alert.alert('Error', 'Invalid image source');
    return null;
  }

  if (uri.includes('..') || uri.includes('%2e%2e')) {
    if (__DEV__) console.error('[Security] Path traversal attempt detected');
    Alert.alert('Error', 'Invalid image path');
    return null;
  }

  return uri;
}

export default function LoadingPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string }>();
  const analysisStarted = useRef(false);

  useEffect(() => {
    // Prevent double-fire in React 19 strict mode and on param identity changes
    if (analysisStarted.current) return;
    analysisStarted.current = true;

    let isMounted = true;

    const runAnalysis = async () => {
      const validUri = validateImageUri(params.uri);
      if (!validUri) {
        if (isMounted) router.replace('/(main)/scan');
        return;
      }

      try {
        const diagnosisResult = await analyzeImage({ imageUri: validUri });
        const coachingResult = await getCoaching({ diagnosis: diagnosisResult });

        if (!isMounted) return;

        router.replace({
          pathname: '/(main)/scan/results',
          params: {
            uri: validUri,
            diagnosis: JSON.stringify(diagnosisResult),
            coaching: JSON.stringify(coachingResult),
          },
        });
      } catch (error) {
        if (!isMounted) return;
        if (__DEV__) console.error('Analysis failed:', error);
        Alert.alert('Analysis failed', 'Please try again.', [
          { text: 'OK', onPress: () => router.replace('/(main)/scan') },
        ]);
      }
    };

    runAnalysis();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f0eb' }}>
      <LoadingScreen />
    </View>
  );
}
