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
  favoriteRecipes: string[]; // List of favorite recipe IDs
}

interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  addItemAtHome: (item: string) => Promise<void>;
  removeItemAtHome: (item: string) => Promise<void>;
  isItemAtHome: (item: string) => boolean;
  setLanguage: (language: AppLanguage) => Promise<void>;
  toggleFavorite: (recipeId: string) => Promise<void>;
  isFavorite: (recipeId: string) => boolean;
}

const defaultSettings: Settings = {
  itemsAtHome: [],
  language: 'en',
  favoriteRecipes: [],
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

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

  const toggleFavorite = useCallback(
    async (recipeId: string) => {
      const isFav = settings.favoriteRecipes.includes(recipeId);
      const newSettings = {
        ...settings,
        favoriteRecipes: isFav
          ? settings.favoriteRecipes.filter((id) => id !== recipeId)
          : [...settings.favoriteRecipes, recipeId],
      };
      await saveSettings(newSettings);
    },
    [settings, saveSettings],
  );

  const isFavorite = useCallback(
    (recipeId: string) => settings.favoriteRecipes.includes(recipeId),
    [settings.favoriteRecipes],
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
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
