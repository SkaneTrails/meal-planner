/**
 * Module-level language state for non-React consumers.
 *
 * Extracted to its own module to avoid circular dependencies between
 * settings-context (which imports use-auth) and use-auth (which needs
 * the current language for translateStandalone).
 */

import type { AppLanguage } from './settings-context';

let _currentLanguage: AppLanguage = 'en';

export const getCurrentLanguage = (): AppLanguage => _currentLanguage;

export const setCurrentLanguage = (lang: AppLanguage): void => {
  _currentLanguage = lang;
};
