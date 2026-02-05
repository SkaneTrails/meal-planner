/**
 * Cross-platform alert utilities.
 * Uses native Alert on iOS/Android, window.confirm/alert on web.
 *
 * **Web Platform Limitations:**
 * - `window.confirm` only supports binary (OK/Cancel) choices
 * - When 3+ buttons are provided, only the first cancel and first action button are used
 * - Single-button alerts don't trigger onPress (differs from native behavior)
 * - React Native's Alert.alert on iOS supports up to 3 buttons
 */

import { Alert, Platform } from 'react-native';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

/**
 * Show a cross-platform alert dialog.
 * On native platforms, uses React Native's Alert.alert.
 * On web, uses window.confirm for two-button alerts or window.alert for single-button.
 *
 * Note: On web, only 2 buttons are supported (cancel + action). Additional buttons are ignored.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void {
  if (Platform.OS === 'web') {
    // Web fallback using browser dialogs
    if (!buttons || buttons.length === 0) {
      // Simple notification
      window.alert(message ? `${title}\n\n${message}` : title);
      return;
    }

    if (buttons.length === 1) {
      // Single button - just an alert. Browser alert() has no button callback,
      // so we do not invoke onPress here to match native behavior where
      // the callback fires after the user taps the button.
      window.alert(message ? `${title}\n\n${message}` : title);
      return;
    }

    // Two buttons - use confirm dialog
    // Find the action button (non-cancel) and cancel button
    // Fallback to first button if all are cancel-style
    const cancelButton = buttons.find(b => b.style === 'cancel');
    const actionButton = buttons.find(b => b.style !== 'cancel') || buttons[0];

    const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
    if (confirmed) {
      actionButton?.onPress?.();
    } else {
      cancelButton?.onPress?.();
    }
  } else {
    // Native platforms - use React Native Alert
    Alert.alert(title, message, buttons);
  }
}

/**
 * Show a simple notification alert (single OK button).
 */
export function showNotification(title: string, message?: string): void {
  showAlert(title, message, [{ text: 'OK' }]);
}

/**
 * Show a confirmation dialog and return a promise.
 * Resolves to true if confirmed, false if cancelled.
 *
 * @example
 * const confirmed = await showConfirm('Delete?', 'Are you sure?');
 * if (confirmed) {
 *   // User clicked OK
 * }
 */
export function showConfirm(title: string, message?: string): Promise<boolean> {
  return new Promise(resolve => {
    showAlert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'OK', onPress: () => resolve(true) },
    ]);
  });
}
