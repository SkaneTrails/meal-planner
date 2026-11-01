import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { pollSyncStatus } from '@/lib/sync/poll-sync-status';

export const SYNC_POLL_INTERVAL = 5 * 60 * 1000;
export const GROCERY_POLL_INTERVAL = 15 * 1000;

/**
 * Check what changed on the server: once mounted, when the app returns to the foreground,
 * and every few minutes while it is open. Mounted once, by LocalDataProvider.
 */
export function useSyncPolling(enabled = true): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    void pollSyncStatus(queryClient);
    const timer = setInterval(
      () => void pollSyncStatus(queryClient),
      SYNC_POLL_INTERVAL,
    );
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void pollSyncStatus(queryClient);
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [enabled, queryClient]);
}

/** Poll more often while a screen with data edited on several devices (the grocery list) is focused. */
export function useFocusedSyncPolling(interval = GROCERY_POLL_INTERVAL): void {
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      void pollSyncStatus(queryClient);
      const timer = setInterval(
        () => void pollSyncStatus(queryClient),
        interval,
      );
      return () => clearInterval(timer);
    }, [interval, queryClient]),
  );
}
