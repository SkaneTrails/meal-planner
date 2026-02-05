/**
 * Cross-platform alert utilities.
 * Uses native Alert on iOS/Android, window.confirm/alert on web.
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
      // Single button - just an alert
      window.alert(message ? `${title}\n\n${message}` : title);
      buttons[0].onPress?.();
      return;
    }

    // Two buttons - use confirm dialog
    // Find the action button (non-cancel) and cancel button
    const cancelButton = buttons.find(b => b.style === 'cancel');
    const actionButton = buttons.find(b => b.style !== 'cancel') || buttons[buttons.length - 1];

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
 */
export function showConfirm(title: string, message?: string): Promise<boolean> {
  return new Promise(resolve => {
    showAlert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'OK', onPress: () => resolve(true) },
    ]);
  });
}
