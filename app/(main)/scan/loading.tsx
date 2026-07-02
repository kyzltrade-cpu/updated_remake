import { useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Alert, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@/lib/supabase';
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

  const isScanning = useRef(false);
  const wasBackgrounded = useRef(false);
  const startTime = useRef(new Date().toISOString());
  const retryCount = useRef(0);

  // Function to check if the server has already successfully processed and written this scan
  const checkServerStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const last = await getLastScan(user.id);
      if (last && new Date(last.created_at).getTime() > new Date(startTime.current).getTime()) {
        console.log('[loading] background success detected: scan exists on server with ID:', last.id);
        isScanning.current = false;
        router.replace({
          pathname: '/(main)/scan/results',
          params: {
            uri: params.uri,
            scanId: last.id,
          },
        });
        return true;
      }
    } catch (e) {
      console.warn('[loading] failed to check server status:', e);
    }
    return false;
  };

  const run = async () => {
    const validUri = validateImageUri(params.uri);
    if (!validUri) {
      router.replace('/(main)/scan');
      return;
    }

    if (isScanning.current) return;
    isScanning.current = true;

    try {
      const { priorityCategory, skillLevel } = await getOnboardingData();
      const referenceUri = settings.referencePhoto ?? undefined;

      // 1. Check if the user already has a saved Beauty DNA profile
      let hasExistingDna = false;
      if (user?.id) {
        try {
          const supabase = createClient() as any;
          const { data, error } = await supabase
            .from('profiles')
            .select('dna_result')
            .eq('id', user.id)
            .maybeSingle();
          if (!error && data?.dna_result) {
            hasExistingDna = true;
          }
        } catch (e) {
          console.warn('[loading] failed to check existing DNA:', e);
        }
      }

      // 2. Perform analysis (skipping DNA evaluation if it is already generated & frozen)
      let diagnosis: any;
      let dna: any = null;

      if (hasExistingDna) {
        console.log('[loading] Existing Beauty DNA found. Skipping DNA analysis and freezing results.');
        diagnosis = await analyzeImage({
          imageUri: validUri,
          priorityCategory: priorityCategory ?? 'Blending',
          skillLevel: skillLevel ?? 'Intermediate',
          referenceUri,
        });
      } else {
        console.log('[loading] No existing Beauty DNA found. Executing 100% personalized dynamic first-scan evaluation.');
        const [diagResult, dnaResult] = await Promise.all([
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
        diagnosis = diagResult;
        dna = dnaResult;
      }

      const coaching = await getCoaching({ diagnosis });

      let lastScore: number | undefined;
      if (user?.id) {
        try {
          const last = await getLastScan(user.id);
          if (last) lastScore = last.overall_score;
        } catch (e) {
          console.warn('[loading] failed to get last scan:', e);
        }

        // 3. Save the scan record and update their permanent Profile DNA if it was just calculated
        const savePromises: Promise<any>[] = [
          saveScan({
            userId: user.id,
            imageUri: validUri,
            diagnosis,
            coaching,
          })
        ];

        if (dna) {
          savePromises.push(saveDnaResult(user.id, dna));
          savePromises.push(AsyncStorage.setItem('dna_result', JSON.stringify(dna)));
        }

        await Promise.all(savePromises).catch((err) =>
          console.warn('[loading] parallel DB/Cache saves failed:', err)
        );
      }

      isScanning.current = false;
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

      // Check if the failure happened due to backgrounding, and if the server has already succeeded
      if (wasBackgrounded.current) {
        const alreadyDone = await checkServerStatus();
        if (alreadyDone) return;
      }

      // Handle automatic silent retry if we were backgrounded during execution
      if (wasBackgrounded.current && retryCount.current < 1) {
        retryCount.current += 1;
        wasBackgrounded.current = false;
        isScanning.current = false;
        console.log('[loading] Scan failed after backgrounding. Initiating silent auto-retry (Attempt 1)...');
        // Add a brief delay before retrying
        setTimeout(() => {
          run();
        }, 300);
        return;
      }

      isScanning.current = false;
      router.replace('/(main)/scan/error');
    }
  };

  useEffect(() => {
    // Start scan on mount
    run();

    // AppState Listener to handle user switching out/in smoothly
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && isScanning.current) {
        console.log('[loading] user backgrounded during active scan');
        wasBackgrounded.current = true;
      } else if (nextAppState === 'active' && isScanning.current) {
        console.log('[loading] user returned to foreground, checking if scan processed on server');
        // Give the network/server a brief moment to settle
        setTimeout(async () => {
          await checkServerStatus();
        }, 500);
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
    };
  }, [params.uri]);

  return (
    <View style={{ flex: 1 }}>
      <ScanLoadingScreen imageUri={params.uri ?? ''} />
    </View>
  );
}
