import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const SETTINGS_KEY = '@remake_settings';

export interface AppSettings {
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  mirrorPhotos: boolean;
  referencePhoto: string | null;
}

const defaults: AppSettings = {
  hapticsEnabled: true,
  notificationsEnabled: true,
  mirrorPhotos: true,
  referencePhoto: null,
};

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  toggleSetting: (key: keyof AppSettings) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaults);

  // Load from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then(saved => {
      if (saved) {
        setSettings({ ...defaults, ...JSON.parse(saved) });
      }
    });
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleSetting = useCallback((key: keyof AppSettings) => {
    if (settings.hapticsEnabled) {
      Haptics.selectionAsync();
    }
    updateSettings({ [key]: !settings[key] });
  }, [settings, updateSettings]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, toggleSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}