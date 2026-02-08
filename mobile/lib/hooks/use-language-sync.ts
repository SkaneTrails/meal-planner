/**
 * Hook to sync language preference between local settings and Firestore.
 *
 * On first load after auth, reads the household's language setting from
 * Firestore and applies it locally (unless the user has already set a
 * language locally — AsyncStorage is the initial source of truth).
 *
 * When the user changes language, the settings screen calls
 * updateHouseholdLanguage() to write the change back to Firestore so
 * other household members pick it up.
 */

import { useEffect, useRef } from 'react';
import { useHouseholdSettings, useUpdateHouseholdSettings } from './use-admin';
import { useSettings, type AppLanguage } from '@/lib/settings-context';

const SUPPORTED_LANGUAGES: AppLanguage[] = ['en', 'sv', 'it'];

const isSupportedLanguage = (value: string): value is AppLanguage  => {
  return SUPPORTED_LANGUAGES.includes(value as AppLanguage);
}

/**
 * Syncs language from Firestore household settings → local on first load.
 * Call this once in a component that has access to both auth and settings contexts.
 */
export const useLanguageSync = (householdId: string | null | undefined) => {
  const { settings, setLanguage } = useSettings();
  const { data: householdSettings } = useHouseholdSettings(householdId ?? null);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (hasSynced.current) return;
    if (!householdSettings?.language) return;

    const remoteLanguage = householdSettings.language;
    if (!isSupportedLanguage(remoteLanguage)) return;

    if (settings.language !== remoteLanguage) {
      (async () => {
        try {
          await setLanguage(remoteLanguage);
          hasSynced.current = true;
        } catch {
          // Allow retry on next render if AsyncStorage write fails
        }
      })();
    } else {
      hasSynced.current = true;
    }
  }, [householdSettings?.language, settings.language, setLanguage]);
}

/**
 * Returns a function that updates the household language in Firestore.
 * Used alongside the local setLanguage() in the settings screen.
 */
export const useUpdateHouseholdLanguage = (
  householdId: string | null | undefined,
) => {
  const updateSettings = useUpdateHouseholdSettings();

  return async (language: AppLanguage) => {
    if (!householdId) return;
    await updateSettings.mutateAsync({
      householdId,
      settings: { language },
    });
  };
}
