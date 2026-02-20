/**
 * Terminal theme — "Terminal CRT"
 *
 * Phosphor green on black with monospace fonts, zero border radius,
 * flat shadows (except glow), and CRT visual effects (scanlines, flicker).
 */

import { Platform } from 'react-native';
import {
  type BorderRadiusTokens,
  borderRadius,
  type ShadowTokens,
  shadows,
} from '../layout';
import { terminalColors, terminalCRT } from '../terminal-colors';
import type {
  ButtonDisplayConfig,
  StyleOverrides,
  ThemeDefinition,
  VisibilityTokens,
} from '../theme-context';
import type { FontFamilyTokens } from '../typography';

const overrides: StyleOverrides = {
  checkedOpacity: 0.7,
  checkboxBorderWidth: 1,
  dashedBorderWidth: 0,
  dayCardBorderWidth: 0,
  dayCardBorderWidthToday: 0,
  segmentedControlGap: 0,
  segmentedControlPadding: 0,
  segmentedControlActiveIndicator: 'underline',
  chipToggleGap: 0,
};

const visibility: VisibilityTokens = {
  showStackHeader: false,
  showTodayDot: false,
  showTodayBadge: false,
  showDayNotes: false,
  showChevrons: false,
  showStatIcons: false,
  showProgressBar: false,
  showAddItemLabel: false,
  showEmptyStateIcon: false,
  showHeroOverlay: false,
  showRecipeActionButtons: false,
  showVisibilityChip: false,
  showRecipeTags: false,
  showFrameLabels: true,
  showChipToggleDot: false,
  showStatDividers: true,
  showSectionHeaderIcon: false,
  showCheckmarkIndicator: false,
};

// ── Platform-resolved monospace font ───────────────────────────────────

const isWeb = Platform.OS === 'web';

const MONO = isWeb
  ? '"Courier New", "Courier", monospace'
  : (Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }) ?? 'monospace');

const fonts: FontFamilyTokens = {
  display: MONO,
  displayRegular: MONO,
  displayMedium: MONO,
  displayBold: MONO,
  body: MONO,
  bodyMedium: MONO,
  bodySemibold: MONO,
  bodyBold: MONO,
  accent: MONO,
};

// ── Derived overrides ──────────────────────────────────────────────────
// Derive flat radii/shadows from the shared base instead of manual duplication.

const deriveFlatRadii = (source: BorderRadiusTokens): BorderRadiusTokens =>
  Object.fromEntries(
    Object.keys(source).map((k) => [k, 0]),
  ) as unknown as BorderRadiusTokens;

const deriveFlatShadows = (
  source: ShadowTokens,
  glowOverrides: Partial<ShadowTokens>,
): ShadowTokens => {
  const NONE = { boxShadow: '0px 0px 0px 0px transparent' } as const;
  const flat = Object.fromEntries(
    Object.keys(source).map((k) => [k, NONE]),
  ) as unknown as ShadowTokens;
  return { ...flat, ...glowOverrides };
};

// ── Button config ──────────────────────────────────────────────────────

const buttonDisplay: ButtonDisplayConfig = {
  display: 'text',
  wrapper: 'segment',
  shape: 'none',
  interaction: 'highlight',
};

// ── Theme definition ───────────────────────────────────────────────────

export const terminalTheme: ThemeDefinition = {
  id: 'terminal',
  name: 'Terminal CRT',
  colors: terminalColors,
  fonts,
  borderRadius: deriveFlatRadii(borderRadius),
  shadows: deriveFlatShadows(shadows, {
    glow: { boxShadow: '0px 0px 8px 0px rgba(51, 255, 51, 0.3)' },
    glowSoft: { boxShadow: '0px 0px 4px 0px rgba(51, 255, 51, 0.15)' },
  }),
  buttonDisplay,
  overrides,
  visibility,
  tabBar: {
    borderRadius: 0,
    borderWidth: 2,
    blur: false,
    blurIntensity: 0,
    blurTint: 'dark',
  },
  chrome: 'flat',
  crt: terminalCRT,
  requiredFonts: {}, // uses system monospace — no custom fonts needed
};
