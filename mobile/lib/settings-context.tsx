/**
 * Settings context for app-wide settings.
 *
 * All settings are synced with the cloud (per-household via API):
 * - itemsAtHome: household items-at-home list
 * - favoriteRecipes: household favorite recipe IDs
 * - language: household language preference
 *
 * Only showHiddenRecipes remains device-local (view preference via AsyncStorage).
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
  useAddFavoriteRecipe,
  useAddItemAtHome,
  useCurrentUser,
  useFavoriteRecipes,
  useHouseholdSettings,
  useItemsAtHome,
  useRemoveFavoriteRecipe,
  useRemoveItemAtHome,
  useUpdateHouseholdSettings,
} from './hooks/use-admin';
import { useAuth } from './hooks/use-auth';

const STORAGE_KEY = '@meal_planner_settings';

import type { WeekStart } from '@/lib/utils/dateFormatter';

export type AppLanguage = 'en' | 'sv' | 'it';

/**
 * Module-level language for use outside the React component tree
 * (e.g. the onUnauthorized callback in AuthProvider).
 * Updated by SettingsProvider whenever the resolved language changes.
 */
let _currentLanguage: AppLanguage = 'en';
export const getCurrentLanguage = (): AppLanguage => _currentLanguage;

export const LANGUAGES: { code: AppLanguage; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
];

interface LocalSettings {
  showHiddenRecipes: boolean;
}

interface Settings extends LocalSettings {
  itemsAtHome: string[];
  favoriteRecipes: string[];
  noteSuggestions: string[];
  language: AppLanguage;
  weekStart: WeekStart;
  aiEnabled: boolean;
}

interface SettingsContextType {
  settings: Settings;
  weekStart: WeekStart;
  isLoading: boolean;
  needsLanguagePrompt: boolean;
  addItemAtHome: (item: string) => Promise<void>;
  removeItemAtHome: (item: string) => Promise<void>;
  isItemAtHome: (item: string) => boolean;
  setLanguage: (language: AppLanguage) => Promise<void>;
  setWeekStart: (weekStart: WeekStart) => Promise<void>;
  toggleFavorite: (recipeId: string) => Promise<void>;
  isFavorite: (recipeId: string) => boolean;
  toggleShowHiddenRecipes: () => Promise<void>;
}

const defaultLocalSettings: LocalSettings = {
  showHiddenRecipes: false,
};

const SUPPORTED_LANGUAGES: AppLanguage[] = ['en', 'sv', 'it'];

