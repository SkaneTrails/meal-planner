/**
 * Pure translation utilities — no React, no settings-context dependency.
 *
 * Extracted from index.ts to break the circular dependency:
 * use-auth → i18n/index → settings-context → use-auth
 */

import type { AppLanguage } from '@/lib/language-state';
import type { Translations } from './locales/en';
import en from './locales/en';
import it from './locales/it';
import sv from './locales/sv';

export const locales: Record<AppLanguage, Translations> = { en, sv, it };

/**
 * Resolve a dot-separated key path (e.g. "recipe.deleteConfirm") to its
 * value in the given translations object.  Returns `undefined` when the
 * path does not exist.
 */
export const resolve = (obj: unknown, path: string): string | undefined => {
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
export const interpolate = (
  template: string,
  params?: Record<string, string | number>,
): string => {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    params[key] != null ? String(params[key]) : `{{${key}}}`,
  );
};

/** The translate function type returned by `useTranslation()`. */
export type TFunction = (
  key: string,
  params?: Record<string, string | number>,
) => string;

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
