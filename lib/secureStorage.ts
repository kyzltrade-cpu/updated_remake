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
  const obfuscated = xorEncrypt(value);
  // Convert to base64 for safe character storage
  const encoded = btoa(unescape(encodeURIComponent(obfuscated)));
  return AsyncStorage.setItem(key, encoded);
}

/**
 * Secure get - decodes data after retrieving
 */
export async function secureGet(key: string): Promise<string | null> {
  const encoded = await AsyncStorage.getItem(key);
  if (!encoded) return null;

  try {
    const obfuscated = decodeURIComponent(escape(atob(encoded)));
    return xorEncrypt(obfuscated);
  } catch (e) {
    console.error('[SecureStorage] Failed to decode:', key);
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