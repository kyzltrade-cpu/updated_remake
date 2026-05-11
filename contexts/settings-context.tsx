import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { secureSet, secureGet, storage } from '@/lib/secureStorage';

const SETTINGS_KEY = '@remake_settings';
const PROFILE_PHOTO_KEY = '@remake_profile_photo'; // Sensitive - encrypted

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

        // Load sensitive profile photo separately (encrypted)
        const savedPhoto = await secureGet(PROFILE_PHOTO_KEY);
        if (savedPhoto) {
          setProfilePhotoState(savedPhoto);
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
    try {
      if (uri) {
        // Validate URI before storing (security)
        if (!uri.startsWith('file://') && !uri.startsWith('content://')) {
          console.error('[Security] Invalid profile photo URI');
          return;
        }
        await secureSet(PROFILE_PHOTO_KEY, uri);
      } else {
        await storage.removeItem(PROFILE_PHOTO_KEY);
      }
      setProfilePhotoState(uri);
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