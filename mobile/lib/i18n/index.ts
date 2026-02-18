/**
 * i18n module — provides the useTranslation() hook.
 *
 * Usage:
 *   const { t } = useTranslation();
 *   t('common.cancel')             // → "Cancel"
 *   t('recipe.deleteConfirm', { title: 'Pasta' })
 *     // → 'Are you sure you want to delete "Pasta"?'
 */

import { useCallback, useMemo } from 'react';
import { useSettings } from '@/lib/settings-context';
import en from './locales/en';
import { interpolate, locales, resolve, type TFunction } from './translate';

export type { TFunction };
export { translateStandalone } from './translate';

/**
 * React hook that returns a `t()` function bound to the current app language.
 *
 * Falls back to English when:
 *   - the key does not exist in the active locale
 *   - the resolved value is an empty string (stub translation)
 *
 * If the key is also missing from English, returns the key itself so missing
 * translations are obvious during development.
 */
export const useTranslation = () => {
  const { settings } = useSettings();
  const language = settings.language;

  const translations = useMemo(() => locales[language] ?? en, [language]);

  const t: TFunction = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const value = resolve(translations, key);
      if (value != null && value !== '') {
        return interpolate(value, params);
      }
      const fallback = resolve(en, key);
      if (fallback != null && fallback !== '') {
        return interpolate(fallback, params);
      }
      return key;
    },
    [translations],
  );

  return { t, language };
};
