import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockRecipe } from '@/test/helpers';
import type { RecipeChanges } from '@/lib/types';
import type { CachedRecipes } from '@/lib/storage/recipe-store';

vi.mock('@/lib/api', () => ({ api: { getRecipeChanges: vi.fn() } }));
vi.mock('@/lib/auth-scope', () => ({ currentUserId: () => 'user-1' }));
vi.mock('@/lib/storage/recipe-store', () => ({
  recipeStore: {
    isAvailable: true,
    get: vi.fn(),
    apply: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
}));

import { api } from '@/lib/api';
import { recipeStore } from '@/lib/storage/recipe-store';
import { FULL_SYNC_MAX_AGE, syncRecipes } from '../recipe-sync';

const SCOPE = 'member:hh1';
const copy = (overrides: Partial<CachedRecipes> = {}): CachedRecipes => ({
  recipes: [mockRecipe({ id: 'a' }), mockRecipe({ id: 'b' })],
  lastSyncTime: '2026-11-01T10:00:00Z',
  lastFullSyncAt: Date.now(),
  scope: SCOPE,
  ...overrides,
});
const changes = (overrides: Partial<RecipeChanges> = {}): RecipeChanges => ({
  recipes: [],
  deleted_ids: [],
  server_time: '2026-11-01T11:00:00Z',
  scope: SCOPE,
  ...overrides,
});
const NO_COPY: CachedRecipes = { recipes: [], lastSyncTime: null, lastFullSyncAt: null, scope: null };
const ids = (recipes: { id: string }[]) => recipes.map((r) => r.id).sort();

describe('syncRecipes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('downloads everything once when there is no copy, replacing whatever was stored', async () => {
    vi.mocked(recipeStore.get).mockResolvedValue(NO_COPY);
    vi.mocked(api.getRecipeChanges).mockResolvedValue(changes({ recipes: [mockRecipe({ id: 'x' })] }));
    const onLocal = vi.fn();

    const result = await syncRecipes(onLocal);

    expect(api.getRecipeChanges).toHaveBeenCalledWith(undefined);
    expect(onLocal).not.toHaveBeenCalled();
    expect(ids(result)).toEqual(['x']);
    const [, , deleted, sync, options] = vi.mocked(recipeStore.apply).mock.calls[0];
    expect(deleted).toEqual([]);
    expect(sync.lastFullSyncAt).toBeTypeOf('number');
    expect(options).toEqual({ replace: true });
  });

  it('shows the copy first, then asks only for changes and merges them', async () => {
    vi.mocked(recipeStore.get).mockResolvedValue(copy());
    vi.mocked(api.getRecipeChanges).mockResolvedValue(
      changes({ recipes: [mockRecipe({ id: 'c' }), mockRecipe({ id: 'a', title: 'New' })], deleted_ids: ['b'] }),
    );
    const onLocal = vi.fn();

    const result = await syncRecipes(onLocal);

    expect(ids(onLocal.mock.calls[0][0])).toEqual(['a', 'b']);
    expect(api.getRecipeChanges).toHaveBeenCalledWith('2026-11-01T10:00:00Z');
    expect(ids(result)).toEqual(['a', 'c']);
    expect(result.find((r) => r.id === 'a')?.title).toBe('New');
    expect(vi.mocked(recipeStore.apply).mock.calls[0][4]).toEqual({ replace: false });
  });

  it('moves the cursor but keeps the copy when nothing changed', async () => {
    vi.mocked(recipeStore.get).mockResolvedValue(copy());
    vi.mocked(api.getRecipeChanges).mockResolvedValue(changes());

    const result = await syncRecipes(() => {});

    expect(ids(result)).toEqual(['a', 'b']);
    expect(vi.mocked(recipeStore.apply).mock.calls[0][3]).toEqual({
      lastSyncTime: '2026-11-01T11:00:00Z',
      scope: SCOPE,
    });
  });

  it('downloads everything again when the last full download is too old', async () => {
    vi.mocked(recipeStore.get).mockResolvedValue(
      copy({ lastFullSyncAt: Date.now() - FULL_SYNC_MAX_AGE - 1 }),
    );
    vi.mocked(api.getRecipeChanges).mockResolvedValue(changes({ recipes: [mockRecipe({ id: 'a' })] }));

    const result = await syncRecipes(() => {});

    expect(api.getRecipeChanges).toHaveBeenCalledWith(undefined);
    expect(ids(result)).toEqual(['a']);
    expect(vi.mocked(recipeStore.apply).mock.calls[0][4]).toEqual({ replace: true });
  });

  it('starts over when the household or role changed', async () => {
    vi.mocked(recipeStore.get).mockResolvedValue(copy());
    vi.mocked(api.getRecipeChanges)
      .mockResolvedValueOnce(changes({ scope: 'member:hh2' }))
      .mockResolvedValueOnce(changes({ scope: 'member:hh2', recipes: [mockRecipe({ id: 'z' })] }));
    const onLocal = vi.fn();

    const result = await syncRecipes(onLocal);

    expect(onLocal).toHaveBeenLastCalledWith([]);
    expect(recipeStore.clear).toHaveBeenCalled();
    expect(api.getRecipeChanges).toHaveBeenLastCalledWith();
    expect(ids(result)).toEqual(['z']);
  });

  it('falls back to the copy when the server cannot be reached', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(recipeStore.get).mockResolvedValue(copy());
    vi.mocked(api.getRecipeChanges).mockRejectedValue(new Error('offline'));

    expect(ids(await syncRecipes(() => {}))).toEqual(['a', 'b']);
  });

  it('fails when strict (the status poll) or when there is no copy', async () => {
    vi.mocked(api.getRecipeChanges).mockRejectedValue(new Error('offline'));

    vi.mocked(recipeStore.get).mockResolvedValue(copy());
    await expect(syncRecipes(() => {}, { strict: true })).rejects.toThrow('offline');

    vi.mocked(recipeStore.get).mockResolvedValue(NO_COPY);
    await expect(syncRecipes(() => {})).rejects.toThrow('offline');
  });
});
