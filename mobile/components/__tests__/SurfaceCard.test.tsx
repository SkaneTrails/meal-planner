import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Text } from 'react-native';
import { SurfaceCard } from '../SurfaceCard';

describe('SurfaceCard', () => {
  it('renders children', () => {
    render(
      <SurfaceCard>
        <Text>Card content</Text>
      </SurfaceCard>,
    );
    expect(screen.getByText('Card content')).toBeDefined();
  });

  it('renders multiple children', () => {
    render(
      <SurfaceCard>
        <Text>First</Text>
        <Text>Second</Text>
      </SurfaceCard>,
    );
    expect(screen.getByText('First')).toBeDefined();
    expect(screen.getByText('Second')).toBeDefined();
  });

  it('accepts custom padding without crashing', () => {
    render(
      <SurfaceCard padding={24}>
        <Text>Custom padding</Text>
      </SurfaceCard>,
    );
    expect(screen.getByText('Custom padding')).toBeDefined();
  });

  it('accepts custom style without crashing', () => {
    render(
      <SurfaceCard style={{ marginBottom: 12, opacity: 0.5 }}>
        <Text>Styled</Text>
      </SurfaceCard>,
    );
    expect(screen.getByText('Styled')).toBeDefined();
  });
});
