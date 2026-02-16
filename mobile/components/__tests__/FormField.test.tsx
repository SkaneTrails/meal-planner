import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Text } from 'react-native';
import { FormField } from '../FormField';

describe('FormField', () => {
  it('renders label and children', () => {
    render(
      <FormField label="Recipe Name">
        <Text>Input goes here</Text>
      </FormField>,
    );
    expect(screen.getByText('Recipe Name')).toBeDefined();
    expect(screen.getByText('Input goes here')).toBeDefined();
  });

  it('renders with compact variant', () => {
    render(
      <FormField label="Prep Time" compact>
        <Text>15</Text>
      </FormField>,
    );
    expect(screen.getByText('Prep Time')).toBeDefined();
    expect(screen.getByText('15')).toBeDefined();
  });
});
