/**
 * Light theme — "Elegant"
 *
 * Warm earth tones with Playfair Display headings, DM Sans body text,
 * and a subtle linen background image. This is the default theme.
 */

import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';

// Asset import — typed by expo-env.d.ts; Vite handles it in test via resolve.alias
import ELEGANT_BACKGROUND from '@/assets/images/bck_b.png';
import { lightColors } from '../colors';
import { borderRadius, type ShadowTokens, shadows } from '../layout';
import type {
  ButtonDisplayConfig,
  StyleOverrides,
  TabBarTokens,
  ThemeDefinition,
  VisibilityTokens,
} from '../theme-context';
import { defaultFontFamily } from '../typography';

const defaultOverrides: StyleOverrides = {
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
  backgroundImage: ELEGANT_BACKGROUND,
  requiredFonts: {
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  },
};
