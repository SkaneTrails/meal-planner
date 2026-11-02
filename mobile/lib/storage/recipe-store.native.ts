/**
 * Copy of every recipe the user can see, kept on the device (native: one JSON file per recipe).
 *
 * AsyncStorage is capped at about 6 MB on Android and recipes with their pre-enhancement copies
 * can exceed that, so recipes live as files. An index file lists the recipes and the sync
 * position and is written last, so it only ever refers to complete recipe files.
 *
 * The copy belongs to one signed-in user and one scope (role and household). Asking for it as
 * another user erases it, and a cursor from one scope is never sent for another.
 */
import { Directory, File, Paths } from 'expo-file-system';
import type { Recipe } from '@/lib/types';
import type { CachedRecipes, RecipeSyncState } from './recipe-store';
import { createSerialQueue } from './serial-queue';

interface StoreIndex {
  ownerUid: string | null;
  lastSyncTime: string | null;
  lastFullSyncAt: number | null;
  scope: string | null;
  ids: string[];
}

const DIRECTORY_NAME = 'recipes';
const INDEX_FILE_NAME = 'index.json';
const EMPTY: CachedRecipes = {
  recipes: [],
  lastSyncTime: null,
  lastFullSyncAt: null,
  scope: null,
};
const EMPTY_INDEX: StoreIndex = {
  ownerUid: null,
  lastSyncTime: null,
  lastFullSyncAt: null,
  scope: null,
  ids: [],
};

function openDirectory(): Directory {
  const directory = new Directory(Paths.document, DIRECTORY_NAME);
  if (!directory.exists) directory.create({ idempotent: true });
  return directory;
}

function recipeFile(directory: Directory, recipeId: string): File {
  return new File(directory, `${encodeURIComponent(recipeId)}.json`);
}

async function readIndex(directory: Directory): Promise<StoreIndex> {
  const indexFile = new File(directory, INDEX_FILE_NAME);
  if (!indexFile.exists) return EMPTY_INDEX;
  return {
    ...EMPTY_INDEX,
    ...(JSON.parse(await indexFile.text()) as Partial<StoreIndex>),
  };
}

/** Remove the index first: without it the recipe files are unreachable, even if deleting them fails part-way. */
function eraseStore(): void {
  const directory = new Directory(Paths.document, DIRECTORY_NAME);
  if (!directory.exists) return;
  const indexFile = new File(directory, INDEX_FILE_NAME);
  if (indexFile.exists) indexFile.delete();
  directory.delete();
}

const unqueuedStore = {
  /**
   * Read the copy that belongs to `ownerUid`; another user's copy is erased and reads as empty.
   * Anything missing or unreadable also reads as empty, forcing a full sync.
   */
  async get(ownerUid: string): Promise<CachedRecipes> {
    try {
      const directory = openDirectory();
      const index = await readIndex(directory);
      if (index.ownerUid !== ownerUid) {
        eraseStore();
        return EMPTY;
      }
      const recipes = await Promise.all(
        index.ids.map(
          async (id) =>
            JSON.parse(await recipeFile(directory, id).text()) as Recipe,
        ),
      );
      return {
        recipes,
        lastSyncTime: index.lastSyncTime,
        lastFullSyncAt: index.lastFullSyncAt,
        scope: index.scope,
      };
    } catch {
      return EMPTY;
    }
  },

  /**
   * Store changed recipes and drop removed ones for `ownerUid`, replacing another user's copy.
   * With `replace`, `changed` is a full snapshot: whatever was stored before is discarded, so a
   * recipe removed on the server without a tombstone cannot linger.
   */
  async apply(
    ownerUid: string,
    changed: Recipe[],
    deletedIds: string[],
    sync: RecipeSyncState,
    options: { replace?: boolean } = {},
  ): Promise<void> {
    try {
      let directory = openDirectory();
      let previous = options.replace
        ? EMPTY_INDEX
        : await readIndex(directory).catch((): StoreIndex => EMPTY_INDEX);
      if (options.replace || previous.ownerUid !== ownerUid) {
        eraseStore();
        directory = openDirectory();
        previous = EMPTY_INDEX;
      }
      const ids = new Set(previous.ids);

      for (const recipe of changed) {
        recipeFile(directory, recipe.id).write(JSON.stringify(recipe));
        ids.add(recipe.id);
      }
      for (const id of deletedIds) {
        const file = recipeFile(directory, id);
        if (file.exists) file.delete();
        ids.delete(id);
      }

      const index: StoreIndex = {
        ownerUid,
        lastSyncTime: sync.lastSyncTime,
        lastFullSyncAt: sync.lastFullSyncAt ?? previous.lastFullSyncAt,
        scope: sync.scope,
        ids: Array.from(ids),
      };
      new File(directory, INDEX_FILE_NAME).write(JSON.stringify(index));
    } catch {
      // A failed write only costs a fuller sync on the next start.
    }
  },

  async clear(): Promise<void> {
    try {
      eraseStore();
    } catch {
      // Nothing to clear.
    }
  },
};

const serialize = createSerialQueue();

/** The store's operations run one at a time: apply reads the index, changes it and writes it back. */
export const recipeStore = {
  isAvailable: true,
  get: (ownerUid: string) => serialize(() => unqueuedStore.get(ownerUid)),
  apply: (...args: Parameters<typeof unqueuedStore.apply>) =>
    serialize(() => unqueuedStore.apply(...args)),
  clear: () => serialize(() => unqueuedStore.clear()),
};

export type { CachedRecipes, RecipeSyncState };
