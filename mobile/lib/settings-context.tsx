/**
 * Settings context for app-wide settings including "items at home" list.
 * Uses AsyncStorage for persistence.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

const STORAGE_KEY = '@meal_planner_settings';

export type AppLanguage = 'en' | 'sv' | 'it';

export const LANGUAGES: { code: AppLanguage; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
];

interface Settings {
  itemsAtHome: string[]; // List of ingredients always at home (won't appear in grocery list)
  language: AppLanguage; // App language
}

interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  addItemAtHome: (item: string) => Promise<void>;
  removeItemAtHome: (item: string) => Promise<void>;
  isItemAtHome: (item: string) => boolean;
  setLanguage: (language: AppLanguage) => Promise<void>;
}

const defaultSettings: Settings = {
  itemsAtHome: [],
  language: 'en',
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings({ ...defaultSettings, ...parsed });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Save settings to AsyncStorage
  const saveSettings = useCallback(async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }, []);

  const addItemAtHome = useCallback(
    async (item: string) => {
      const normalizedItem = item.toLowerCase().trim();
      if (!normalizedItem) return;

      const newSettings = {
        ...settings,
        itemsAtHome: [
          ...new Set([...settings.itemsAtHome, normalizedItem]),
        ].sort(),
      };
      await saveSettings(newSettings);
    },
    [settings, saveSettings],
  );

  const removeItemAtHome = useCallback(
    async (item: string) => {
      const normalizedItem = item.toLowerCase().trim();
      const newSettings = {
        ...settings,
        itemsAtHome: settings.itemsAtHome.filter((i) => i !== normalizedItem),
      };
      await saveSettings(newSettings);
    },
    [settings, saveSettings],
  );

  const isItemAtHome = useCallback(
    (item: string) => {
      const normalizedItem = item.toLowerCase().trim();
      // Check if the item or any word in it matches items at home
      return settings.itemsAtHome.some(
        (homeItem) =>
          normalizedItem.includes(homeItem) ||
          homeItem.includes(normalizedItem),
      );
    },
    [settings.itemsAtHome],
  );

  const setLanguage = useCallback(
    async (language: AppLanguage) => {
      const newSettings = {
        ...settings,
        language,
      };
      await saveSettings(newSettings);
    },
    [settings, saveSettings],
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        addItemAtHome,
        removeItemAtHome,
        isItemAtHome,
        setLanguage,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
