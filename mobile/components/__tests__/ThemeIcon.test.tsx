import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ThemeIcon, TERMINAL_ICONS } from '../ThemeIcon';

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

    // The global mock replaces Ionicons with () => null, so the
    // terminal glyph character must NOT appear — proving the Ionicons
    // path was taken instead of the flat-chrome Text path.
    const glyph = TERMINAL_ICONS.home!;
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

    const glyph = TERMINAL_ICONS.home!;
    expect(glyph.emoji).toBe(true);
    expect(screen.getByText(glyph.char)).toBeTruthy();
  });

  it('renders a non-emoji glyph for a mapped symbol icon', () => {
    render(<ThemeIcon name="chevron-forward" size={16} color="#0F0" />);

    const glyph = TERMINAL_ICONS['chevron-forward']!;
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

    const glyph = TERMINAL_ICONS.close!;
    expect(screen.getByText(glyph.char)).toBeTruthy();
  });
});

// ── Icon map sanity checks ───────────────────────────────────────────

describe('TERMINAL_ICONS map', () => {
  it('maps all tab navigation icons', () => {
    const tabIcons = [
      'home', 'home-outline', 'book', 'book-outline',
      'calendar', 'calendar-outline', 'cart', 'cart-outline',
    ] as const;

    for (const name of tabIcons) {
      expect(TERMINAL_ICONS[name]).toBeDefined();
    }
  });

  it('maps grocery screen icons', () => {
    const groceryIcons = [
      'swap-vertical', 'reorder-three', 'trash-outline',
      'create-outline', 'calendar-outline', 'checkmark',
    ] as const;

    for (const name of groceryIcons) {
      expect(TERMINAL_ICONS[name], `${name} missing from map`).toBeDefined();
    }
  });

  it('has non-empty char for every entry', () => {
    for (const [name, glyph] of Object.entries(TERMINAL_ICONS)) {
      expect(glyph.char.length, `${name} has empty char`).toBeGreaterThan(0);
    }
  });
});
