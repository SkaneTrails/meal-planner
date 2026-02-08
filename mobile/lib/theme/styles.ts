/**
 * Composable style helpers for common UI patterns.
 */

import { colors } from './colors';
import { borderRadius } from './layout';
import { shadows } from './layout';
import { spacing } from './layout';
import { fontSize } from './typography';

export const cardStyle = {
  backgroundColor: colors.white,
  borderRadius: borderRadius.lg,
  ...shadows.md,
} as const;

export const glassCardStyle = {
  backgroundColor: colors.glass.light,
  borderRadius: borderRadius.lg,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.3)',
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
