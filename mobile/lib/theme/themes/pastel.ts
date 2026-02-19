/**
 * Pastel theme — "Bubbly Pastel"
 *
 * Candy-soft pastels with Comic Sans / rounded system fonts,
 * double-sized border radii, and standard depth shadows.
 */

import { Platform } from 'react-native';
import { type BorderRadiusTokens, borderRadius, shadows } from '../layout';
import { pastelColors } from '../pastel-colors';
import type {
  ButtonDisplayConfig,
  StyleOverrides,
  ThemeDefinition,
  VisibilityTokens,
} from '../theme-context';
import type { FontFamilyTokens } from '../typography';

// ── Platform-resolved comic / rounded font ─────────────────────────────

const isWeb = Platform.OS === 'web';

const COMIC = isWeb
  ? '"Comic Sans MS", "Comic Sans", "Chalkboard SE", cursive'
  : (Platform.select({
      ios: 'Chalkboard SE',
      android: 'casual',
      default: 'sans-serif',
    }) ?? 'sans-serif');

const fonts: FontFamilyTokens = {
  display: COMIC,
  displayRegular: COMIC,
  displayMedium: COMIC,
  displayBold: COMIC,
  body: COMIC,
  bodyMedium: COMIC,
  bodySemibold: COMIC,
  bodyBold: COMIC,
  accent: COMIC,
};

// ── Derived overrides ──────────────────────────────────────────────────

const scaleRadii = (
  source: BorderRadiusTokens,
  factor: number,
): BorderRadiusTokens =>
  Object.fromEntries(
    Object.entries(source).map(([k, v]) => [
      k,
      k === 'full' ? v : Math.round((v as number) * factor),
    ]),
  ) as unknown as BorderRadiusTokens;

// ── Style overrides ────────────────────────────────────────────────────

const overrides: StyleOverrides = {
  checkedOpacity: 0.85,
  checkboxBorderWidth: 2,
  dashedBorderWidth: 1.5,
  dayCardBorderWidth: 1,
  dayCardBorderWidthToday: 2,
  segmentedControlGap: 8,
  segmentedControlPadding: 4,
  segmentedControlActiveIndicator: 'shadow',
  chipToggleGap: 8,
};

// ── Visibility ─────────────────────────────────────────────────────────

const visibility: VisibilityTokens = {
  showStackHeader: true,
  showTodayDot: true,
  showTodayBadge: true,
  showDayNotes: true,
  showChevrons: true,
  showStatIcons: true,
  showProgressBar: true,
  showAddItemLabel: true,
  showEmptyStateIcon: true,
  showHeroOverlay: true,
  showRecipeActionButtons: true,
  showVisibilityChip: true,
  showRecipeTags: true,
  showFrameLabels: false,
  showChipToggleDot: true,
  showStatDividers: false,
  showSectionHeaderIcon: true,
};

// ── Button config ──────────────────────────────────────────────────────

const buttonDisplay: ButtonDisplayConfig = {
  display: 'both',
  wrapper: 'animated',
  shape: 'circle',
  interaction: 'scale',
};

// ── Theme definition ───────────────────────────────────────────────────

export const pastelTheme: ThemeDefinition = {
  id: 'pastel',
  name: 'Bubbly Pastel',
  colors: pastelColors,
  fonts,
  borderRadius: scaleRadii(borderRadius, 2),
  shadows,
  buttonDisplay,
  overrides,
  visibility,
  requiredFonts: {}, // uses system rounded font — no custom fonts needed
};
