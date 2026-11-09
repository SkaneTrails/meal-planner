import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper } from '@/test/helpers';

const appStateListeners: ((state: string) => void)[] = [];
vi.mock('react-native', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-native')>()),
  AppState: {
    addEventListener: (_: string, listener: (state: string) => void) => {
      appStateListeners.push(listener);
      return { remove: vi.fn() };
    },
  },
}));

vi.mock('expo-router', async () => {
  const { useEffect } = await import('react');
  return { useFocusEffect: (effect: () => () => void) => useEffect(effect, [effect]) };
});

vi.mock('@/lib/sync/poll-sync-status', () => ({
  pollSyncStatus: vi.fn().mockResolvedValue(undefined),
}));

import { pollSyncStatus } from '@/lib/sync/poll-sync-status';
import {
  GROCERY_POLL_INTERVAL,
  SYNC_POLL_INTERVAL,
  useFocusedSyncPolling,
  useSyncPolling,
} from '../use-sync-polling';

describe('useSyncPolling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appStateListeners.length = 0;
  });

  it('polls on mount, on returning to the foreground and on an interval', () => {
    vi.useFakeTimers();
    renderHook(() => useSyncPolling(true), { wrapper: createQueryWrapper() });
    expect(pollSyncStatus).toHaveBeenCalledTimes(1);

    act(() => appStateListeners.forEach((listener) => listener('active')));
    expect(pollSyncStatus).toHaveBeenCalledTimes(2);

    act(() => vi.advanceTimersByTime(SYNC_POLL_INTERVAL));
    expect(pollSyncStatus).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  it('does nothing while disabled', () => {
    renderHook(() => useSyncPolling(false), { wrapper: createQueryWrapper() });

    expect(pollSyncStatus).not.toHaveBeenCalled();
  });
});

describe('useFocusedSyncPolling', () => {
  beforeEach(() => vi.clearAllMocks());

  it('polls often while the screen is focused and stops when it is not', () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useFocusedSyncPolling(), {
      wrapper: createQueryWrapper(),
    });
    act(() => vi.advanceTimersByTime(GROCERY_POLL_INTERVAL * 2));
    expect(pollSyncStatus).toHaveBeenCalledTimes(3);

    unmount();
    act(() => vi.advanceTimersByTime(GROCERY_POLL_INTERVAL * 2));
    expect(pollSyncStatus).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });
});
