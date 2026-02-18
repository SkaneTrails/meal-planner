import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { CRTOverlay } from '../CRTOverlay';

const baseMock = {
  colors: {} as Record<string, unknown>,
  fonts: {} as Record<string, string>,
  typography: {} as Record<string, unknown>,
  styles: {} as Record<string, unknown>,
  borderRadius: {} as Record<string, number>,
  shadows: {} as Record<string, unknown>,
  circleStyle: (s: number) => ({ width: s, height: s, borderRadius: s / 2 }),
  crt: undefined as undefined | Record<string, unknown>,
};

const mockCRT = {
  scanlineOpacity: 0.08,
  flickerMin: 0.97,
  flickerMs: 4000,
  glowColor: 'rgba(51, 255, 51, 0.07)',
  glowSpread: 60,
  glowSize: 20,
};

const useThemeSpy = vi.fn(() => baseMock);

vi.mock('@/lib/theme', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return { ...original, useTheme: () => useThemeSpy() };
});

describe('CRTOverlay', () => {
  afterEach(() => {
    useThemeSpy.mockReturnValue(baseMock);
  });

  it('renders nothing when crt is undefined', () => {
    const { container } = render(<CRTOverlay />);
    expect(container.innerHTML).toBe('');
  });

  it('renders overlay layers when crt config is provided', () => {
    useThemeSpy.mockReturnValue({ ...baseMock, crt: mockCRT });

    const { container } = render(<CRTOverlay />);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders glow layer inside the overlay', () => {
    useThemeSpy.mockReturnValue({ ...baseMock, crt: mockCRT });

    const { container } = render(<CRTOverlay />);
    const outerView = container.firstChild as HTMLElement;
    const children = outerView.querySelectorAll('[data-component]');
    expect(children.length).toBeGreaterThanOrEqual(1);
  });
});
