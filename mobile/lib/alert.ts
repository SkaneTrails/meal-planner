/**
 * Themed in-app alert utilities.
 *
 * Re-exports from alert-context, which renders alerts as themed modals
 * inside the React tree — no native dialogs or browser popups.
 *
 * All existing call sites (`showAlert`, `showNotification`, `showConfirm`)
 * continue to work unchanged via the module-level ref pattern.
 */

export type { AlertButton } from './alert-context';
export { showAlert, showConfirm, showNotification } from './alert-context';
