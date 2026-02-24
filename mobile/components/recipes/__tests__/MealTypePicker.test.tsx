/**
 * Tests for the MealTypePicker bottom sheet content component.
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MealTypePicker } from '../MealTypePicker';

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    'labels.meal.breakfast': 'Breakfast',
    'labels.meal.starter': 'Starter',
    'labels.meal.salad': 'Salad',
    'labels.meal.meal': 'Meal',
    'labels.meal.dessert': 'Dessert',
    'labels.meal.drink': 'Drink',
    'labels.meal.sauce': 'Sauce',
    'labels.meal.pickle': 'Pickle',
    'labels.meal.grill': 'Grill',
    'labels.diet.all': 'All',
    'recipes.mealType': 'Meal',
    'recipes.mealTypeCount': '{{count}} types',
  };
  return translations[key] ?? key;
};

describe('MealTypePicker', () => {
  it('renders all 9 meal types', () => {
    render(
      <MealTypePicker
        selected={[]}
        onToggle={vi.fn()}
        onClear={vi.fn()}
        t={mockT}
      />,
    );

    expect(screen.getByText('Breakfast')).toBeDefined();
    expect(screen.getByText('Starter')).toBeDefined();
    expect(screen.getByText('Salad')).toBeDefined();
    expect(screen.getByText('Meal')).toBeDefined();
    expect(screen.getByText('Dessert')).toBeDefined();
    expect(screen.getByText('Drink')).toBeDefined();
    expect(screen.getByText('Sauce')).toBeDefined();
    expect(screen.getByText('Pickle')).toBeDefined();
    expect(screen.getByText('Grill')).toBeDefined();
  });

  it('calls onToggle when a meal type is pressed', () => {
    const handleToggle = vi.fn();
    render(
      <MealTypePicker
        selected={[]}
        onToggle={handleToggle}
        onClear={vi.fn()}
        t={mockT}
      />,
    );

    fireEvent.click(screen.getByText('Salad'));
    expect(handleToggle).toHaveBeenCalledWith('salad');
  });

  it('calls onToggle for already-selected type (deselect)', () => {
    const handleToggle = vi.fn();
    render(
      <MealTypePicker
        selected={['salad']}
        onToggle={handleToggle}
        onClear={vi.fn()}
        t={mockT}
      />,
    );

    fireEvent.click(screen.getByText('Salad'));
    expect(handleToggle).toHaveBeenCalledWith('salad');
  });

  it('does not show clear button when nothing selected', () => {
    render(
      <MealTypePicker
        selected={[]}
        onToggle={vi.fn()}
        onClear={vi.fn()}
        t={mockT}
      />,
    );

    expect(screen.queryByText('All')).toBeNull();
  });

  it('shows clear button when types are selected', () => {
    render(
      <MealTypePicker
        selected={['salad', 'drink']}
        onToggle={vi.fn()}
        onClear={vi.fn()}
        t={mockT}
      />,
    );

    expect(screen.getByText('All')).toBeDefined();
  });

  it('calls onClear when clear button is pressed', () => {
    const handleClear = vi.fn();
    render(
      <MealTypePicker
        selected={['breakfast']}
        onToggle={vi.fn()}
        onClear={handleClear}
        t={mockT}
      />,
    );

    fireEvent.click(screen.getByText('All'));
    expect(handleClear).toHaveBeenCalledOnce();
  });

  it('supports multi-select (renders multiple selected)', () => {
    render(
      <MealTypePicker
        selected={['breakfast', 'dessert', 'grill']}
        onToggle={vi.fn()}
        onClear={vi.fn()}
        t={mockT}
      />,
    );

    expect(screen.getByText('All')).toBeDefined();
  });
});
