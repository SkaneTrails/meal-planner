/**
 * Theme-aware toggle — thin wrapper around `<Toggle>` for backward compat.
 *
 * New code should use `<Toggle>` directly. This exists so existing
 * `<ThemeToggle>` call sites (SettingToggleRow, etc.) keep working.
 */

import { Toggle } from './Toggle';

interface ThemeToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const ThemeToggle = (props: ThemeToggleProps) => <Toggle {...props} />;
