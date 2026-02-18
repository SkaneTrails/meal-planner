/**
 * Module-level language state for non-React consumers.
 *
 * Extracted to its own module to avoid circular dependencies between
 * settings-context (which imports use-auth) and use-auth (which needs
 * the current language for translateStandalone).
 *
 * AppLanguage is defined here (rather than settings-context) so that
 * i18n/translate.ts can import it without creating a cycle through
 * settings-context → use-auth.
 */

export type AppLanguage = 'en' | 'sv' | 'it';

let _currentLanguage: AppLanguage = 'en';

export const getCurrentLanguage = (): AppLanguage => _currentLanguage;

export const setCurrentLanguage = (lang: AppLanguage): void => {
  _currentLanguage = lang;
};
