import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', async () => ({
  api: { getSyncStatus: vi.fn() },
  ApiClientError: (await import('@/lib/api/client')).ApiClientError,
}));
vi.mock('@/lib/auth-scope', () => ({ currentUserId: vi.fn(() => 'user-1') }));
vi.mock('@/lib/grocery-context', () => ({
  refreshGroceryFromServer: vi.fn().mockResolvedValue(undefined),
  resetGroceryForNewScope: vi.fn(),
}));

import { api } from '@/lib/api';
import { ApiClientError } from '@/lib/api/client';
import { currentUserId } from '@/lib/auth-scope';
import {
  refreshGroceryFromServer,
  resetGroceryForNewScope,
} from '@/lib/grocery-context';
import type { SyncKind, SyncStatus } from '@/lib/types';
import { claimLocalData, MAX_SYNC_AGE, pollSyncStatus } from '../poll-sync-status';
import { type SeenState, syncSeen } from '../sync-seen';

const KINDS: SyncKind[] = ['recipes', 'meal_plan', 'grocery', 'settings'];

const status = (overrides: Partial<SyncStatus> = {}): SyncStatus => ({
  scope: 'member:hh-1',
  recipes: 'r1',
  meal_plan: 'm1',
  grocery: 'g1',
  settings: 's1',
  ...overrides,
});

const seenAll = (s: SyncStatus = status(), refreshedAt = Date.now()): SeenState => ({
  ownerUid: 'user-1',
  scope: s.scope,
  seen: { recipes: s.recipes, meal_plan: s.meal_plan, grocery: s.grocery, settings: s.settings },
  refreshedAt: Object.fromEntries(KINDS.map((kind) => [kind, refreshedAt])),
});

const makeClient = (seen?: SeenState) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (seen) syncSeen.set(client, seen);
  vi.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
  vi.spyOn(client, 'resetQueries').mockResolvedValue(undefined);
  vi.spyOn(client, 'removeQueries');
  return client;
};

const invalidatedKeys = (client: QueryClient) =>
  vi.mocked(client.invalidateQueries).mock.calls.map(([filters]) => filters?.queryKey);

describe('claimLocalData', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps the data of the same user', () => {
    const client = makeClient(seenAll());

    claimLocalData(client);

    expect(client.removeQueries).not.toHaveBeenCalled();
  });

  it("drops another user's cached data and takes over", () => {
    const client = makeClient({ ...seenAll(), ownerUid: 'someone-else' });
    client.setQueryData(['recipes', 'all', {}], { pages: [] });

    const state = claimLocalData(client);

    expect(client.getQueryData(['recipes', 'all', {}])).toBeUndefined();
    expect(state).toEqual({ ownerUid: 'user-1', scope: null, seen: {} });
    expect(syncSeen.get(client)).toEqual(state);
  });
});

