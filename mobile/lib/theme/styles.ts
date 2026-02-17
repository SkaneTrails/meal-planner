/**
 * Composable style helpers for common UI patterns.
 *
 * `createStyles` builds the presets from a color palette so future themes
 * can regenerate them. The static exports below are the light-theme defaults.
 */

import type { ColorTokens } from './colors';
import { colors } from './colors';
import { borderRadius, shadows, spacing } from './layout';
import { fontSize, fontWeight } from './typography';

/** Build style presets for a given color palette. */
export const createStyles = (c: ColorTokens) =>
  ({
    inputStyle: {
      backgroundColor: c.white,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      fontSize: fontSize.lg,
      color: c.text.inverse,
    },
    settingsTitleStyle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: c.content.body,
    },
    settingsSubtitleStyle: {
      fontSize: fontSize.md,
      color: c.content.subtitle,
    },
    accentUnderlineStyle: {
      width: 40,
      height: 3,
      borderRadius: 2,
      backgroundColor: c.ai.primary,
    },
  }) as const;

/** Return type of `createStyles` — useful for typing themed style objects. */
export type ThemeStyles = ReturnType<typeof createStyles>;

// Light-theme defaults (preserve existing static exports)
const styles = createStyles(colors);
export const {
  inputStyle,
  settingsTitleStyle,
  settingsSubtitleStyle,
  accentUnderlineStyle,
} = styles;
