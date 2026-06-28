/**
 * i18n module — provides the useTranslation() hook.
 *
 * Usage:
 *   const { t } = useTranslation();
 *   t('common.cancel')             // → "Cancel"
 *   t('recipe.deleteConfirm', { title: 'Pasta' })
 *     // → 'Are you sure you want to delete "Pasta"?'
 */

import { useCallback, useEffect, useState } from 'react';
import { useSettings } from '@/lib/settings-context';
import type { Translations } from './locales/en';
import en from './locales/en';
import { getLocale, interpolate, resolve, type TFunction } from './translate';

export type { TFunction };
export { translateStandalone } from './translate';

/**
 * React hook that returns a `t()` function bound to the current app language.
 *
 * Falls back to English when:
 *   - the key does not exist in the active locale
 *   - the resolved value is an empty string (stub translation)
 *   - the locale hasn't finished loading yet
 *
 * If the key is also missing from English, returns the key itself so missing
 * translations are obvious during development.
 */
export const useTranslation = () => {
  const { settings } = useSettings();
  const language = settings.language;
  const [translations, setTranslations] = useState<Translations>(en);

  useEffect(() => {
    if (language === 'en') {
      setTranslations(en);
      return;
    }
    setTranslations(en);
    let cancelled = false;
    getLocale(language)
      .then((locale) => {
        if (!cancelled) setTranslations(locale);
      })
      .catch(() => {
        if (!cancelled) setTranslations(en);
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

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