describe('pollSyncStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(currentUserId).mockReturnValue('user-1');
  });

  it('refetches nothing when no version changed', async () => {
    vi.mocked(api.getSyncStatus).mockResolvedValue(status());
    const client = makeClient(seenAll());

    await pollSyncStatus(client);

    expect(client.invalidateQueries).not.toHaveBeenCalled();
    expect(refreshGroceryFromServer).not.toHaveBeenCalled();
  });

  it('refreshes only the kinds whose version changed and remembers them', async () => {
    vi.mocked(api.getSyncStatus).mockResolvedValue(status({ grocery: 'g2', meal_plan: 'm2' }));
    const client = makeClient(seenAll());

    await pollSyncStatus(client);

    expect(refreshGroceryFromServer).toHaveBeenCalledOnce();
    expect(invalidatedKeys(client)).toEqual([['meal-plans']]);
    expect(syncSeen.get(client).seen).toEqual(seenAll(status({ grocery: 'g2', meal_plan: 'm2' })).seen);
  });

  it('refreshes a kind whose last refresh is too old, even with an unchanged version', async () => {
    vi.mocked(api.getSyncStatus).mockResolvedValue(status());
    const client = makeClient(seenAll(status(), Date.now() - MAX_SYNC_AGE - 1));

    await pollSyncStatus(client);

    expect(refreshGroceryFromServer).toHaveBeenCalledOnce();
    expect(syncSeen.get(client).refreshedAt?.grocery).toBeGreaterThan(Date.now() - 1000);
  });

  it('refetches the full recipe list in the background when recipes changed', async () => {
    vi.mocked(api.getSyncStatus).mockResolvedValue(status({ recipes: 'r2' }));
    const client = makeClient(seenAll());

    await pollSyncStatus(client);

    expect(client.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ['recipes', 'all'], refetchType: 'all' },
      { throwOnError: true },
    );
  });

  describe('shown recipe queries', () => {
    const showRecipe = async (client: QueryClient, queryFn: () => Promise<unknown>) => {
      const observer = new QueryObserver(client, {
        queryKey: ['recipes', 'detail', 'r1'],
        queryFn,
        staleTime: Number.POSITIVE_INFINITY,
      });
      const unsubscribe = observer.subscribe(() => {});
      await vi.waitFor(() => expect(client.getQueryData(['recipes', 'detail', 'r1'])).toBeDefined());
      return unsubscribe;
    };

    it('keeps the recipe version for retry when a shown recipe failed to refresh', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(api.getSyncStatus).mockResolvedValue(status({ recipes: 'r2' }));
      const client = makeClient(seenAll());
      const queryFn = vi.fn().mockResolvedValueOnce({ id: 'r1' }).mockRejectedValue(new Error('500'));
      const unsubscribe = await showRecipe(client, queryFn);

      await pollSyncStatus(client);

      expect(syncSeen.get(client).seen.recipes).toBe('r1');
      unsubscribe();
    });

    it('does not count a shown recipe that was deleted (404) as a failed sync', async () => {
      vi.mocked(api.getSyncStatus).mockResolvedValue(status({ recipes: 'r2' }));
      const client = makeClient(seenAll());
      const queryFn = vi
        .fn()
        .mockResolvedValueOnce({ id: 'r1' })
        .mockRejectedValue(new ApiClientError('Not found', 404));
      const unsubscribe = await showRecipe(client, queryFn);

      await pollSyncStatus(client);

      expect(syncSeen.get(client).seen.recipes).toBe('r2');
      unsubscribe();
    });
  });

  it('does not remember a version whose refresh failed, so it is retried', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(api.getSyncStatus).mockResolvedValue(status({ grocery: 'g2', settings: 's2' }));
    vi.mocked(refreshGroceryFromServer).mockRejectedValueOnce(new Error('busy'));
    const client = makeClient(seenAll());

    await pollSyncStatus(client);

    expect(syncSeen.get(client).seen.grocery).toBe('g1');
    expect(syncSeen.get(client).seen.settings).toBe('s2');
  });

  it('refreshes every kind once on a device that never synced', async () => {
    vi.mocked(api.getSyncStatus).mockResolvedValue(status({ settings: null }));
    const client = makeClient({ ownerUid: 'user-1', scope: null, seen: {} });

    await pollSyncStatus(client);

    expect(refreshGroceryFromServer).toHaveBeenCalledOnce();
    expect(invalidatedKeys(client)).toEqual(
      expect.arrayContaining([['meal-plans'], ['admin', 'settings'], ['recipes', 'all']]),
    );
  });

  it("reloads everything, including the old household's grocery list, when the scope changed", async () => {
    vi.mocked(api.getSyncStatus).mockResolvedValue(status({ scope: 'member:hh-2' }));
    const client = makeClient(seenAll());

    await pollSyncStatus(client);

    expect(resetGroceryForNewScope).toHaveBeenCalledOnce();
    expect(client.resetQueries).toHaveBeenCalled();
    expect(refreshGroceryFromServer).toHaveBeenCalledOnce();
    expect(syncSeen.get(client).scope).toBe('member:hh-2');
  });

  it('checks the current user again when access was revoked (403)', async () => {
    vi.mocked(api.getSyncStatus).mockRejectedValue(new ApiClientError('Forbidden', 403));
    const client = makeClient(seenAll());

    await pollSyncStatus(client);

    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin', 'currentUser'] });
  });

  it('discards the result when another user signed in meanwhile', async () => {
    vi.mocked(api.getSyncStatus).mockImplementation(async () => {
      vi.mocked(currentUserId).mockReturnValue('user-2');
      return status({ grocery: 'g2' });
    });
    const client = makeClient(seenAll());

    await pollSyncStatus(client);

    expect(refreshGroceryFromServer).not.toHaveBeenCalled();
    expect(syncSeen.get(client).seen.grocery).toBe('g1');
  });

  it('never throws when the server cannot be reached', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(api.getSyncStatus).mockRejectedValue(new Error('offline'));

    await expect(pollSyncStatus(makeClient(seenAll()))).resolves.toBeUndefined();
  });

  it('shares one poll between concurrent calls', async () => {
    vi.mocked(api.getSyncStatus).mockResolvedValue(status());
    const client = makeClient(seenAll());

    await Promise.all([pollSyncStatus(client), pollSyncStatus(client)]);

    expect(api.getSyncStatus).toHaveBeenCalledOnce();
  });
});
