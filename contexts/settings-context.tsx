import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { storage } from '@/lib/secureStorage';

const SETTINGS_KEY = 'remake_settings';
const PROFILE_PHOTO_KEY = 'remake_profile_photo'; // Sensitive - encrypted

export interface AppSettings {
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  mirrorPhotos: boolean;
  referencePhoto: string | null;
  // profilePhoto handled separately via secure storage
}

const defaults: AppSettings = {
  hapticsEnabled: true,
  notificationsEnabled: true,
  mirrorPhotos: true,
  referencePhoto: null,
};

interface SettingsContextValue {
  settings: AppSettings;
  profilePhoto: string | null;
  updateSettings: (updates: Partial<AppSettings>) => void;
  toggleSetting: (key: keyof AppSettings) => void;
  setProfilePhoto: (uri: string | null) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaults);
  const [profilePhoto, setProfilePhotoState] = useState<string | null>(null);

  // Load from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load regular settings
        const saved = await storage.getItem(SETTINGS_KEY);
        if (saved) {
          setSettings({ ...defaults, ...JSON.parse(saved) });
        }

        // Load sensitive settings (haptics, notifications, etc.) and profile photo from AsyncStorage
        const savedPhoto = await storage.getItem(PROFILE_PHOTO_KEY);
        if (savedPhoto) {
          setProfilePhotoState(savedPhoto);
          console.log('[Settings] Loaded profile photo from storage');
        }
      } catch (e) {
        console.error('[Settings] Failed to load:', e);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      // Persist non-sensitive settings
      storage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(console.error);
      return next;
    });
  }, []);

  const toggleSetting = useCallback((key: keyof AppSettings) => {
    if (settings.hapticsEnabled) {
      Haptics.selectionAsync();
    }
    updateSettings({ [key]: !settings[key] });
  }, [settings, updateSettings]);

  const setProfilePhoto = useCallback(async (uri: string | null) => {
    console.log('[Settings] setProfilePhoto called with:', uri ? `${uri.substring(0, 50)}...` : 'null');
    try {
      if (uri) {
        // Save to AsyncStorage - blob URIs are too long for SecureStore's 2048-byte limit
        // The URI is just a temp file path, not sensitive data
        await storage.setItem(PROFILE_PHOTO_KEY, uri);
        console.log('[Settings] Profile photo saved to storage');
      } else {
        await storage.removeItem(PROFILE_PHOTO_KEY);
        console.log('[Settings] Profile photo removed from storage');
      }
      setProfilePhotoState(uri);
      console.log('[Settings] State updated successfully');
    } catch (e) {
      console.error('[Settings] Failed to save profile photo:', e);
    }
  }, []);

  const clearAllData = useCallback(async () => {
    const keys = await storage.getAllKeys();
    const appKeys = keys.filter(k => k.startsWith('@remake'));
    await storage.multiRemove(appKeys);
    setSettings(defaults);
    setProfilePhotoState(null);
  }, []);

  return (
    <SettingsContext.Provider value={{
      settings,
      profilePhoto,
      updateSettings,
      toggleSetting,
      setProfilePhoto,
      clearAllData,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}