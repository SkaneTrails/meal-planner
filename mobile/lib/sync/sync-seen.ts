import type { QueryClient } from '@tanstack/react-query';
import type { SyncKind } from '@/lib/types';

/**
 * Kept in the query cache, so it is saved in the same snapshot as the data it describes:
 * after a restart the remembered versions never claim data newer than what was restored.
 */
const SEEN_KEY = ['sync', 'seen'] as const;

/** The versions of each data kind this device last synced, when, and whose they are. */
export interface SeenState {
  ownerUid: string | null;
  /** Role and household at the last sync, or null before the first one. */
  scope: string | null;
  seen: Partial<Record<SyncKind, string | null>>;
  refreshedAt?: Partial<Record<SyncKind, number>>;
}

const NOTHING_SEEN: SeenState = { ownerUid: null, scope: null, seen: {} };

export const syncSeen = {
  get(queryClient: QueryClient): SeenState {
    return queryClient.getQueryData<SeenState>(SEEN_KEY) ?? NOTHING_SEEN;
  },

  set(queryClient: QueryClient, state: SeenState): void {
    queryClient.setQueryData(SEEN_KEY, state);
  },
};
