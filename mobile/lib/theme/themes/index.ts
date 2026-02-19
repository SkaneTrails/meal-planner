/**
 * Theme registry — auto-built from individual theme files.
 *
 * Each theme is a self-contained file that exports a complete `ThemeDefinition`.
 * The registry collects them and provides lookup, the default theme ID, and
 * aggregated font assets for `useFonts`.
 *
 * To add a theme: create a new file in this folder, then add one import +
 * one array entry below. To remove: delete the file and its entry.
 */

import type { ThemeDefinition } from '../theme-context';
import { lightTheme } from './light';
import { pastelTheme } from './pastel';
import { terminalTheme } from './terminal';

// ── Theme list — first entry is the default ────────────────────────────

const allThemes: ThemeDefinition[] = [lightTheme, terminalTheme, pastelTheme];

// ── Derived registry exports ───────────────────────────────────────────

/** Theme lookup by id. */
export const themes: Record<string, ThemeDefinition> = Object.fromEntries(
  allThemes.map((t) => [t.id, t]),
);

/** Registry key of the default theme (first in the list). */
export const defaultThemeId: string = allThemes[0].id;

/**
 * All custom font assets required across every registered theme.
 * Spread into `useFonts()` at app startup — no theme-specific font
 * knowledge needed in the layout.
 */
export const allRequiredFonts: Record<string, number> = Object.assign(
  {},
  ...allThemes.map((t) => t.requiredFonts),
);

/** Validate that a string is a registered theme id. */
export const isThemeId = (value: string): boolean => value in themes;

// Re-export individual themes for direct access
export { lightTheme, pastelTheme, terminalTheme };
