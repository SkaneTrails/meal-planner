import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({ api: { getSyncStatus: vi.fn() } }));
vi.mock('@/lib/auth-scope', () => ({ currentUserId: vi.fn(() => 'user-1') }));
vi.mock('@/lib/grocery-context', () => ({
  refreshGroceryFromServer: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../sync-seen', () => ({
  syncSeen: { get: vi.fn(), set: vi.fn().mockResolvedValue(undefined) },
}));

import { api } from '@/lib/api';
import { currentUserId } from '@/lib/auth-scope';
import { refreshGroceryFromServer } from '@/lib/grocery-context';
import type { SyncStatus } from '@/lib/types';
import { claimLocalData, pollSyncStatus } from '../poll-sync-status';
import { type SeenState, syncSeen } from '../sync-seen';

const status = (overrides: Partial<SyncStatus> = {}): SyncStatus => ({
  scope: 'member:hh-1',
  recipes: 'r1',
  meal_plan: 'm1',
  grocery: 'g1',
  settings: 's1',
  ...overrides,
});

const seenAll = (s: SyncStatus = status()): SeenState => ({
  ownerUid: 'user-1',
  scope: s.scope,
  seen: { recipes: s.recipes, meal_plan: s.meal_plan, grocery: s.grocery, settings: s.settings },
});

const makeClient = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
  vi.spyOn(client, 'resetQueries').mockResolvedValue(undefined);
  vi.spyOn(client, 'removeQueries');
  return client;
};

const invalidatedKeys = (client: QueryClient) =>
  vi.mocked(client.invalidateQueries).mock.calls.map(([filters]) => filters?.queryKey);

describe('claimLocalData', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps the data of the same user', async () => {
    vi.mocked(syncSeen.get).mockResolvedValue(seenAll());
    const client = makeClient();

    await claimLocalData(client);

    expect(client.removeQueries).not.toHaveBeenCalled();
  });

  it("drops another user's cached data and takes over", async () => {
    vi.mocked(syncSeen.get).mockResolvedValue({ ...seenAll(), ownerUid: 'someone-else' });
    const client = makeClient();

    const state = await claimLocalData(client);

    expect(client.removeQueries).toHaveBeenCalled();
    expect(state).toEqual({ ownerUid: 'user-1', scope: null, seen: {} });
    expect(syncSeen.set).toHaveBeenCalledWith(state);
  });
});

describe('pollSyncStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(currentUserId).mockReturnValue('user-1');
  });

  it('refetches nothing when no version changed', async () => {
    vi.mocked(syncSeen.get).mockResolvedValue(seenAll());
    vi.mocked(api.getSyncStatus).mockResolvedValue(status());
    const client = makeClient();

    await pollSyncStatus(client);

    expect(client.invalidateQueries).not.toHaveBeenCalled();
    expect(refreshGroceryFromServer).not.toHaveBeenCalled();
    expect(syncSeen.set).not.toHaveBeenCalled();
  });

  it('refreshes only the kinds whose version changed and remembers them', async () => {
    vi.mocked(syncSeen.get).mockResolvedValue(seenAll());
    vi.mocked(api.getSyncStatus).mockResolvedValue(status({ grocery: 'g2', meal_plan: 'm2' }));
    const client = makeClient();

    await pollSyncStatus(client);

    expect(refreshGroceryFromServer).toHaveBeenCalledOnce();
    expect(invalidatedKeys(client)).toEqual([['meal-plans']]);
    expect(syncSeen.set).toHaveBeenCalledWith(seenAll(status({ grocery: 'g2', meal_plan: 'm2' })));
  });

  it('refetches the full recipe list in the background when recipes changed', async () => {
    vi.mocked(syncSeen.get).mockResolvedValue(seenAll());
    vi.mocked(api.getSyncStatus).mockResolvedValue(status({ recipes: 'r2' }));
    const client = makeClient();

    await pollSyncStatus(client);

    expect(client.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ['recipes', 'all'], refetchType: 'all' },
      { throwOnError: true },
    );
  });

  it('does not remember a version whose refresh failed, so it is retried', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(syncSeen.get).mockResolvedValue(seenAll());
    vi.mocked(api.getSyncStatus).mockResolvedValue(status({ grocery: 'g2', settings: 's2' }));
    vi.mocked(refreshGroceryFromServer).mockRejectedValueOnce(new Error('busy'));
    const client = makeClient();

    await pollSyncStatus(client);

    const saved = vi.mocked(syncSeen.set).mock.calls[0][0];
    expect(saved.seen.grocery).toBe('g1');
    expect(saved.seen.settings).toBe('s2');
  });

  it('refreshes every kind once on a device that never synced', async () => {
    vi.mocked(syncSeen.get).mockResolvedValue({ ownerUid: 'user-1', scope: null, seen: {} });
    vi.mocked(api.getSyncStatus).mockResolvedValue(status({ settings: null }));
    const client = makeClient();

    await pollSyncStatus(client);

    expect(refreshGroceryFromServer).toHaveBeenCalledOnce();
    expect(invalidatedKeys(client)).toEqual(
      expect.arrayContaining([['meal-plans'], ['admin', 'settings'], ['recipes', 'all']]),
    );
  });

  it('reloads everything when the household or role changed', async () => {
    vi.mocked(syncSeen.get).mockResolvedValue(seenAll());
    vi.mocked(api.getSyncStatus).mockResolvedValue(status({ scope: 'member:hh-2' }));
    const client = makeClient();

    await pollSyncStatus(client);

    expect(client.resetQueries).toHaveBeenCalled();
    expect(syncSeen.set).toHaveBeenCalledWith(seenAll(status({ scope: 'member:hh-2' })));
  });

  it('discards the result when another user signed in meanwhile', async () => {
    vi.mocked(syncSeen.get).mockResolvedValue(seenAll());
    vi.mocked(api.getSyncStatus).mockImplementation(async () => {
      vi.mocked(currentUserId).mockReturnValue('user-2');
      return status({ grocery: 'g2' });
    });
    const client = makeClient();

    await pollSyncStatus(client);

    expect(refreshGroceryFromServer).not.toHaveBeenCalled();
    expect(syncSeen.set).not.toHaveBeenCalled();
  });

  it('never throws when the server cannot be reached', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(syncSeen.get).mockResolvedValue(seenAll());
    vi.mocked(api.getSyncStatus).mockRejectedValue(new Error('offline'));

    await expect(pollSyncStatus(makeClient())).resolves.toBeUndefined();
  });

  it('shares one poll between concurrent calls', async () => {
    vi.mocked(syncSeen.get).mockResolvedValue(seenAll());
    vi.mocked(api.getSyncStatus).mockResolvedValue(status());
    const client = makeClient();

    await Promise.all([pollSyncStatus(client), pollSyncStatus(client)]);

    expect(api.getSyncStatus).toHaveBeenCalledOnce();
  });
});
