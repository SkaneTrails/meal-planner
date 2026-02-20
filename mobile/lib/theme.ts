/**
 * Public theme API surface.
 *
 * Only the supported consumer-facing exports are re-exported here.
 * Theme internals (raw color palettes, per-theme font families, factory
 * functions, etc.) are intentionally kept internal to `theme/` and
 * imported via relative paths by theme infrastructure only.
 */

export type { ColorTokens } from './theme/colors';
export type {
  BorderRadiusTokens,
  IconContainerSize,
  ShadowTokens,
} from './theme/layout';
export {
  animation,
  borderRadius,
  circleStyle,
  dotSize,
  iconContainer,
  iconSize,
  layout,
  spacing,
  terminal,
} from './theme/layout';
export type { ThemeStyles } from './theme/styles';
export {
  accentUnderlineStyle,
  settingsSubtitleStyle,
  settingsTitleStyle,
} from './theme/styles';
export type {
  ButtonDisplayConfig,
  CircleStyleFn,
  CRTConfig,
  LayoutChrome,
  StyleOverrides,
  ThemeDefinition,
  VisibilityTokens,
} from './theme/theme-context';
export { ThemeProvider, useTheme } from './theme/theme-context';
export {
  allRequiredFonts,
  bubblegumTheme,
  defaultThemeId,
  isThemeId,
  lightTheme,
  terminalTheme,
  themes,
} from './theme/themes';
export type { FontFamilyTokens, TypographyTokens } from './theme/typography';
export {
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
} from './theme/typography';
