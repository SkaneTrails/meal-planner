/**
 * Tab bar scroll module — scroll-based hide/show has been removed.
 * All exports are kept as no-ops so existing call sites don't break.
 */

import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/** @deprecated Tab bar no longer hides on scroll. No-op. */
export const reportScroll = (_y: number) => {};

/** @deprecated Tab bar no longer hides on scroll. No-op. */
export const resetTabBar = () => {};

/** @deprecated Tab bar no longer hides on scroll. No-op. */
export const handleScrollEvent = (
  _e: NativeSyntheticEvent<NativeScrollEvent>,
) => {};
