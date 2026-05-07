/**
 * Petrol theme — "Petrol"
 *
 * Editorial minimalism inspired by modern recipe magazines:
 *   • Deep petrol-blue accent (`#0E5C6F`) on cool paper-white surfaces.
 *   • DM Serif Display for headings — confident, magazine-like display type.
 *   • DM Sans for body — clean, generous, easy to read.
 *   • Pill-shaped buttons & meta chips, very rounded — soft, approachable.
 *   • Floating glass tab bar with petrol-tinted active state.
 *   • Quiet layered shadows for restrained depth.
 */

import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { Platform } from 'react-native';

import { borderRadius, type ShadowTokens } from '../layout';
import { petrolColors } from '../petrol-colors';
import type {
  ButtonDisplayConfig,
  StyleOverrides,
  ThemeDefinition,
  VisibilityTokens,
} from '../theme-context';
import type { FontFamilyTokens } from '../typography';

// ── Typography — clean sans throughout ─────────────────────────────────

const isWeb = Platform.OS === 'web';

const SANS = isWeb ? '"DM Sans", sans-serif' : 'DMSans_400Regular';
const SANS_MEDIUM = isWeb ? '"DM Sans", sans-serif' : 'DMSans_500Medium';
const SANS_SEMIBOLD = isWeb ? '"DM Sans", sans-serif' : 'DMSans_600SemiBold';
const SANS_BOLD = isWeb ? '"DM Sans", sans-serif' : 'DMSans_700Bold';

const petrolFonts: FontFamilyTokens = {
  // Display = sans bold. Used for hero titles, screen headings, recipe names.
  display: SANS_BOLD,
  displayRegular: SANS,
  displayMedium: SANS_MEDIUM,
  displayBold: SANS_BOLD,
  // Body = sans. Calm and legible for descriptions, lists, UI chrome.
  body: SANS,
  bodyMedium: SANS_MEDIUM,
  bodySemibold: SANS_SEMIBOLD,
  bodyBold: SANS_BOLD,
  // Accent = uppercase eyebrow labels ("MAINS", "TOTAL TIME") — sans medium.
  accent: SANS_MEDIUM,
};

// ── Border radii — pill-friendly, generous curves ──────────────────────

/**
 * Petrol uses very rounded shapes:
 *   • small chrome (chips, badges) → pill (`full`)
 *   • cards/containers → soft rounded
 *   • buttons → pill via `buttonRadius`
 */
const petrolRadii = {
  ...borderRadius,
  '3xs': 4,
  '2xs': 6,
  'xs-sm': 8,
  xs: 10,
  'sm-md': 12,
  sm: 14,
  'md-lg': 16,
  md: 18,
  lg: 22,
  'lg-xl': 26,
  xl: 28,
  '2xl': 32,
  full: 9999,
} as const;

// ── Style overrides ────────────────────────────────────────────────────

const overrides: StyleOverrides = {
  checkedOpacity: 0.78,
  checkboxBorderWidth: 1.5,
  dashedBorderWidth: 1,
  cardBorderWidth: 0,
  cardHighlightBorderWidth: 0,
  segmentedControlGap: 6,
  segmentedControlPadding: 4,
  segmentedControlActiveIndicator: 'underline',
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
  showSectionHeaderIcon: false,
  showCheckmarkIndicator: true,
};

// ── Shadows — quiet, layered lift (no warmth, low alpha) ───────────────

const petrolShadows: ShadowTokens = {
  none: { boxShadow: '0px 0px 0px 0px transparent' },
  xs: { boxShadow: '0px 1px 2px 0px rgba(17, 24, 28, 0.04)' },
  sm: { boxShadow: '0px 1px 3px 0px rgba(17, 24, 28, 0.06)' },
  card: { boxShadow: '0px 2px 6px 0px rgba(17, 24, 28, 0.05)' },
  md: { boxShadow: '0px 3px 8px 0px rgba(17, 24, 28, 0.07)' },
  lg: { boxShadow: '0px 6px 16px 0px rgba(17, 24, 28, 0.08)' },
  xl: { boxShadow: '0px 12px 28px 0px rgba(17, 24, 28, 0.1)' },
  glow: { boxShadow: '0px 0px 16px 0px rgba(14, 92, 111, 0.18)' },
  glowSoft: { boxShadow: '0px 0px 10px 0px rgba(14, 92, 111, 0.12)' },
  cardRaised: { boxShadow: '0px 4px 12px 0px rgba(17, 24, 28, 0.08)' },
  float: { boxShadow: '0px 8px 20px 0px rgba(17, 24, 28, 0.1)' },
};

// ── Button config — circular icon buttons, soft pill labels ────────────

const buttonDisplay: ButtonDisplayConfig = {
  display: 'both',
  wrapper: 'animated',
  shape: 'circle',
  interaction: 'scale',
};

// ── Theme definition ───────────────────────────────────────────────────

export const petrolTheme: ThemeDefinition = {
  id: 'petrol',
  name: 'Petrol',
  pickerSwatch: { type: 'color', value: '#0E5C6F' },
  colors: petrolColors,
  fonts: petrolFonts,
  borderRadius: petrolRadii,
  shadows: petrolShadows,
  buttonDisplay,
  overrides,
  visibility,
  tabBar: {
    borderRadius: 16,
    borderWidth: 0.5,
    blur: true,
    blurIntensity: 40,
    blurTint: 'light',
  },
  chrome: 'full',
  toggleStyle: 'switch',
  // Circular icon containers — matches the floating circular FABs in the inspo.
  iconContainerRadius: 0.5,
  // Pill-shaped buttons.
  buttonRadius: 9999,
  requiredFonts: {
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  },
};
