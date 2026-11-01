import type { QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { currentUserId } from '@/lib/auth-scope';
import { refreshGroceryFromServer } from '@/lib/grocery-context';
import type { SyncKind, SyncStatus } from '@/lib/types';
import { type SeenState, syncSeen } from './sync-seen';

const SYNC_KINDS: SyncKind[] = ['recipes', 'meal_plan', 'grocery', 'settings'];

const refetch =
  (...queryKeys: readonly (readonly string[])[]) =>
  async (queryClient: QueryClient) => {
    await Promise.all(
      queryKeys.map((queryKey) =>
        queryClient.invalidateQueries(
          { queryKey, refetchType: 'all' },
          { throwOnError: true },
        ),
      ),
    );
  };

/**
 * Recipes: the full list is refetched in the background so the recipe screens open with
 * fresh data; other recipe queries (details, search pages) refetch when next shown.
 */
async function refreshRecipes(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: ['recipes'],
      predicate: (query) => query.queryKey[1] !== 'all',
    }),
    queryClient.invalidateQueries(
      { queryKey: ['recipes', 'all'], refetchType: 'all' },
      { throwOnError: true },
    ),
  ]);
}

/** How to bring each kind up to date; rejects if that failed, so the version is not remembered. */
const REFRESH_BY_KIND: Record<
  SyncKind,
  (queryClient: QueryClient) => Promise<void>
> = {
  recipes: refreshRecipes,
  meal_plan: refetch(['meal-plans']),
  grocery: () => refreshGroceryFromServer(),
  settings: refetch(
    ['admin', 'settings'],
    ['admin', 'itemsAtHome'],
    ['admin', 'favorites'],
  ),
};

/**
 * Make sure the data on this device belongs to the signed-in user, and return what was
 * last synced for them. Another (or an unknown) owner's cached data is dropped first, so
 * it never shows for this user. Needs no network.
 */
export async function claimLocalData(
  queryClient: QueryClient,
): Promise<SeenState> {
  const ownerUid = currentUserId();
  const state = await syncSeen.get();
  if (state.ownerUid === ownerUid) return state;

  queryClient.removeQueries();
  const fresh: SeenState = { ownerUid, scope: null, seen: {} };
  await syncSeen.set(fresh);
  return fresh;
}

let inFlight: { ownerUid: string; promise: Promise<void> } | null = null;

/**
 * Ask the server what changed and refetch only that: one small request when nothing did.
 *
 * Versions are only compared for equality, and a version is remembered only after its
 * refresh succeeded, so a failed refresh is retried at the next poll. Concurrent calls
 * share one poll; a result that arrives after another user signed in is discarded.
 * Never throws: the app keeps working from its local copy offline.
 */
export function pollSyncStatus(queryClient: QueryClient): Promise<void> {
  const ownerUid = currentUserId();
  if (inFlight?.ownerUid === ownerUid) return inFlight.promise;

  const promise = runPoll(queryClient, ownerUid).finally(() => {
    if (inFlight?.promise === promise) inFlight = null;
  });
  inFlight = { ownerUid, promise };
  return promise;
}

async function runPoll(
  queryClient: QueryClient,
  ownerUid: string,
): Promise<void> {
  const signedOut = () => currentUserId() !== ownerUid;
  try {
    let state = await claimLocalData(queryClient);
    const status: SyncStatus = await api.getSyncStatus();
    if (signedOut()) return;

    // Same user, different access (moved household, role changed): no data version shows that.
    if (state.scope !== null && state.scope !== status.scope) {
      await queryClient.resetQueries();
      state = { ownerUid, scope: status.scope, seen: {} };
    }

    // A kind never synced on this device is refreshed once, even if the server has no version yet.
    const changed = SYNC_KINDS.filter(
      (kind) => !(kind in state.seen) || status[kind] !== state.seen[kind],
    );
    const refreshed: Partial<Record<SyncKind, string | null>> = {};
    await Promise.all(
      changed.map(async (kind) => {
        try {
          await REFRESH_BY_KIND[kind](queryClient);
          refreshed[kind] = status[kind];
        } catch (error) {
          console.warn(`Refreshing ${kind} failed, will retry`, error);
        }
      }),
    );

    const dirty =
      state.scope !== status.scope || Object.keys(refreshed).length > 0;
    if (dirty && !signedOut()) {
      await syncSeen.set({
        ownerUid,
        scope: status.scope,
        seen: { ...state.seen, ...refreshed },
      });
    }
  } catch (error) {
    console.warn('Sync status poll failed:', error);
  }
}
