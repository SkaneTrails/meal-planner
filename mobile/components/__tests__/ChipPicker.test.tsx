import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { ChipPicker } from '../ChipPicker';

const DIET_OPTIONS = [
  { value: null, labelKey: 'labels.diet.none', emoji: '➖' },
  { value: 'veggie', labelKey: 'labels.diet.veggie', emoji: '🥬' },
  { value: 'fish', labelKey: 'labels.diet.fish', emoji: '🐟' },
];

const MEAL_OPTIONS = [
  { value: null, labelKey: 'labels.meal.none' },
  { value: 'breakfast', labelKey: 'labels.meal.breakfast' },
];

const mockT = (key: string) => key;

describe('ChipPicker', () => {
  it('renders label and all options', () => {
    render(
      <ChipPicker
        label="Diet Type"
        options={DIET_OPTIONS}
        selected={null}
        onSelect={vi.fn()}
        t={mockT}
      />,
    );
    expect(screen.getByText('Diet Type')).toBeDefined();
    expect(screen.getByText('labels.diet.none')).toBeDefined();
    expect(screen.getByText('labels.diet.veggie')).toBeDefined();
    expect(screen.getByText('labels.diet.fish')).toBeDefined();
  });

  it('renders emoji when present', () => {
    render(
      <ChipPicker
        label="Diet"
        options={DIET_OPTIONS}
        selected={null}
        onSelect={vi.fn()}
        t={mockT}
      />,
    );
    expect(screen.getByText('🥬')).toBeDefined();
    expect(screen.getByText('🐟')).toBeDefined();
  });

  it('renders options without emoji', () => {
    render(
      <ChipPicker
        label="Meal"
        options={MEAL_OPTIONS}
        selected={null}
        onSelect={vi.fn()}
        t={mockT}
      />,
    );
    expect(screen.getByText('labels.meal.none')).toBeDefined();
    expect(screen.getByText('labels.meal.breakfast')).toBeDefined();
  });

  it('calls onSelect when chip is pressed', () => {
    const handleSelect = vi.fn();
    render(
      <ChipPicker
        label="Diet"
        options={DIET_OPTIONS}
        selected={null}
        onSelect={handleSelect}
        t={mockT}
      />,
    );
    fireEvent.click(screen.getByText('labels.diet.veggie'));
    expect(handleSelect).toHaveBeenCalledWith('veggie');
  });

  it('calls onSelect with null for none option', () => {
    const handleSelect = vi.fn();
    render(
      <ChipPicker
        label="Diet"
        options={DIET_OPTIONS}
        selected="veggie"
        onSelect={handleSelect}
        t={mockT}
      />,
    );
    fireEvent.click(screen.getByText('labels.diet.none'));
    expect(handleSelect).toHaveBeenCalledWith(null);
  });

  it('accepts variant prop without error', () => {
    render(
      <ChipPicker
        label="Diet"
        options={DIET_OPTIONS}
        selected={null}
        onSelect={vi.fn()}
        t={mockT}
        variant="solid"
      />,
    );
    expect(screen.getByText('Diet')).toBeDefined();
  });
});
