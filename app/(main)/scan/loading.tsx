import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Alert } from 'react-native';
import { LoadingScreen } from '@/components/loading-screen';
import { analyzeImage, getCoaching } from '@/lib/api';
import type { DiagnosisResult, CoachingResult } from '@/lib/api/types';

/**
 * Validates that the URI comes from the local ImagePicker (file:// protocol).
 * Prevents SSRF attacks where an attacker could pass a malicious external URL.
 */
function validateImageUri(uri: string | undefined): string | null {
  if (!uri) {
    Alert.alert('Error', 'No image provided');
    return null;
  }

  // Only allow file:// URIs from ImagePicker
  const allowedSchemes = ['file://', 'content://'];
  const isAllowed = allowedSchemes.some(scheme => uri.startsWith(scheme));

  if (!isAllowed) {
    console.error('[Security] Invalid image URI scheme rejected:', uri.substring(0, 50));
    Alert.alert('Error', 'Invalid image source');
    return null;
  }

  // Basic path traversal check
  if (uri.includes('..') || uri.includes('%2e%2e')) {
    console.error('[Security] Path traversal attempt detected');
    Alert.alert('Error', 'Invalid image path');
    return null;
  }

  return uri;
}

export default function LoadingPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string }>();

  useEffect(() => {
    const runAnalysis = async () => {
      const validUri = validateImageUri(params.uri);
      if (!validUri) {
        router.replace('/(main)/scan');
        return;
      }

      try {
        const diagnosisResult = await analyzeImage({ imageUri: validUri });
        const coachingResult = await getCoaching({ diagnosis: diagnosisResult });

        router.replace({
          pathname: '/(main)/scan/results',
          params: {
            uri: validUri,
            diagnosis: JSON.stringify(diagnosisResult),
            coaching: JSON.stringify(coachingResult),
          },
        });
      } catch (error) {
        console.error('Analysis failed:', error);
        Alert.alert('Analysis failed', 'Please try again.', [
          { text: 'OK', onPress: () => router.replace('/(main)/scan') },
        ]);
      }
    };

    runAnalysis();
  }, [params.uri]);

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f0eb' }}>
      <LoadingScreen />
    </View>
  );
}