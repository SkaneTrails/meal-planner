import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  ThemeIcon,
  BASE_GLYPHS,
  GLYPH_OVERRIDES,
  resolveGlyph,
} from '../ThemeIcon';

const useThemeSpy = vi.fn();

vi.mock('@/lib/theme', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    useTheme: () => useThemeSpy(),
  };
});

const fullTheme = () => ({
  chrome: 'full' as const,
  fonts: { body: 'DMSans_400Regular' },
});

const flatTheme = () => ({
  chrome: 'flat' as const,
  fonts: { body: 'Mono', emoji: 'NotoEmoji_400Regular' },
});

afterEach(() => {
  useThemeSpy.mockReset();
});

// ── Full chrome (Ionicons) ───────────────────────────────────────────

describe('ThemeIcon — full chrome', () => {
  beforeEach(() => {
    useThemeSpy.mockReturnValue(fullTheme());
  });

  it('does not render a terminal glyph', () => {
    render(<ThemeIcon name="home" size={24} color="#000" />);

    const glyph = BASE_GLYPHS.home;
    expect(screen.queryByText(glyph.char)).toBeNull();
  });
});

// ── Flat chrome (terminal glyphs) ────────────────────────────────────

describe('ThemeIcon — flat chrome', () => {
  beforeEach(() => {
    useThemeSpy.mockReturnValue(flatTheme());
  });

  it('renders an emoji glyph for a mapped emoji icon', () => {
    render(<ThemeIcon name="home" size={24} color="#0F0" />);

    const glyph = BASE_GLYPHS.home;
    expect(glyph.emoji).toBe(true);
    expect(screen.getByText(glyph.char)).toBeTruthy();
  });

  it('renders a non-emoji glyph for a mapped symbol icon', () => {
    render(<ThemeIcon name="chevron-forward" size={16} color="#0F0" />);

    const glyph = BASE_GLYPHS['chevron-forward'];
    expect(glyph.emoji).toBeUndefined();
    expect(screen.getByText(glyph.char)).toBeTruthy();
  });

  it('renders a fallback glyph for unmapped icon names', () => {
    render(
      <ThemeIcon name={'zzz-nonexistent' as never} size={20} color="#0F0" />,
    );

    const text = screen.getByText('\u25AA');
    expect(text).toBeTruthy();
  });

  it('passes accessibilityLabel as an attribute', () => {
    const { container } = render(
      <ThemeIcon
        name="cart"
        size={22}
        color="#0F0"
        accessibilityLabel="Shopping cart"
      />,
    );

    const el = container.querySelector('[accessibilitylabel="Shopping cart"]');
    expect(el).toBeTruthy();
  });

  it('applies custom style prop without crashing', () => {
    render(
      <ThemeIcon
        name="close"
        size={18}
        color="#0F0"
        style={{ marginRight: 4 }}
      />,
    );

    const glyph = BASE_GLYPHS.close;
    expect(screen.getByText(glyph.char)).toBeTruthy();
  });
});

// ── resolveGlyph — suffix stripping ─────────────────────────────────

describe('resolveGlyph', () => {
  it('resolves a base glyph by exact stem', () => {
    const glyph = resolveGlyph('home' as never);
    expect(glyph.char).toBe(BASE_GLYPHS.home.char);
  });

  it('strips -outline suffix and resolves base glyph', () => {
    const glyph = resolveGlyph('flame-outline' as never);
    expect(glyph.char).toBe(BASE_GLYPHS.flame.char);
  });

  it('strips -outline suffix from compound name', () => {
    const glyph = resolveGlyph('alert-circle-outline' as never);
    expect(glyph.char).toBe(BASE_GLYPHS['alert-circle'].char);
  });

  it('uses override when one exists', () => {
    const glyph = resolveGlyph('heart-outline' as never);
    expect(glyph.char).toBe(GLYPH_OVERRIDES['heart-outline']!.char);
    expect(glyph.char).not.toBe(BASE_GLYPHS.heart.char);
  });

  it('returns fallback for completely unknown icons', () => {
    const glyph = resolveGlyph('zzz-nonexistent' as never);
    expect(glyph.char).toBe('\u25AA');
  });
});

// ── Icon map sanity checks ───────────────────────────────────────────

describe('BASE_GLYPHS map', () => {
  it('covers all tab navigation icon stems', () => {
    const tabStems = ['home', 'book', 'calendar', 'cart'] as const;
    for (const stem of tabStems) {
      expect(BASE_GLYPHS[stem], `${stem} missing from map`).toBeDefined();
    }
  });

  it('covers grocery screen icon stems', () => {
    const groceryStems = [
      'swap-vertical', 'reorder-three', 'trash',
      'create', 'calendar', 'checkmark',
    ] as const;
    for (const stem of groceryStems) {
      expect(BASE_GLYPHS[stem], `${stem} missing from map`).toBeDefined();
    }
  });

  it('has non-empty char for every entry', () => {
    for (const [name, glyph] of Object.entries(BASE_GLYPHS)) {
      expect(glyph.char.length, `${name} has empty char`).toBeGreaterThan(0);
    }
  });

  it('has non-empty char for every override', () => {
    for (const [name, glyph] of Object.entries(GLYPH_OVERRIDES)) {
      expect(glyph.char.length, `${name} has empty char`).toBeGreaterThan(0);
    }
  });
});
