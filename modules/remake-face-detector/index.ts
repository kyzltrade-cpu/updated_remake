import { requireNativeModule } from 'expo-modules-core';

let ReMakeFaceDetector: any;
try {
  ReMakeFaceDetector = requireNativeModule('ReMakeFaceDetector');
} catch {
  ReMakeFaceDetector = null;
}

export interface FaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function detectFace(imagePath: string): Promise<boolean> {
  const bounds = await detectFaceBounds(imagePath);
  return bounds !== null;
}

export async function detectFaceBounds(imagePath: string): Promise<FaceBounds | null> {
  if (!ReMakeFaceDetector) {
    console.warn('[ReMakeFaceDetector] Native module not bound (running in Expo Go or Simulated web environment)');
    return null; // Graceful bypass in development mock mode
  }
  try {
    return await ReMakeFaceDetector.detectFaceBounds(imagePath);
  } catch (e) {
    console.error('[ReMakeFaceDetector] Local Swift check failed:', e);
    return null; // Fail-safe to avoid blocking users on error
  }
}
