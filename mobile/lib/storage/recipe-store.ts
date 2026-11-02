/**
 * Recipe store fallback for web and tests: no copy on the device. Web keeps reading recipes
 * from the API; Metro resolves recipe-store.native.ts on Android and iOS.
 */
import type { Recipe } from '@/lib/types';

export interface CachedRecipes {
  recipes: Recipe[];
  lastSyncTime: string | null;
  /** When the last full snapshot was stored (ms), or null before the first one. */
  lastFullSyncAt: number | null;
  /** Scope the server reported at the last sync, or null before the first one. */
  scope: string | null;
}

/** Position the copy has reached, taken from the server's response. */
export interface RecipeSyncState {
  lastSyncTime: string;
  scope: string;
  /** Set when this sync was a full snapshot. */
  lastFullSyncAt?: number;
}

const EMPTY: CachedRecipes = {
  recipes: [],
  lastSyncTime: null,
  lastFullSyncAt: null,
  scope: null,
};

export const recipeStore = {
  isAvailable: false,
  get: async (_ownerUid: string): Promise<CachedRecipes> => EMPTY,
  apply: async (
    _ownerUid: string,
    _changed: Recipe[],
    _deletedIds: string[],
    _sync: RecipeSyncState,
    _options: { replace?: boolean } = {},
  ): Promise<void> => {},
  clear: async (): Promise<void> => {},
};
