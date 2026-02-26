/**
 * Tests for tab-bar-scroll — verifies scroll-based tab bar hide/show logic.
 *
 * Real logic tested:
 * - reportScroll: hides bar on scroll-down past threshold, shows on scroll-up
 * - MIN_OFFSET_TO_HIDE: bar stays visible when near top
 * - resetTabBar: resets hidden state and translateY
 * - handleScrollEvent: pre-bound onScroll handler delegates to reportScroll
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('@/lib/tab-bar-scroll');

/**
 * Extract the current numeric value from an Animated.Value.
 * The RN mock stores it in _value.
 */
const getValue = (v: any): number => {
  if (typeof v._value === 'number') return v._value;
  if (typeof v.__getValue === 'function') return v.__getValue();
  return 0;
};

describe('tab-bar-scroll', () => {
  let reportScroll: typeof import('@/lib/tab-bar-scroll').reportScroll;
  let resetTabBar: typeof import('@/lib/tab-bar-scroll').resetTabBar;
  let handleScrollEvent: typeof import('@/lib/tab-bar-scroll').handleScrollEvent;
  let tabBarTranslateY: any;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@/lib/tab-bar-scroll');
    reportScroll = mod.reportScroll;
    resetTabBar = mod.resetTabBar;
    handleScrollEvent = mod.handleScrollEvent;
    tabBarTranslateY = mod.tabBarTranslateY;
  });

  it('starts with translateY at 0 (visible)', () => {
    expect(getValue(tabBarTranslateY)).toBe(0);
  });

  it('hides bar when scrolling down past threshold and MIN_OFFSET_TO_HIDE', () => {
    reportScroll(0);
    reportScroll(100);

    // Spring animation targets a positive translateY (off-screen)
    expect(getValue(tabBarTranslateY)).toBeGreaterThan(0);
  });

  it('does NOT hide bar when scroll position is below MIN_OFFSET_TO_HIDE', () => {
    reportScroll(0);
    reportScroll(30);

    expect(getValue(tabBarTranslateY)).toBe(0);
  });

  it('shows bar when scrolling up past threshold while hidden', () => {
    // First hide it
    reportScroll(0);
    reportScroll(100);
    expect(getValue(tabBarTranslateY)).toBeGreaterThan(0);

    // Scroll up
    reportScroll(80);
    expect(getValue(tabBarTranslateY)).toBe(0);
  });

  it('does not change when scrolling down while already hidden', () => {
    reportScroll(0);
    reportScroll(100);
    const hiddenValue = getValue(tabBarTranslateY);

    reportScroll(200);
    expect(getValue(tabBarTranslateY)).toBe(hiddenValue);
  });

  it('does not change when scrolling up while already visible', () => {
    reportScroll(100);
    reportScroll(80);
    expect(getValue(tabBarTranslateY)).toBe(0);

    reportScroll(60);
    expect(getValue(tabBarTranslateY)).toBe(0);
  });

  describe('resetTabBar', () => {
    it('resets hidden bar to visible', () => {
      reportScroll(0);
      reportScroll(100);
      expect(getValue(tabBarTranslateY)).toBeGreaterThan(0);

      resetTabBar();
      expect(getValue(tabBarTranslateY)).toBe(0);
    });

    it('is a no-op when bar is already visible', () => {
      const before = getValue(tabBarTranslateY);
      resetTabBar();
      expect(getValue(tabBarTranslateY)).toBe(before);
    });
  });

  describe('handleScrollEvent', () => {
    it('delegates to reportScroll with contentOffset.y', () => {
      const event = {
        nativeEvent: { contentOffset: { y: 100 } },
      } as any;

      // Start from 0 so the 100 is a scroll-down
      reportScroll(0);
      handleScrollEvent(event);

      expect(getValue(tabBarTranslateY)).toBeGreaterThan(0);
    });
  });
});
