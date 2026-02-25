import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Text } from 'react-native';
import { ContentCard } from '../ContentCard';

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
  colors: {
    card: { bg: '#FFF', borderColor: '#CCC' },
    surface: { subtle: '#F5F5F5' },
    dayCard: { bgToday: '#FFFCF0' },
    ai: { primary: '#6B8E6B' },
    content: { heading: '#333', subtitle: '#999' },
  },
  fonts: { body: 'DMSans_400Regular', bodySemibold: 'DMSans_600SemiBold' },
  borderRadius: { sm: 8, md: 16, lg: 24, full: 999 },
  shadows: { card: {}, sm: {} },
  overrides: { cardBorderWidth: 1, cardHighlightBorderWidth: 2 },
});

const flatTheme = () => ({
  chrome: 'flat' as const,
  colors: {
    card: { bg: '#000', borderColor: '#0F0' },
    surface: { subtle: '#111' },
    dayCard: { bgToday: '#222' },
    ai: { primary: '#0F0' },
    content: { heading: '#0F0', subtitle: '#0A0' },
  },
  fonts: { body: 'Mono', bodySemibold: 'Mono' },
  borderRadius: { sm: 0, md: 0, lg: 0, full: 0 },
  shadows: { card: {}, sm: {} },
  overrides: { cardBorderWidth: 0, cardHighlightBorderWidth: 0 },
});

afterEach(() => {
  useThemeSpy.mockReset();
});

describe('ContentCard — card variant (default)', () => {
  beforeEach(() => {
    useThemeSpy.mockReturnValue(fullTheme());
  });

  it('renders children', () => {
    render(
      <ContentCard>
        <Text>Hello</Text>
      </ContentCard>,
    );
    expect(screen.getByText('Hello')).toBeDefined();
  });

  it('renders multiple children', () => {
    render(
      <ContentCard>
        <Text>First</Text>
        <Text>Second</Text>
      </ContentCard>,
    );
    expect(screen.getByText('First')).toBeDefined();
    expect(screen.getByText('Second')).toBeDefined();
  });
});

describe('ContentCard — surface variant (full chrome)', () => {
  beforeEach(() => {
    useThemeSpy.mockReturnValue(fullTheme());
  });

  it('renders children', () => {
    render(
      <ContentCard variant="surface">
        <Text>Surface content</Text>
      </ContentCard>,
    );
    expect(screen.getByText('Surface content')).toBeDefined();
  });

  it('accepts custom padding without crashing', () => {
    render(
      <ContentCard variant="surface" padding={24}>
        <Text>Custom pad</Text>
      </ContentCard>,
    );
    expect(screen.getByText('Custom pad')).toBeDefined();
  });

  it('accepts extra styles without crashing', () => {
    render(
      <ContentCard variant="surface" style={{ marginBottom: 12 }}>
        <Text>Extra styles</Text>
      </ContentCard>,
    );
    expect(screen.getByText('Extra styles')).toBeDefined();
  });
});

describe('ContentCard — surface variant (flat chrome)', () => {
  beforeEach(() => {
    useThemeSpy.mockReturnValue(flatTheme());
  });

  it('renders children in a plain View (no TerminalFrame)', () => {
    render(
      <ContentCard variant="surface">
        <Text>Flat surface</Text>
      </ContentCard>,
    );
    expect(screen.getByText('Flat surface')).toBeDefined();
  });
});

describe('ContentCard — card variant (flat chrome)', () => {
  beforeEach(() => {
    useThemeSpy.mockReturnValue(flatTheme());
  });

  it('renders children inside TerminalFrame', () => {
    render(
      <ContentCard label="TEST">
        <Text>Terminal card</Text>
      </ContentCard>,
    );
    expect(screen.getByText('Terminal card')).toBeDefined();
  });
});
