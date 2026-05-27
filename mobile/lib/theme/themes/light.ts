/**
 * Light theme — "Elegant"
 *
 * Warm earth tones with DM Sans text,
 * and a subtle animated gradient background. This is the default theme.
 */

import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';

import { lightColors } from '../colors';
import { borderRadius, type ShadowTokens } from '../layout';
import type {
  ButtonDisplayConfig,
  StyleOverrides,
  ThemeDefinition,
  VisibilityTokens,
} from '../theme-context';
import { defaultFontFamily } from '../typography';

const defaultOverrides: StyleOverrides = {
  checkedOpacity: 0.85,
  checkboxBorderWidth: 2,
  dashedBorderWidth: 1.5,
  cardBorderWidth: 1,
  cardHighlightBorderWidth: 0,
  segmentedControlGap: 8,
  segmentedControlPadding: 4,
  segmentedControlActiveIndicator: 'shadow',
  chipToggleGap: 8,
};

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

/** Elegant uses no drop shadows — clean, flat design. */
const FLAT = { boxShadow: '0px 0px 0px 0px transparent' } as const;
const flatShadows: ShadowTokens = {
  none: FLAT,
  xs: FLAT,
  sm: FLAT,
  card: FLAT,
  md: FLAT,
  lg: FLAT,
  xl: FLAT,
  glow: FLAT,
  glowSoft: FLAT,
  cardRaised: FLAT,
  float: FLAT,
};

const buttonDisplay: ButtonDisplayConfig = {
  display: 'both',
  wrapper: 'animated',
  shape: 'circle',
  interaction: 'scale',
};

export const lightTheme: ThemeDefinition = {
  id: 'light',
  name: 'Elegant',
  pickerSwatch: { type: 'color', value: '#C8B59A' },
  colors: lightColors,
  fonts: defaultFontFamily,
  borderRadius,
  shadows: flatShadows,
  buttonDisplay,
  overrides: defaultOverrides,
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
  iconContainerRadius: 0.5,
  requiredFonts: {
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  },
};
