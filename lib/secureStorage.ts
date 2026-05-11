/**
 * Secure storage utilities
 *
 * Wraps AsyncStorage with obfuscation for sensitive data.
 * AsyncStorage stores data in plaintext - this adds a layer of obfuscation.
 *
 * NOTE: For production with highly sensitive data, consider using:
 * - expo-secure-store (encrypted storage)
 * - react-native-keychain (for credentials)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Simple XOR obfuscation key - NOT cryptographically secure
// This is obfuscation, not encryption. For production, use expo-secure-store
const OBFUSCATION_KEY = 'remake_app_key_2024_v1';

function xorEncrypt(data: string): string {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length));
  }
  return result;
}

/**
 * Secure set - encodes data before storing
 */
export async function secureSet(key: string, value: string): Promise<void> {
  try {
    const obfuscated = xorEncrypt(value);
    console.log('[secureStorage] secureSet:', key, 'value length:', value.length, 'obfuscated length:', obfuscated.length);
    const result = await SecureStore.setItemAsync(key, obfuscated);
    console.log('[secureStorage] setItemAsync completed, result:', result);
  } catch (e) {
    console.error('[secureStorage] setItemAsync FAILED:', e);
    throw e;
  }
}

/**
 * Secure get - decodes data after retrieving
 */
export async function secureGet(key: string): Promise<string | null> {
  try {
    const obfuscated = await SecureStore.getItemAsync(key);
    console.log('[secureStorage] getItemAsync:', key, 'result:', obfuscated ? `${obfuscated.substring(0, 30)}...` : 'null');
    if (!obfuscated) return null;
    const result = xorEncrypt(obfuscated);
    console.log('[secureStorage] decoded:', result ? `${result.substring(0, 30)}...` : 'null');
    return result;
  } catch (e) {
    console.error('[secureStorage] Failed to get:', key, e);
    return null;
  }
}

/**
 * Clear all stored data (for logout)
 */
export async function clearSecureStorage(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const appKeys = keys.filter((k: string) => k.startsWith('@remake'));
  await AsyncStorage.multiRemove(appKeys);
}

// Export raw AsyncStorage for non-sensitive data
export const storage = {
  getItem: AsyncStorage.getItem.bind(AsyncStorage),
  setItem: AsyncStorage.setItem.bind(AsyncStorage),
  removeItem: AsyncStorage.removeItem.bind(AsyncStorage),
  multiGet: AsyncStorage.multiGet.bind(AsyncStorage),
  multiSet: AsyncStorage.multiSet.bind(AsyncStorage),
  multiRemove: AsyncStorage.multiRemove.bind(AsyncStorage),
  getAllKeys: AsyncStorage.getAllKeys.bind(AsyncStorage),
};