import { requireNativeModule } from 'expo-modules-core';

let ReMakeFaceDetector: any;
try {
  ReMakeFaceDetector = requireNativeModule('ReMakeFaceDetector');
} catch {
  ReMakeFaceDetector = null;
}

export async function detectFace(imagePath: string): Promise<boolean> {
  if (!ReMakeFaceDetector) {
    console.warn('[ReMakeFaceDetector] Native module not bound (running in Expo Go or Simulated web environment)');
    return true; // Graceful bypass in development mock mode
  }
  try {
    return await ReMakeFaceDetector.detectFace(imagePath);
  } catch (e) {
    console.error('[ReMakeFaceDetector] Local Swift check failed:', e);
    return true; // Fail-safe to avoid blocking users on error
  }
}
