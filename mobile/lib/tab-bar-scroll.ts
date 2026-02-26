/**
 * Module-level singleton for tab bar scroll tracking.
 *
 * Screens call `reportScroll(y)` from their `onScroll` handler.
 * FloatingTabBar reads `tabBarTranslateY` to animate show/hide.
 *
 * The bar hides when scrolling down and reappears when scrolling up.
 * Switching tabs resets the bar to visible (call `resetTabBar()`).
 */

import {
  Animated,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { layout, spacing } from '@/lib/theme';

const TOTAL_BAR_HEIGHT =
  layout.tabBar.height + layout.tabBar.bottomOffset + spacing.sm;
const SCROLL_THRESHOLD = spacing.sm;
const MIN_OFFSET_TO_HIDE = 50;

const SPRING_CONFIG = {
  useNativeDriver: true,
  tension: 80,
  friction: 12,
} as const;

interface TabBarState {
  translateY: Animated.Value;
  lastY: number;
  hidden: boolean;
}

const state: TabBarState = {
  translateY: new Animated.Value(0),
  lastY: 0,
  hidden: false,
};

const animateTo = (toValue: number) =>
  Animated.spring(state.translateY, { toValue, ...SPRING_CONFIG }).start();

export const tabBarTranslateY = state.translateY;

export const reportScroll = (y: number) => {
  const delta = y - state.lastY;

  if (delta > SCROLL_THRESHOLD && !state.hidden && y > MIN_OFFSET_TO_HIDE) {
    state.hidden = true;
    animateTo(TOTAL_BAR_HEIGHT);
  } else if (delta < -SCROLL_THRESHOLD && state.hidden) {
    state.hidden = false;
    animateTo(0);
  }

  state.lastY = y;
};

export const resetTabBar = () => {
  if (!state.hidden) return;
  state.hidden = false;
  state.lastY = 0;
  animateTo(0);
};

/** Pre-bound onScroll handler for ScrollView / FlatList. */
export const handleScrollEvent = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
  reportScroll(e.nativeEvent.contentOffset.y);
