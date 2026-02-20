/**
 * Detect whether the device has a coarse pointer (touch screen).
 * Returns true on native (always touch) and on web when the primary
 * pointer is coarse (phones, tablets, touch-enabled laptops).
 */

import { Platform } from 'react-native';

let cachedResult: boolean | null = null;

export const useIsTouchDevice = (): boolean => {
  if (Platform.OS !== 'web') return true;
  if (cachedResult !== null) return cachedResult;

  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return true;
  }

  cachedResult = window.matchMedia('(pointer: coarse)').matches;

  return cachedResult;
};
