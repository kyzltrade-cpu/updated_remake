import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const PROFILE_PHOTO_KEY = 'remake_profile_photo';

// Helper to determine if a key is sensitive and must be encrypted via iOS Keychain / Android Keystore
function isSensitiveKey(key: string): boolean {
  return (
    key === PROFILE_PHOTO_KEY ||
    key.startsWith('secure_') ||
    key.includes('token') ||
    key.includes('password')
  );
}

/**
 * Secure set - transparently routes sensitive keys to hardware-encrypted SecureStore,
 * and regular keys to AsyncStorage.
 */
export async function secureSet(key: string, value: string): Promise<void> {
  try {
    if (isSensitiveKey(key)) {
      await SecureStore.setItemAsync(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  } catch (e) {
    console.error('[secureStorage] secureSet failed for key:', key, e);
    throw e;
  }
}

/**
 * Secure get - transparently retrieves sensitive keys from SecureStore,
 * and regular keys from AsyncStorage.
 */
export async function secureGet(key: string): Promise<string | null> {
  try {
    if (isSensitiveKey(key)) {
      return await SecureStore.getItemAsync(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  } catch (e) {
    console.error('[secureStorage] secureGet failed for key:', key, e);
    return null;
  }
}

/**
 * Clear all stored data (for logout)
 */
export async function clearSecureStorage(): Promise<void> {
  try {
    // 1. Clear all AsyncStorage keys starting with '@remake' or 'remake_'
    const keys = await AsyncStorage.getAllKeys();
    const appKeys = keys.filter((k: string) => k.startsWith('@remake') || k.startsWith('remake_'));
    await AsyncStorage.multiRemove(appKeys);

    // 2. Clear sensitive hardware-backed SecureStore keys
    await SecureStore.deleteItemAsync(PROFILE_PHOTO_KEY);
  } catch (e) {
    console.error('[secureStorage] clearSecureStorage failed:', e);
  }
}

// Export a unified, transparent storage engine
export const storage = {
  getItem: secureGet,
  setItem: secureSet,
  removeItem: async (key: string): Promise<void> => {
    try {
      if (isSensitiveKey(key)) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (e) {
      console.error('[secureStorage] removeItem failed for key:', key, e);
    }
  },
  multiGet: AsyncStorage.multiGet.bind(AsyncStorage),
  multiSet: AsyncStorage.multiSet.bind(AsyncStorage),
  multiRemove: AsyncStorage.multiRemove.bind(AsyncStorage),
  getAllKeys: AsyncStorage.getAllKeys.bind(AsyncStorage),
};
