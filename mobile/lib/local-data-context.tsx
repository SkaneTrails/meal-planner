/**
 * Makes sure the data saved on this device belongs to the signed-in user before anything
 * reads it, and keeps it in sync with the server for every route (tabs, deep links, reloads).
 */

import { useIsRestoring, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSyncPolling } from '@/lib/hooks/use-sync-polling';
import { claimLocalData } from '@/lib/sync/poll-sync-status';

const LocalDataReadyContext = createContext(false);

export const LocalDataProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const isRestoring = useIsRestoring();
  const { user, loading } = useAuth();
  const ownerUid = loading ? undefined : user?.uid;
  const [readyFor, setReadyFor] = useState<string | undefined>(undefined);

  // Claiming before the saved cache is restored would let the restore install another user's data.
  useEffect(() => {
    if (!ownerUid || isRestoring) return;
    try {
      claimLocalData(queryClient);
    } catch (error) {
      console.warn('Checking the local data owner failed:', error);
    }
    setReadyFor(ownerUid);
  }, [ownerUid, isRestoring, queryClient]);

  const ready = !!ownerUid && !isRestoring && readyFor === ownerUid;
  useSyncPolling(ready);

  return (
    <LocalDataReadyContext.Provider value={ready}>
      {children}
    </LocalDataReadyContext.Provider>
  );
};

/**
 * Whether the data on this device has been checked to belong to the signed-in user. Read
 * nothing from the cache until it is true, or the previous user's data shows briefly.
 */
export const useLocalDataReady = (): boolean =>
  useContext(LocalDataReadyContext);
