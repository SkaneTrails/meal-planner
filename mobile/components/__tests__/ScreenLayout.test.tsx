import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Text } from 'react-native';

vi.mock('@/components/GradientBackground', () => ({
  GradientBackground: ({ children, animated, style }: any) => {
    const { createElement } = require('react');
    return createElement(
      'div',
      {
        'data-testid': 'gradient-bg',
        'data-animated': String(!!animated),
        style,
      },
      children,
    );
  },
}));

import { ScreenLayout } from '../ScreenLayout';

describe('ScreenLayout', () => {
  it('renders children', () => {
    render(
      <ScreenLayout>
        <Text>Hello</Text>
      </ScreenLayout>,
    );
    expect(screen.getByText('Hello')).toBeDefined();
  });

  it('applies contentContainer by default', () => {
    render(
      <ScreenLayout>
        <Text>Content</Text>
      </ScreenLayout>,
    );
    expect(screen.getByTestId('screen-layout-container')).toBeDefined();
  });

  it('passes animated to GradientBackground', () => {
    render(
      <ScreenLayout animated>
        <Text>Animated</Text>
      </ScreenLayout>,
    );
    expect(screen.getByTestId('gradient-bg').dataset.animated).toBe('true');
  });

  it('does not animate by default', () => {
    render(
      <ScreenLayout>
        <Text>Static</Text>
      </ScreenLayout>,
    );
    expect(screen.getByTestId('gradient-bg').dataset.animated).toBe('false');
  });

  it('skips contentContainer when constrained={false}', () => {
    render(
      <ScreenLayout constrained={false}>
        <Text>Unconstrained</Text>
      </ScreenLayout>,
    );
    const container = screen.getByTestId('screen-layout-container');
    // contentContainer adds maxWidth — without it, only flex: 1
    expect(container.style.maxWidth).toBeFalsy();
  });

  it('renders centered mode with centering styles', () => {
    const { container } = render(
      <ScreenLayout animated centered>
        <Text>Centered</Text>
      </ScreenLayout>,
    );
    expect(screen.getByText('Centered')).toBeDefined();
    // Centered mode does not render the screen-layout-container testID
    expect(screen.queryByTestId('screen-layout-container')).toBeNull();
  });

  it('centered mode sets animated on GradientBackground', () => {
    render(
      <ScreenLayout animated centered>
        <Text>Auth</Text>
      </ScreenLayout>,
    );
    expect(screen.getByTestId('gradient-bg').dataset.animated).toBe('true');
  });
});
