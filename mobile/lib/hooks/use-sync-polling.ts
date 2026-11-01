import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { claimLocalData, pollSyncStatus } from '@/lib/sync/poll-sync-status';

export const SYNC_POLL_INTERVAL = 5 * 60 * 1000;
export const GROCERY_POLL_INTERVAL = 15 * 1000;

/**
 * Whether the data on this device has been checked to belong to the signed-in user (another
 * user's is dropped first). Render nothing from the cache until it is true, or the previous
 * user's data shows briefly. False while signed out.
 */
export function useLocalDataReady(ownerUid: string | undefined): boolean {
  const queryClient = useQueryClient();
  const [readyFor, setReadyFor] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!ownerUid) return;
    let cancelled = false;
    claimLocalData(queryClient)
      .catch((error) =>
        console.warn('Checking the local data owner failed:', error),
      )
      .finally(() => {
        if (!cancelled) setReadyFor(ownerUid);
      });
    return () => {
      cancelled = true;
    };
  }, [ownerUid, queryClient]);

  return !!ownerUid && readyFor === ownerUid;
}

/**
 * Check what changed on the server: once mounted, when the app returns to the foreground,
 * and every few minutes while it is open. Mount once, for signed-in users only.
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
