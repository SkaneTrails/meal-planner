/**
 * Settings context for app-wide settings.
 *
 * - itemsAtHome: Synced with cloud (per-household via API)
 * - language, favoriteRecipes, showHiddenRecipes: Local storage (per-device via AsyncStorage)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  useAddItemAtHome,
  useCurrentUser,
  useItemsAtHome,
  useRemoveItemAtHome,
} from './hooks/use-admin';

const STORAGE_KEY = '@meal_planner_settings';

export type AppLanguage = 'en' | 'sv' | 'it';

export const LANGUAGES: { code: AppLanguage; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
];

interface LocalSettings {
  language: AppLanguage;
  favoriteRecipes: string[];
  showHiddenRecipes: boolean;
}

interface Settings extends LocalSettings {
  itemsAtHome: string[]; // Synced from cloud
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
  toggleShowHiddenRecipes: () => Promise<void>;
}

const defaultLocalSettings: LocalSettings = {
  language: 'en',
  favoriteRecipes: [],
  showHiddenRecipes: false,
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [localSettings, setLocalSettings] = useState<LocalSettings>(defaultLocalSettings);
  const [isLocalLoading, setIsLocalLoading] = useState(true);

  // Cloud state for items at home
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const householdId = currentUser?.household_id ?? null;
  const { data: itemsAtHomeData, isLoading: isItemsLoading } = useItemsAtHome(householdId);
  const addItemMutation = useAddItemAtHome();
  const removeItemMutation = useRemoveItemAtHome();

  // Load local settings from AsyncStorage
  useEffect(() => {
    const loadLocalSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Only load local settings fields, not itemsAtHome (now in cloud)
          setLocalSettings({
            language: parsed.language ?? defaultLocalSettings.language,
            favoriteRecipes: parsed.favoriteRecipes ?? defaultLocalSettings.favoriteRecipes,
            showHiddenRecipes: parsed.showHiddenRecipes ?? defaultLocalSettings.showHiddenRecipes,
          });
        }
      } catch (error) {
        console.error('Failed to load local settings:', error);
      } finally {
        setIsLocalLoading(false);
      }
    };
    loadLocalSettings();
  }, []);

  const saveLocalSettings = useCallback(async (newSettings: LocalSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setLocalSettings(newSettings);
    } catch (error) {
      console.error('Failed to save local settings:', error);
      throw error;
    }
  }, []);

  // Combined settings object
  const settings: Settings = useMemo(
    () => ({
      ...localSettings,
      itemsAtHome: itemsAtHomeData?.items_at_home ?? [],
    }),
    [localSettings, itemsAtHomeData],
  );

  const isLoading = isLocalLoading || isUserLoading || isItemsLoading;

  const addItemAtHome = useCallback(
    async (item: string) => {
      if (!householdId) {
        console.warn('Cannot add item at home: no household');
        return;
      }
      const normalizedItem = item.toLowerCase().trim();
      if (!normalizedItem) return;

      await addItemMutation.mutateAsync({ householdId, item: normalizedItem });
    },
    [householdId, addItemMutation],
  );

  const removeItemAtHome = useCallback(
    async (item: string) => {
      if (!householdId) {
        console.warn('Cannot remove item at home: no household');
        return;
      }
      const normalizedItem = item.toLowerCase().trim();
      await removeItemMutation.mutateAsync({ householdId, item: normalizedItem });
    },
    [householdId, removeItemMutation],
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
        ...localSettings,
        language,
      };
      await saveLocalSettings(newSettings);
    },
    [localSettings, saveLocalSettings],
  );

  const toggleFavorite = useCallback(
    async (recipeId: string) => {
      const isFav = localSettings.favoriteRecipes.includes(recipeId);
      const newSettings = {
        ...localSettings,
        favoriteRecipes: isFav
          ? localSettings.favoriteRecipes.filter((id) => id !== recipeId)
          : [...localSettings.favoriteRecipes, recipeId],
      };
      await saveLocalSettings(newSettings);
    },
    [localSettings, saveLocalSettings],
  );

  const isFavorite = useCallback(
    (recipeId: string) => localSettings.favoriteRecipes.includes(recipeId),
    [localSettings.favoriteRecipes],
  );

  const toggleShowHiddenRecipes = useCallback(async () => {
    const newSettings = {
      ...localSettings,
      showHiddenRecipes: !localSettings.showHiddenRecipes,
    };
    await saveLocalSettings(newSettings);
  }, [localSettings, saveLocalSettings]);

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
        toggleShowHiddenRecipes,
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
