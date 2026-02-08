/**
 * Regression test: Expo Router discovers all files/directories under app/(tabs)/
 * as routes. Non-route files (hooks, sub-components, constants) must live outside
 * app/ to prevent phantom tab bar entries.
 *
 * This test catches the bug from Phase 3 file splits where extracted files were
 * placed in subdirectories inside app/(tabs)/, causing phantom nav entries.
 */

import { readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { describe, it, expect } from 'vitest';

const TABS_DIR = resolve(__dirname, '..', '(tabs)');

const ALLOWED_ROUTE_FILES = new Set([
  '_layout.tsx',
  'index.tsx',
  'recipes.tsx',
  'add-recipe.tsx',
  'meal-plan.tsx',
  'grocery.tsx',
  'settings.tsx',
  'admin.tsx',
  'select-recipe.tsx',
]);

const ALLOWED_SUBDIRECTORIES: Record<string, string[]> = {
  recipe: ['[id].tsx'],
};

describe('tab route structure', () => {
  it('should only contain allowed route files at the top level', () => {
    const entries = readdirSync(TABS_DIR);
    const topLevelFiles = entries.filter((entry) => {
      const fullPath = join(TABS_DIR, entry);
      return statSync(fullPath).isFile();
    });

    const unexpectedFiles = topLevelFiles.filter(
      (f) => !ALLOWED_ROUTE_FILES.has(f),
    );

    expect(unexpectedFiles).toEqual([]);
  });

  it('should only contain allowed subdirectories', () => {
    const entries = readdirSync(TABS_DIR);
    const subdirs = entries.filter((entry) => {
      const fullPath = join(TABS_DIR, entry);
      return statSync(fullPath).isDirectory();
    });

    const allowedDirNames = Object.keys(ALLOWED_SUBDIRECTORIES);
    const unexpectedDirs = subdirs.filter((d) => !allowedDirNames.includes(d));

    expect(unexpectedDirs).toEqual([]);
  });

  it('should only contain route files inside allowed subdirectories', () => {
    for (const [dir, allowedFiles] of Object.entries(ALLOWED_SUBDIRECTORIES)) {
      const dirPath = join(TABS_DIR, dir);
      const entries = readdirSync(dirPath, { recursive: true }) as string[];
      const files = entries.filter((entry) => {
        const fullPath = join(dirPath, entry);
        return statSync(fullPath).isFile();
      });

      const unexpectedFiles = files.filter(
        (f) => !allowedFiles.includes(f),
      );

      expect(unexpectedFiles, `Unexpected files in app/(tabs)/${dir}/`).toEqual([]);
    }
  });
});
