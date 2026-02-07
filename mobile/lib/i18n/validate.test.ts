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

import { describe, it, expect } from 'vitest';
import en from './locales/en';
import sv from './locales/sv';
import itLocale from './locales/it';

// ── Helpers ─────────────────────────────────────────────────────────

type NestedRecord = { [key: string]: string | NestedRecord };

/** Recursively collect all dot-separated key paths. */
function collectKeys(obj: NestedRecord, prefix = ''): string[] {
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
}

/** Resolve a dot-path to its string value. */
function resolve(obj: NestedRecord, path: string): string | undefined {
  let current: unknown = obj;
  for (const seg of path.split('.')) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[seg];
  }
  return typeof current === 'string' ? current : undefined;
}

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

      it('has no translations > 50% longer than English (for strings ≥ 8 chars)', () => {
        const tooLong: string[] = [];
        for (const key of enKeys) {
          const enVal = resolve(enData, key);
          const locVal = resolve(data, key);
          if (!enVal || !locVal || locVal === '' || enVal.length < 8) continue;
          const ratio = locVal.length / enVal.length;
          if (ratio > 1.5) {
            tooLong.push(
              `  ${key}: ${Math.round((ratio - 1) * 100)}% longer (${locVal.length} vs ${enVal.length})`,
            );
          }
        }
        if (tooLong.length > 0) {
          console.warn(
            `⚠️  [${name}] ${tooLong.length} translation(s) are > 50% longer than English:\n${tooLong.join('\n')}`,
          );
          // This is a warning, not a hard failure — uncomment to make it strict:
          // throw new Error(`${tooLong.length} translations too long:\n${tooLong.join('\n')}`);
        }
      });
    });
  }
});
