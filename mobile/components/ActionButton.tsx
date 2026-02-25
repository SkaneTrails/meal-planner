/**
 * Semantic button presets — enforce consistent icon + tone combos
 * across the app.
 *
 * Each preset locks the icon and tone so call sites only provide the
 * action-specific props (`onPress`, `label`, `disabled`, etc.).
 *
 * Use raw `Button` / `IconButton` when no preset fits.
 */

import type { GestureResponderEvent, ViewStyle } from 'react-native';
import { Button } from '@/components/Button';

/* ── Shared props accepted by every preset ──────────────────────────── */

interface BaseProps {
  onPress: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  isPending?: boolean;
  hitSlop?:
    | number
    | { top?: number; bottom?: number; left?: number; right?: number };
  style?: ViewStyle;
  testID?: string;
}

/* ── Delete ──────────────────────────────────────────────────────────── */

interface DeleteProps extends BaseProps {
  /** Optional label shown next to the trash icon. */
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  iconSize?: number;
}

/**
 * Destructive delete action — trash icon + warning tone.
 *
 * `variant="text"` so it sits inline (not a CTA-primary button).
 */
const Delete = ({ label, size, iconSize, ...rest }: DeleteProps) => (
  <Button
    variant="text"
    tone="warning"
    icon="trash-outline"
    label={label}
    size={size}
    iconSize={iconSize}
    {...rest}
  />
);

/* ── Dismiss ─────────────────────────────────────────────────────────── */

interface DismissProps extends BaseProps {
  iconSize?: number;
}

/**
 * Close a form, preview, or panel — ✕ icon + cancel tone.
 *
 * `variant="icon"` — no label, just the close icon.
 */
const Dismiss = ({ iconSize, ...rest }: DismissProps) => (
  <Button
    variant="icon"
    tone="cancel"
    icon="close"
    iconSize={iconSize}
    {...rest}
  />
);

/* ── ClearInput ──────────────────────────────────────────────────────── */

type ClearInputProps = BaseProps;

/**
 * Clear a text input field — ⊗ icon, small size, cancel tone.
 *
 * Consistent across URL bars, search fields, and filter inputs.
 */
const ClearInput = (props: ClearInputProps) => (
  <Button
    variant="icon"
    tone="cancel"
    icon="close-circle"
    size="sm"
    {...props}
  />
);

/* ── Cancel ──────────────────────────────────────────────────────────── */

interface CancelProps extends BaseProps {
  /** Label text — defaults to the caller's translated `t('common.cancel')`. */
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Label-only cancel button — no icon, cancel tone.
 *
 * Used in modals and forms alongside a primary CTA.
 */
const Cancel = ({ label, size = 'lg', ...rest }: CancelProps) => (
  <Button variant="text" tone="cancel" label={label} size={size} {...rest} />
);

/* ── SignOut ──────────────────────────────────────────────────────────── */

interface SignOutProps extends BaseProps {
  label: string;
}

/**
 * Sign-out / log-out action — log-out icon + warning tone.
 */
const SignOut = ({ label, ...rest }: SignOutProps) => (
  <Button
    variant="text"
    tone="warning"
    icon="log-out-outline"
    label={label}
    {...rest}
  />
);

/* ── Add ─────────────────────────────────────────────────────────────── */

interface AddProps extends BaseProps {
  size?: 'sm' | 'md' | 'lg';
  iconSize?: number;
}

/**
 * Icon-only add button — plus icon, default tone.
 *
 * For inline "add" affordances (tag editor, stepper, inline inputs).
 * For labeled primary CTAs ("Add Recipe"), use `Button variant="primary"` directly.
 */
const Add = ({ size, iconSize, ...rest }: AddProps) => (
  <Button variant="icon" icon="add" size={size} iconSize={iconSize} {...rest} />
);

/* ── Back ─────────────────────────────────────────────────────────────── */

interface BackProps extends BaseProps {
  /** When provided a visible label is rendered (`variant="text"`);
   *  omit for an icon-only button (`variant="icon"`). */
  label?: string;
  /** Override for overlay contexts (e.g. image headers). Default `"alt"`. */
  tone?: 'alt' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  iconSize?: number;
}

/**
 * Navigate backward — screen-level "← Back", pagination "← Previous",
 * or icon-only week chevrons.
 *
 * Automatically picks `variant="text"` when a label is supplied,
 * `variant="icon"` when it is not.
 */
const Back = ({
  label,
  tone = 'alt',
  size,
  iconSize = 24,
  ...rest
}: BackProps) => (
  <Button
    variant={label ? 'text' : 'icon'}
    tone={tone}
    icon="chevron-back"
    label={label}
    size={size}
    iconSize={iconSize}
    {...rest}
  />
);

/* ── Forward ─────────────────────────────────────────────────────────── */

interface ForwardProps extends BaseProps {
  /** When provided a visible label is rendered (`variant="text"`);
   *  omit for an icon-only button (`variant="icon"`). */
  label?: string;
  /** Override for overlay contexts. Default `"alt"`. */
  tone?: 'alt' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  iconSize?: number;
}

/**
 * Navigate forward — pagination "Next →" or icon-only week chevrons.
 *
 * Mirror of `Back` with `chevron-forward`.
 */
const Forward = ({
  label,
  tone = 'alt',
  size,
  iconSize = 24,
  ...rest
}: ForwardProps) => (
  <Button
    variant={label ? 'text' : 'icon'}
    tone={tone}
    icon="chevron-forward"
    label={label}
    size={size}
    iconSize={iconSize}
    {...rest}
  />
);

/* ── Public API ──────────────────────────────────────────────────────── */

export const ActionButton = {
  Delete,
  Dismiss,
  ClearInput,
  Cancel,
  SignOut,
  Add,
  Back,
  Forward,
} as const;
