/**
 * Tests for tab-bar-scroll — verifies all exports are no-ops
 * (tab bar no longer hides on scroll).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('@/lib/tab-bar-scroll');

describe('tab-bar-scroll', () => {
  let reportScroll: typeof import('@/lib/tab-bar-scroll').reportScroll;
  let resetTabBar: typeof import('@/lib/tab-bar-scroll').resetTabBar;
  let handleScrollEvent: typeof import('@/lib/tab-bar-scroll').handleScrollEvent;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@/lib/tab-bar-scroll');
    reportScroll = mod.reportScroll;
    resetTabBar = mod.resetTabBar;
    handleScrollEvent = mod.handleScrollEvent;
  });

  it('reportScroll is a no-op', () => {
    expect(() => {
      reportScroll(0);
      reportScroll(100);
    }).not.toThrow();
  });

  it('handleScrollEvent is a no-op', () => {
    const event = {
      nativeEvent: { contentOffset: { y: 100 } },
    } as any;

    expect(() => handleScrollEvent(event)).not.toThrow();
  });

  it('resetTabBar is a no-op', () => {
    expect(() => resetTabBar()).not.toThrow();
  });
});
