import { api } from '@/lib/api';
import { currentUserId } from '@/lib/auth-scope';
import { recipeStore } from '@/lib/storage/recipe-store';
import { createSerialQueue } from '@/lib/storage/serial-queue';
import type { Recipe, RecipeChanges } from '@/lib/types';

/** Download everything again at least this often, repairing changes made without a sync marker. */
export const FULL_SYNC_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// One sync at a time: each reads the stored cursor first, so overlapping ones (the query on mount
// and the status poll) could otherwise finish out of order and let an older result replace a newer.
const serialize = createSerialQueue();

const mergeRecipes = (
  existing: Recipe[],
  changed: Recipe[],
  deletedIds: string[],
): Recipe[] => {
  const byId = new Map(existing.map((recipe) => [recipe.id, recipe]));
  for (const id of deletedIds) byId.delete(id);
  for (const recipe of changed) byId.set(recipe.id, recipe);
  return Array.from(byId.values());
};

/**
 * Local-first load of every recipe the user can see (hidden ones too; screens filter).
 *
 * Reads the signed-in user's copy on the device first and hands it to `onLocal`, so screens draw
 * before any request finishes. Then asks the server only for what changed since the last sync and
 * applies it. Without a copy, or when the last full download is older than FULL_SYNC_MAX_AGE, it
 * downloads everything. If the server reports another scope (household or role) than the copy was
 * synced under, the copy no longer applies and everything is downloaded again.
 *
 * With a usable copy a failed request is not an error: the copy is returned. With `strict` it is,
 * so a caller that must know the sync happened (the status poll) does not mistake it for fresh.
 */
export function syncRecipes(
  onLocal: (recipes: Recipe[]) => void,
  options: { strict?: boolean } = {},
): Promise<Recipe[]> {
  return serialize(() => runSync(onLocal, options));
}

async function runSync(
  onLocal: (recipes: Recipe[]) => void,
  options: { strict?: boolean },
): Promise<Recipe[]> {
  const ownerUid = currentUserId();
  const local = await recipeStore.get(ownerUid);
  const hasCopy = local.lastSyncTime !== null;
  if (hasCopy) onLocal(local.recipes);

  const fullSyncDue =
    !hasCopy ||
    local.lastFullSyncAt === null ||
    Date.now() - local.lastFullSyncAt > FULL_SYNC_MAX_AGE;

  let changes: RecipeChanges;
  try {
    changes = await api.getRecipeChanges(
      fullSyncDue ? undefined : (local.lastSyncTime ?? undefined),
    );
  } catch (error) {
    if (!hasCopy || options.strict) throw error;
    console.warn('Recipe sync failed, using the copy on the device', error);
    return local.recipes;
  }

  let full = fullSyncDue;
  if (!full && local.scope !== null && local.scope !== changes.scope) {
    // Stop showing the old scope's recipes now, even if the download below fails.
    onLocal([]);
    await recipeStore.clear();
    changes = await api.getRecipeChanges();
    full = true;
  }

  const hasChanges =
    changes.recipes.length > 0 || changes.deleted_ids.length > 0;
  if (!full && !hasChanges) {
    await recipeStore.apply(ownerUid, [], [], {
      lastSyncTime: changes.server_time,
      scope: changes.scope,
    });
    return local.recipes;
  }

  await recipeStore.apply(
    ownerUid,
    changes.recipes,
    full ? [] : changes.deleted_ids,
    {
      lastSyncTime: changes.server_time,
      scope: changes.scope,
      ...(full ? { lastFullSyncAt: Date.now() } : {}),
    },
    { replace: full },
  );
  return full
    ? changes.recipes
    : mergeRecipes(local.recipes, changes.recipes, changes.deleted_ids);
}
