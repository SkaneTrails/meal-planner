/**
 * Haptic feedback utilities.
 * Provides simple haptic feedback for button presses and other interactions.
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Light haptic feedback for button taps.
 */
export function hapticLight() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/**
 * Medium haptic feedback for confirmations.
 */
export function hapticMedium() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

/**
 * Heavy haptic feedback for important actions.
 */
export function hapticHeavy() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
}

/**
 * Success haptic feedback.
 */
export function hapticSuccess() {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

/**
 * Warning haptic feedback.
 */
export function hapticWarning() {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}

/**
 * Error haptic feedback.
 */
export function hapticError() {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}

/**
 * Selection haptic feedback (very light, good for toggles).
 */
export function hapticSelection() {
  if (Platform.OS !== 'web') {
    Haptics.selectionAsync();
  }
}
