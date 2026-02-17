/**
 * Theme constants for consistent styling across the app.
 * Re-exports all theme modules for a unified import surface.
 */

export type { ColorTokens } from './theme/colors';
export { colors, lightColors } from './theme/colors';
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
} from './theme/layout';
export type { ThemeStyles } from './theme/styles';
export {
  accentUnderlineStyle,
  createStyles,
  inputStyle,
  settingsSubtitleStyle,
  settingsTitleStyle,
} from './theme/styles';
export { terminalColors } from './theme/terminal-colors';
export { ThemeProvider, useTheme } from './theme/theme-context';
export type { FontFamilyTokens } from './theme/typography';
export {
  fontFamily,
  fontFamilyWeight,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  typography,
} from './theme/typography';
