/**
 * Composable style helpers for common UI patterns.
 */

import { colors } from './colors';
import { borderRadius, shadows, spacing } from './layout';
import { fontSize, fontWeight } from './typography';

export const cardStyle = {
  backgroundColor: colors.white,
  borderRadius: borderRadius.lg,
  ...shadows.md,
} as const;

export const glassCardStyle = {
  backgroundColor: colors.glass.light,
  borderRadius: borderRadius.lg,
  borderWidth: 1,
  borderColor: colors.glass.border,
  ...shadows.sm,
} as const;

export const inputStyle = {
  backgroundColor: colors.white,
  borderRadius: borderRadius.md,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  fontSize: fontSize.lg,
  color: colors.text.inverse,
} as const;

export const settingsTitleStyle = {
  fontSize: 16,
  fontWeight: fontWeight.semibold,
  color: colors.text.dark,
} as const;

export const settingsSubtitleStyle = {
  fontSize: fontSize.md,
  color: colors.text.dark + '80',
} as const;

export const accentUnderlineStyle = {
  width: 40,
  height: 3,
  borderRadius: 2,
  backgroundColor: colors.ai.primary,
} as const;
