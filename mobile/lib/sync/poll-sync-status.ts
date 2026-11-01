import type { QueryClient } from '@tanstack/react-query';
import { ApiClientError, api } from '@/lib/api';
import { currentUserId } from '@/lib/auth-scope';
import {
  refreshGroceryFromServer,
  resetGroceryForNewScope,
} from '@/lib/grocery-context';
import type { SyncKind, SyncStatus } from '@/lib/types';
import { type SeenState, syncSeen } from './sync-seen';

const SYNC_KINDS: SyncKind[] = ['recipes', 'meal_plan', 'grocery', 'settings'];

/** Refresh every kind at least this often, repairing a change whose version bump was lost. */
export const MAX_SYNC_AGE = 6 * 60 * 60 * 1000;

const isNotFound = (error: unknown) =>
  error instanceof ApiClientError && error.status === 404;

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
 * Recipes: the full list is refetched in the background so the recipe screens open with fresh
 * data; other shown recipe queries are refetched too and inactive ones refetch when next shown.
 * A shown recipe that was deleted (404) is not a failed sync.
 */
async function refreshRecipes(queryClient: QueryClient): Promise<void> {
  const others = (query: { queryKey: readonly unknown[] }) =>
    query.queryKey[1] !== 'all';
  await queryClient.invalidateQueries({
    queryKey: ['recipes'],
    predicate: others,
    refetchType: 'none',
  });
  const active = queryClient
    .getQueryCache()
    .findAll({ queryKey: ['recipes'], type: 'active', predicate: others });
  await Promise.all([
    queryClient.invalidateQueries(
      { queryKey: ['recipes', 'all'], refetchType: 'all' },
      { throwOnError: true },
    ),
    ...active.map((query) =>
      query.fetch().catch((error: unknown) => {
        if (!isNotFound(error)) throw error;
      }),
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
 * it never shows for this user. Call only after the saved cache was restored. Needs no network.
 */
export function claimLocalData(queryClient: QueryClient): SeenState {
  const ownerUid = currentUserId();
  const state = syncSeen.get(queryClient);
  if (state.ownerUid === ownerUid) return state;

  queryClient.removeQueries();
  const fresh: SeenState = { ownerUid, scope: null, seen: {} };
  syncSeen.set(queryClient, fresh);
  return fresh;
}

let inFlight: { ownerUid: string; promise: Promise<void> } | null = null;

/**
 * Ask the server what changed and refetch only that: one small request when nothing did.
 *
 * Versions are only compared for equality, and a version is remembered only after its
 * refresh succeeded, so a failed refresh is retried at the next poll. Concurrent calls
 * share one poll; a result that arrives after another user signed in is discarded.
 * Never throws: the app keeps working from its local copy offline. A 403 (access revoked)
 * makes the current user be checked again, so the access gate sees it.
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
    let state = claimLocalData(queryClient);
    const status: SyncStatus = await api.getSyncStatus();
    if (signedOut()) return;

    // Same user, different access (moved household, role changed): no data version shows that.
    if (state.scope !== null && state.scope !== status.scope) {
      resetGroceryForNewScope();
      await queryClient.resetQueries();
      state = { ownerUid, scope: status.scope, seen: {} };
    }

    // A kind never synced on this device is refreshed once, even if the server has no version yet.
    const now = Date.now();
    const changed = SYNC_KINDS.filter(
      (kind) =>
        !(kind in state.seen) ||
        status[kind] !== state.seen[kind] ||
        now - (state.refreshedAt?.[kind] ?? 0) > MAX_SYNC_AGE,
    );
    const refreshed: Partial<Record<SyncKind, string | null>> = {};
    const refreshedAt: Partial<Record<SyncKind, number>> = {};
    await Promise.all(
      changed.map(async (kind) => {
        try {
          await REFRESH_BY_KIND[kind](queryClient);
          refreshed[kind] = status[kind];
          refreshedAt[kind] = now;
        } catch (error) {
          console.warn(`Refreshing ${kind} failed, will retry`, error);
        }
      }),
    );

    const dirty =
      state.scope !== status.scope || Object.keys(refreshed).length > 0;
    if (dirty && !signedOut()) {
      syncSeen.set(queryClient, {
        ownerUid,
        scope: status.scope,
        seen: { ...state.seen, ...refreshed },
        refreshedAt: { ...state.refreshedAt, ...refreshedAt },
      });
    }
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 403) {
      await queryClient.invalidateQueries({
        queryKey: ['admin', 'currentUser'],
      });
      return;
    }
    console.warn('Sync status poll failed:', error);
  }
}
