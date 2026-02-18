import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Text } from 'react-native';
import { ChipGroup } from '../ChipGroup';

describe('ChipGroup', () => {
  it('renders children in wrap layout by default', () => {
    render(
      <ChipGroup>
        <Text>Chip A</Text>
        <Text>Chip B</Text>
      </ChipGroup>,
    );
    expect(screen.getByText('Chip A')).toBeDefined();
    expect(screen.getByText('Chip B')).toBeDefined();
  });

  it('renders children in horizontal ScrollView when layout is horizontal', () => {
    render(
      <ChipGroup layout="horizontal">
        <Text>Chip A</Text>
        <Text>Chip B</Text>
      </ChipGroup>,
    );
    expect(screen.getByText('Chip A')).toBeDefined();
    expect(screen.getByText('Chip B')).toBeDefined();
  });
});
