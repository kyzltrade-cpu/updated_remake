import { NativeModules } from 'react-native';

const { EdgeFlashModule } = NativeModules;

/** Trigger the snapchat-style edge flash at the native window level. */
export function triggerEdgeFlash(): void {
  EdgeFlashModule?.triggerFlash?.();
}