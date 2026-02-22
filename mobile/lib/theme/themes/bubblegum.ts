/**
 * Bubblegum theme — "'90s Bubblegum"
 *
 * Bold hot-pink, electric blue, and neon candy accents.
 * Comic Sans / rounded system fonts, small border radii for a chunky
 * boxy '90s feel, thick colorful borders instead of shadows.
 * Inspired by the Bubblegum Tumblr theme's naive grid layout.
 */

import { Platform } from 'react-native';
import { bubblegumColors } from '../bubblegum-colors';
import {
  type BorderRadiusTokens,
  borderRadius,
  type ShadowTokens,
} from '../layout';
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

/** Halve radii for a chunky, boxy '90s card look. */
const shrinkRadii = (
  source: BorderRadiusTokens,
  factor: number,
): BorderRadiusTokens =>
  Object.fromEntries(
    Object.entries(source).map(([k, v]) => [
      k,
      k === 'full' ? v : Math.max(0, Math.round((v as number) * factor)),
    ]),
  ) as unknown as BorderRadiusTokens;

/** Bold hard-offset shadows — '90s raised-element look, zero blur. */
const bubblegumShadows: ShadowTokens = {
  none: { boxShadow: '0px 0px 0px 0px transparent' },
  xs: { boxShadow: '1px 1px 0px 0px rgba(0, 0, 0, 0.12)' },
  sm: { boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 0.12)' },
  card: { boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 0.15)' },
  md: { boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 0.15)' },
  lg: { boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 0.18)' },
  xl: { boxShadow: '5px 5px 0px 0px rgba(0, 0, 0, 0.2)' },
  glow: { boxShadow: '3px 3px 0px 0px rgba(255, 77, 141, 0.3)' },
  glowSoft: { boxShadow: '2px 2px 0px 0px rgba(255, 77, 141, 0.2)' },
  cardRaised: { boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 0.2)' },
  float: { boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 0.2)' },
};

// ── Style overrides ────────────────────────────────────────────────────

const overrides: StyleOverrides = {
  checkedOpacity: 0.82,
  checkboxBorderWidth: 2.5,
  dashedBorderWidth: 2,
  cardBorderWidth: 2,
  cardHighlightBorderWidth: 3,
  segmentedControlGap: 6,
  segmentedControlPadding: 3,
  segmentedControlActiveIndicator: 'shadow',
  chipToggleGap: 6,
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
  showCheckmarkIndicator: true,
};

// ── Button config ──────────────────────────────────────────────────────

const buttonDisplay: ButtonDisplayConfig = {
  display: 'both',
  wrapper: 'animated',
  shape: 'circle',
  interaction: 'scale',
  hoverBounce: true,
};

// ── Theme definition ───────────────────────────────────────────────────

export const bubblegumTheme: ThemeDefinition = {
  id: 'bubblegum',
  name: "'90s Bubblegum",
  colors: bubblegumColors,
  fonts,
  borderRadius: shrinkRadii(borderRadius, 0.1),
  shadows: bubblegumShadows,
  buttonDisplay,
  overrides,
  visibility,
  tabBar: {
    borderRadius: 0,
    borderWidth: 2,
    blur: true,
    blurIntensity: 30,
    blurTint: 'light',
  },
  chrome: 'full',
  iconContainerRadius: 0,
  requiredFonts: {}, // uses system rounded font — no custom fonts needed
};