const isSupportedLanguage = (value: string): value is AppLanguage => {
  return SUPPORTED_LANGUAGES.includes(value as AppLanguage);
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [localSettings, setLocalSettings] =
    useState<LocalSettings>(defaultLocalSettings);
  const [isLocalLoading, setIsLocalLoading] = useState(true);

  // Wait for Firebase auth before firing API calls
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !authLoading && !!user;

  // Cloud state — only fetch when authenticated
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser({
    enabled: isAuthenticated,
  });
  const householdId = currentUser?.household_id ?? null;
  const { data: itemsAtHomeData, isLoading: isItemsLoading } =
    useItemsAtHome(householdId);
  const { data: favoritesData, isLoading: isFavoritesLoading } =
    useFavoriteRecipes(householdId);
  const { data: householdSettings, isLoading: isSettingsLoading } =
    useHouseholdSettings(householdId);
  const addItemMutation = useAddItemAtHome();
  const removeItemMutation = useRemoveItemAtHome();
  const addFavoriteMutation = useAddFavoriteRecipe();
  const removeFavoriteMutation = useRemoveFavoriteRecipe();
  const updateSettingsMutation = useUpdateHouseholdSettings();

  // Load device-local settings from AsyncStorage (only showHiddenRecipes)
  useEffect(() => {
    const loadLocalSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setLocalSettings({
            showHiddenRecipes:
              parsed.showHiddenRecipes ??
              defaultLocalSettings.showHiddenRecipes,
          });
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to load local settings:', error);
        }
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
      if (__DEV__) {
        console.error('Failed to save local settings:', error);
      }
      throw error;
    }
  }, []);

  // Resolve language from household settings
  const cloudLanguage = householdSettings?.language;
  const resolvedLanguage: AppLanguage =
    cloudLanguage && isSupportedLanguage(cloudLanguage) ? cloudLanguage : 'en';

  // Keep module-level language in sync for non-React consumers
  _currentLanguage = resolvedLanguage;

  // Prompt user to pick a language if their own household has none set.
  // Superusers may manage multiple households — only check the user's own.
  const isSuperuser = currentUser?.role === 'superuser';
  const needsLanguagePrompt =
    isAuthenticated &&
    !isUserLoading &&
    !isSettingsLoading &&
    !!householdId &&
    !isSuperuser &&
    !cloudLanguage;

  // Resolve week start from household settings
  const resolvedWeekStart: WeekStart =
    householdSettings?.week_start === 'saturday' ? 'saturday' : 'monday';

  // Combined settings object
  const aiEnabled = householdSettings?.ai_features_enabled ?? true;

  const settings: Settings = useMemo(
    () => ({
      ...localSettings,
      itemsAtHome: itemsAtHomeData?.items_at_home ?? [],
      favoriteRecipes: favoritesData?.favorite_recipes ?? [],
      noteSuggestions: householdSettings?.note_suggestions ?? [],
      language: resolvedLanguage,
      weekStart: resolvedWeekStart,
      aiEnabled,
    }),
    [
      localSettings,
      itemsAtHomeData,
      favoritesData,
      householdSettings,
      resolvedLanguage,
      resolvedWeekStart,
      aiEnabled,
    ],
  );

  const isLoading =
    isLocalLoading ||
    authLoading ||
    isUserLoading ||
    isItemsLoading ||
    isFavoritesLoading ||
    isSettingsLoading;

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
      await removeItemMutation.mutateAsync({
        householdId,
        item: normalizedItem,
      });
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
      if (!householdId) {
        console.warn('Cannot set language: no household');
        return;
      }
      await updateSettingsMutation.mutateAsync({
        householdId,
        settings: { language },
      });
    },
    [householdId, updateSettingsMutation],
  );

  const setWeekStart = useCallback(
    async (weekStart: WeekStart) => {
      if (!householdId) {
        console.warn('Cannot set week start: no household');
        return;
      }
      await updateSettingsMutation.mutateAsync({
        householdId,
        settings: { week_start: weekStart },
      });
    },
    [householdId, updateSettingsMutation],
  );

  const toggleFavorite = useCallback(
    async (recipeId: string) => {
      if (!householdId) {
        console.warn('Cannot toggle favorite: no household');
        return;
      }
      const isFav =
        favoritesData?.favorite_recipes?.includes(recipeId) ?? false;
      if (isFav) {
        await removeFavoriteMutation.mutateAsync({ householdId, recipeId });
      } else {
        await addFavoriteMutation.mutateAsync({ householdId, recipeId });
      }
    },
    [householdId, favoritesData, addFavoriteMutation, removeFavoriteMutation],
  );

  const isFavorite = useCallback(
    (recipeId: string) =>
      favoritesData?.favorite_recipes?.includes(recipeId) ?? false,
    [favoritesData],
  );

  const toggleShowHiddenRecipes = useCallback(async () => {
    const newSettings = {
      ...localSettings,
      showHiddenRecipes: !localSettings.showHiddenRecipes,
    };
    await saveLocalSettings(newSettings);
  }, [localSettings, saveLocalSettings]);

  const contextValue = useMemo<SettingsContextType>(
    () => ({
      settings,
      weekStart: resolvedWeekStart,
      isLoading,
      needsLanguagePrompt,
      addItemAtHome,
      removeItemAtHome,
      isItemAtHome,
      setLanguage,
      setWeekStart,
      toggleFavorite,
      isFavorite,
      toggleShowHiddenRecipes,
    }),
    [
      settings,
      resolvedWeekStart,
      isLoading,
      needsLanguagePrompt,
      addItemAtHome,
      removeItemAtHome,
      isItemAtHome,
      setLanguage,
      setWeekStart,
      toggleFavorite,
      isFavorite,
      toggleShowHiddenRecipes,
    ],
  );

  return (
    <SettingsContext.Provider value={contextValue}>
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
};
