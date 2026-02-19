/**
 * Theme constants for consistent styling across the app.
 * Re-exports all theme modules for a unified import surface.
 */

export type { ColorTokens } from './theme/colors';
export { colors, lightColors } from './theme/colors';
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
  shadows,
  spacing,
  terminal,
} from './theme/layout';
export type { ThemeStyles } from './theme/styles';
export {
  accentUnderlineStyle,
  createStyles,
  inputStyle,
  settingsSubtitleStyle,
  settingsTitleStyle,
} from './theme/styles';
export { terminalColors, terminalCRT } from './theme/terminal-colors';
export type {
  ButtonDisplayConfig,
  CircleStyleFn,
  CRTConfig,
  ThemeDefinition,
} from './theme/theme-context';
export { ThemeProvider, useTheme } from './theme/theme-context';
export {
  allRequiredFonts,
  defaultThemeId,
  isThemeId,
  lightTheme,
  pastelTheme,
  terminalTheme,
  themes,
} from './theme/themes';
export type { FontFamilyTokens, TypographyTokens } from './theme/typography';
export {
  createTypography,
  defaultFontFamily,
  fontFamily,
  fontFamilyWeight,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  typography,
} from './theme/typography';
