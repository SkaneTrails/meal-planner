import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Text } from 'react-native';
import { BottomActionBar } from '../BottomActionBar';

describe('BottomActionBar', () => {
  it('renders children', () => {
    render(
      <BottomActionBar>
        <Text>Save</Text>
      </BottomActionBar>,
    );
    expect(screen.getByText('Save')).toBeDefined();
  });

  it('renders multiple children', () => {
    render(
      <BottomActionBar>
        <Text>Cancel</Text>
        <Text>Confirm</Text>
      </BottomActionBar>,
    );
    expect(screen.getByText('Cancel')).toBeDefined();
    expect(screen.getByText('Confirm')).toBeDefined();
  });
});
