/**
 * Theme registry — first-class theme definitions for light, terminal, and pastel.
 *
 * Each theme is a self-describing `ThemeDefinition` object (with its own `name`)
 * containing all tokens needed by `ThemeProvider`. Adding a new theme means
 * creating another object here and registering it in the `themes` map.
 *
 * The app scans this registry at startup — no runtime theme addition supported.
 */

// Asset import — typed by expo-env.d.ts; Vite handles it in test via resolve.alias
import ELEGANT_BACKGROUND from '@/assets/images/bck_b.png';
import { lightColors } from './colors';
import {
  type BorderRadiusTokens,
  borderRadius,
  type ShadowTokens,
  shadows,
} from './layout';
import { pastelColors } from './pastel-colors';
import { terminalColors, terminalCRT } from './terminal-colors';
import type { ThemeDefinition } from './theme-context';
import { defaultButtonDisplay, terminalButtonDisplay } from './theme-context';
import {
  defaultFontFamily,
  pastelFontFamily,
  terminalFontFamily,
} from './typography';

// ── ThemeDefinition is defined in theme-context.tsx ────────────────────

// ── Derived terminal overrides ─────────────────────────────────────────
// Instead of manually duplicating every key, derive flat/zero/mono tokens
// from the light defaults. This guarantees the keys stay in sync.

/** Map every border-radius key to 0 (sharp corners). */
const deriveFlatRadii = (source: BorderRadiusTokens): BorderRadiusTokens =>
  Object.fromEntries(
    Object.keys(source).map((k) => [k, 0]),
  ) as unknown as BorderRadiusTokens;

/** Map every shadow key to a transparent no-op, preserving glow variants. */
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

/** Scale every border-radius value by a multiplier (clamped to full). */
const scaleRadii = (
  source: BorderRadiusTokens,
  factor: number,
): BorderRadiusTokens =>
  Object.fromEntries(
    Object.entries(source).map(([k, v]) => [
      k,
      k === 'full' ? v : Math.round((v as number) * factor),
    ]),
  ) as unknown as BorderRadiusTokens;

// ── Theme objects ──────────────────────────────────────────────────────

export const lightTheme: ThemeDefinition = {
  name: 'Elegant',
  colors: lightColors,
  fonts: defaultFontFamily,
  borderRadius,
  shadows,
  buttonDisplay: defaultButtonDisplay,
  backgroundImage: ELEGANT_BACKGROUND,
};

export const terminalTheme: ThemeDefinition = {
  name: 'Terminal CRT',
  colors: terminalColors,
  fonts: terminalFontFamily,
  borderRadius: deriveFlatRadii(borderRadius),
  shadows: deriveFlatShadows(shadows, {
    glow: { boxShadow: '0px 0px 8px 0px rgba(51, 255, 51, 0.3)' },
    glowSoft: { boxShadow: '0px 0px 4px 0px rgba(51, 255, 51, 0.15)' },
  }),
  buttonDisplay: terminalButtonDisplay,
  crt: terminalCRT,
};

export const pastelTheme: ThemeDefinition = {
  name: 'Bubbly Pastel',
  colors: pastelColors,
  fonts: pastelFontFamily,
  borderRadius: scaleRadii(borderRadius, 2),
  shadows,
  buttonDisplay: defaultButtonDisplay,
};

// ── Registry ───────────────────────────────────────────────────────────

export const themes = {
  light: lightTheme,
  terminal: terminalTheme,
  pastel: pastelTheme,
} as const;

export type ThemeName = keyof typeof themes;
