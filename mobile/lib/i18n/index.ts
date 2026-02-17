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
import type { AppLanguage } from '@/lib/settings-context';
import { useSettings } from '@/lib/settings-context';
import type { Translations } from './locales/en';
import en from './locales/en';
import it from './locales/it';
import sv from './locales/sv';

const locales: Record<AppLanguage, Translations> = { en, sv, it };

/**
 * Resolve a dot-separated key path (e.g. "recipe.deleteConfirm") to its
 * value in the given translations object.  Returns `undefined` when the
 * path does not exist.
 */
const resolve = (obj: unknown, path: string): string | undefined => {
  let current: unknown = obj;
  for (const segment of path.split('.')) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === 'string' ? current : undefined;
};

/**
 * Replace `{{variable}}` placeholders with the corresponding values from
 * the params object.
 */
const interpolate = (
  template: string,
  params?: Record<string, string | number>,
): string => {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    params[key] != null ? String(params[key]) : `{{${key}}}`,
  );
};

/**
 * The translate function type returned by `useTranslation()`.
 */
export type TFunction = (
  key: string,
  params?: Record<string, string | number>,
) => string;

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

/**
 * Standalone translate function for use outside React component tree.
 * Falls back to English when the key is missing in the given language.
 */
export const translateStandalone = (
  language: AppLanguage,
  key: string,
  params?: Record<string, string | number>,
): string => {
  const translations = locales[language] ?? en;
  const value = resolve(translations, key);
  if (value != null && value !== '') {
    return interpolate(value, params);
  }
  const fallback = resolve(en, key);
  if (fallback != null && fallback !== '') {
    return interpolate(fallback, params);
  }
  return key;
};
