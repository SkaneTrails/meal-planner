import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockRecipe } from '@/test/helpers';

// In-memory stand-in for expo-file-system's File/Directory.
const files = new Map<string, string>();
const directories = new Set<string>();
const removals: string[] = [];
let failWrites = false;

vi.mock('expo-file-system', () => {
  const join = (parent: { path: string } | string, name: string) =>
    `${typeof parent === 'string' ? parent : parent.path}/${name}`;
  class Directory {
    path: string;
    constructor(parent: { path: string } | string, name: string) {
      this.path = join(parent, name);
    }
    get exists() {
      return directories.has(this.path);
    }
    create() {
      directories.add(this.path);
    }
    delete() {
      removals.push(`dir:${this.path}`);
      directories.delete(this.path);
      for (const key of [...files.keys()]) if (key.startsWith(`${this.path}/`)) files.delete(key);
    }
  }
  class File {
    path: string;
    constructor(parent: { path: string } | string, name: string) {
      this.path = join(parent, name);
    }
    get exists() {
      return files.has(this.path);
    }
    async text() {
      const content = files.get(this.path);
      if (content === undefined) throw new Error('missing file');
      return content;
    }
    write(content: string) {
      if (failWrites) throw new Error('disk full');
      files.set(this.path, content);
    }
    delete() {
      removals.push(`file:${this.path}`);
      files.delete(this.path);
    }
  }
  return { Directory, File, Paths: { document: 'doc' } };
});

import { recipeStore } from '../recipe-store.native';

const recipe = (id: string, title = id) => mockRecipe({ id, title });
const SYNC = { lastSyncTime: '2026-11-01T00:00:00Z', scope: 'member:hh1', lastFullSyncAt: 1000 };
const EMPTY = { recipes: [], lastSyncTime: null, lastFullSyncAt: null, scope: null };

describe('recipeStore (native / files)', () => {
  beforeEach(() => {
    files.clear();
    directories.clear();
    removals.length = 0;
    failWrites = false;
  });

  it('is empty before the first sync', async () => {
    expect(await recipeStore.get('u1')).toEqual(EMPTY);
  });

  it('stores one file per recipe plus an index with the sync position', async () => {
    await recipeStore.apply('u1', [recipe('a'), recipe('b')], [], SYNC);

    expect([...files.keys()].sort()).toEqual([
      'doc/recipes/a.json',
      'doc/recipes/b.json',
      'doc/recipes/index.json',
    ]);
    const stored = await recipeStore.get('u1');
    expect(stored.recipes.map((r) => r.id)).toEqual(['a', 'b']);
    expect(stored).toMatchObject({ lastSyncTime: SYNC.lastSyncTime, scope: SYNC.scope, lastFullSyncAt: 1000 });
  });

  it('rewrites changed recipes, deletes removed ones and keeps the last full sync time', async () => {
    await recipeStore.apply('u1', [recipe('a', 'old'), recipe('b')], [], SYNC);

    await recipeStore.apply('u1', [recipe('a', 'new')], ['b'], {
      lastSyncTime: '2026-11-02T00:00:00Z',
      scope: 'member:hh1',
    });

    expect(files.has('doc/recipes/b.json')).toBe(false);
    const stored = await recipeStore.get('u1');
    expect(stored.recipes.map((r) => r.title)).toEqual(['new']);
    expect(stored.lastSyncTime).toBe('2026-11-02T00:00:00Z');
    expect(stored.lastFullSyncAt).toBe(1000);
  });

  it("erases another user's copy, index first", async () => {
    await recipeStore.apply('u1', [recipe('private')], [], SYNC);
    removals.length = 0;

    expect(await recipeStore.get('u2')).toEqual(EMPTY);
    expect(removals[0]).toBe('file:doc/recipes/index.json');
    expect(files.size).toBe(0);
  });

  it('replaces everything when applying a full snapshot', async () => {
    await recipeStore.apply('u1', [recipe('a'), recipe('gone')], [], SYNC);

    await recipeStore.apply('u1', [recipe('a')], [], SYNC, { replace: true });

    expect((await recipeStore.get('u1')).recipes.map((r) => r.id)).toEqual(['a']);
  });

  it('keeps every change when applies overlap', async () => {
    await Promise.all([
      recipeStore.apply('u1', [recipe('a')], [], SYNC),
      recipeStore.apply('u1', [recipe('b')], [], SYNC),
      recipeStore.apply('u1', [recipe('c')], ['a'], SYNC),
    ]);

    expect((await recipeStore.get('u1')).recipes.map((r) => r.id).sort()).toEqual(['b', 'c']);
  });

  it('escapes recipe ids that are not safe file names', async () => {
    await recipeStore.apply('u1', [recipe('a/b')], [], SYNC);

    expect(files.has('doc/recipes/a%2Fb.json')).toBe(true);
    expect((await recipeStore.get('u1')).recipes[0].id).toBe('a/b');
  });

  it('reads a missing recipe file or a corrupt index as empty, forcing a full sync', async () => {
    await recipeStore.apply('u1', [recipe('a')], [], SYNC);
    files.delete('doc/recipes/a.json');
    expect(await recipeStore.get('u1')).toEqual(EMPTY);

    files.set('doc/recipes/index.json', '{not json');
    expect(await recipeStore.get('u1')).toEqual(EMPTY);
  });

  it('does not throw when writing fails', async () => {
    failWrites = true;

    await expect(recipeStore.apply('u1', [recipe('a')], [], SYNC)).resolves.toBeUndefined();
  });

  it('clear removes everything', async () => {
    await recipeStore.apply('u1', [recipe('a')], [], SYNC);

    await recipeStore.clear();

    expect(files.size).toBe(0);
  });
});
