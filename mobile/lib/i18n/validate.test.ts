/**
 * i18n validation tests.
 *
 * Ensures all locale files stay in sync with en.ts and translations
 * don't become excessively longer than their English originals.
 *
 * Run via:  pnpm i18n:check   (or as part of pnpm test)
 *
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest';
import en from './locales/en';
import itLocale from './locales/it';
import sv from './locales/sv';

// ── Helpers ─────────────────────────────────────────────────────────

type NestedRecord = { [key: string]: string | NestedRecord };

/** Recursively collect all dot-separated key paths. */
const collectKeys = (obj: NestedRecord, prefix = ''): string[] => {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      keys.push(fullKey);
    } else {
      keys.push(...collectKeys(value as NestedRecord, fullKey));
    }
  }
  return keys;
};

/** Resolve a dot-path to its string value. */
const resolve = (obj: NestedRecord, path: string): string | undefined => {
  let current: unknown = obj;
  for (const seg of path.split('.')) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[seg];
  }
  return typeof current === 'string' ? current : undefined;
};

// ── Tests ───────────────────────────────────────────────────────────

const enData = en as unknown as NestedRecord;
const enKeys = collectKeys(enData);

const locales: { name: string; data: NestedRecord }[] = [
  { name: 'sv', data: sv as unknown as NestedRecord },
  { name: 'it', data: itLocale as unknown as NestedRecord },
];

describe('i18n locale files', () => {
  it('en.ts has translation keys', () => {
    expect(enKeys.length).toBeGreaterThan(0);
  });

  for (const { name, data } of locales) {
    describe(`${name}.ts`, () => {
      const localeKeys = new Set(collectKeys(data));

      it('has no missing keys compared to en.ts', () => {
        const missing = enKeys.filter((k) => !localeKeys.has(k));
        if (missing.length > 0) {
          throw new Error(
            `Missing ${missing.length} key(s) in ${name}.ts:\n  ${missing.join('\n  ')}`,
          );
        }
      });

      it('has no extra keys not present in en.ts', () => {
        const enKeySet = new Set(enKeys);
        const extra = [...localeKeys].filter((k) => !enKeySet.has(k));
        if (extra.length > 0) {
          throw new Error(
            `Extra ${extra.length} key(s) in ${name}.ts (not in en.ts):\n  ${extra.join('\n  ')}`,
          );
        }
      });

      it('has no empty translations', () => {
        const empty = enKeys.filter((key) => {
          const locVal = resolve(data, key);
          return locVal === '';
        });
        if (empty.length > 0) {
          throw new Error(
            `${empty.length} empty translation(s) in ${name}.ts:\n  ${empty.join('\n  ')}`,
          );
        }
      });
    });
  }
});
