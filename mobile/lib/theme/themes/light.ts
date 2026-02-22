/**
 * Light theme — "Elegant"
 *
 * Warm earth tones with Cormorant Garamond headings, DM Sans body text,
 * and a subtle animated gradient background. This is the default theme.
 */

import {
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';

import { Platform } from 'react-native';

import { lightColors } from '../colors';
import { borderRadius, type ShadowTokens, shadows } from '../layout';
import type {
  ButtonDisplayConfig,
  StyleOverrides,
  ThemeDefinition,
  VisibilityTokens,
} from '../theme-context';
import type { FontFamilyTokens } from '../typography';

const defaultOverrides: StyleOverrides = {
  checkedOpacity: 0.85,
  checkboxBorderWidth: 2,
  dashedBorderWidth: 1.5,
  dayCardBorderWidth: 1,
  dayCardBorderWidthToday: 0,
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

const isWeb = Platform.OS === 'web';

const fonts: FontFamilyTokens = {
  display: isWeb
    ? '"Cormorant Garamond", serif'
    : 'CormorantGaramond_600SemiBold',
  displayRegular: isWeb
    ? '"Cormorant Garamond", serif'
    : 'CormorantGaramond_400Regular',
  displayMedium: isWeb
    ? '"Cormorant Garamond", serif'
    : 'CormorantGaramond_500Medium',
  displayBold: isWeb
    ? '"Cormorant Garamond", serif'
    : 'CormorantGaramond_700Bold',
  body: isWeb ? '"DM Sans", sans-serif' : 'DMSans_400Regular',
  bodyMedium: isWeb ? '"DM Sans", sans-serif' : 'DMSans_500Medium',
  bodySemibold: isWeb ? '"DM Sans", sans-serif' : 'DMSans_600SemiBold',
  bodyBold: isWeb ? '"DM Sans", sans-serif' : 'DMSans_700Bold',
  accent: isWeb ? '"DM Sans", sans-serif' : 'DMSans_500Medium',
};

/** Elegant uses no drop shadows — clean, flat design. */
const flatShadows = Object.fromEntries(
  Object.keys(shadows).map((k) => [
    k,
    { boxShadow: '0px 0px 0px 0px transparent' },
  ]),
) as unknown as ShadowTokens;

const buttonDisplay: ButtonDisplayConfig = {
  display: 'both',
  wrapper: 'animated',
  shape: 'circle',
  interaction: 'scale',
};

export const lightTheme: ThemeDefinition = {
  id: 'light',
  name: 'Elegant',
  colors: lightColors,
  fonts,
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
  iconContainerRadius: 0.5,
  requiredFonts: {
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
  },
};
