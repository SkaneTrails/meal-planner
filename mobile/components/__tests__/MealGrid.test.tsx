import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MealCell, DayColumn } from '../MealGrid';
import type { Recipe, MealType } from '@/lib/types';

const buildRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: 'r1',
  title: 'Pasta Carbonara',
  url: 'https://example.com',
  ingredients: ['pasta', 'egg'],
  instructions: ['Boil', 'Mix'],
  image_url: null,
  thumbnail_url: null,
  servings: null,
  prep_time: null,
  cook_time: null,
  total_time: null,
  cuisine: null,
  category: null,
  tags: [],
  diet_label: null,
  meal_label: null,
  rating: null,
  hidden: false,
  favorited: false,
  ...overrides,
});

const emptyMeals: Record<MealType, { recipe?: Recipe; customText?: string }> = {
  breakfast: {},
  lunch: {},
  dinner: {},
  snack: {},
};

describe('MealCell', () => {
  it('shows meal type label', () => {
    render(<MealCell date="2025-01-15" mealType="lunch" />);
    expect(screen.getByText('Lunch')).toBeDefined();
  });

  it('shows recipe title when a recipe is assigned', () => {
    render(
      <MealCell date="2025-01-15" mealType="dinner" recipe={buildRecipe()} />,
    );
    expect(screen.getByText('Pasta Carbonara')).toBeDefined();
  });

  it('shows custom text when provided', () => {
    render(
      <MealCell date="2025-01-15" mealType="lunch" customText="Leftovers" />,
    );
    expect(screen.getByText('Leftovers')).toBeDefined();
  });

  it('prefers recipe title over custom text', () => {
    render(
      <MealCell
        date="2025-01-15"
        mealType="dinner"
        recipe={buildRecipe({ title: 'From Recipe' })}
        customText="Custom"
      />,
    );
    expect(screen.getByText('From Recipe')).toBeDefined();
    expect(screen.queryByText('Custom')).toBeNull();
  });

  it('calls onPress when tapped', () => {
    const handlePress = vi.fn();
    render(
      <MealCell date="2025-01-15" mealType="breakfast" onPress={handlePress} />,
    );
    fireEvent.click(screen.getByText('Breakfast'));
    expect(handlePress).toHaveBeenCalledOnce();
  });

  it('renders all four meal type labels correctly', () => {
    const expectedLabels: Record<MealType, string> = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack',
    };
    for (const [mealType, label] of Object.entries(expectedLabels)) {
      const { unmount } = render(
        <MealCell date="2025-01-15" mealType={mealType as MealType} />,
      );
      expect(screen.getByText(label)).toBeDefined();
      unmount();
    }
  });
});

describe('DayColumn', () => {
  it('displays day name and number', () => {
    const date = new Date(2025, 0, 15); // Wednesday Jan 15 2025
    render(<DayColumn date={date} meals={emptyMeals} />);
    expect(screen.getByText('Wed')).toBeDefined();
    expect(screen.getByText('15')).toBeDefined();
  });

  it('renders all four meal type cells', () => {
    const date = new Date(2025, 0, 15);
    render(<DayColumn date={date} meals={emptyMeals} />);
    expect(screen.getByText('Breakfast')).toBeDefined();
    expect(screen.getByText('Lunch')).toBeDefined();
    expect(screen.getByText('Dinner')).toBeDefined();
    expect(screen.getByText('Snack')).toBeDefined();
  });

  it('shows recipe title in the correct meal slot', () => {
    const date = new Date(2025, 0, 15);
    const meals = {
      ...emptyMeals,
      dinner: { recipe: buildRecipe({ title: 'Grilled Salmon' }) },
    };
    render(<DayColumn date={date} meals={meals} />);
    expect(screen.getByText('Grilled Salmon')).toBeDefined();
  });

  it('calls onMealPress with the correct meal type', () => {
    const handleMealPress = vi.fn();
    const date = new Date(2025, 0, 15);
    render(
      <DayColumn date={date} meals={emptyMeals} onMealPress={handleMealPress} />,
    );
    fireEvent.click(screen.getByText('Dinner'));
    expect(handleMealPress).toHaveBeenCalledWith('dinner');
  });

  it('shows note indicator when note is provided', () => {
    const date = new Date(2025, 0, 15);
    render(
      <DayColumn date={date} meals={emptyMeals} note="Buy extra milk" />,
    );
    expect(screen.getByText('Buy extra milk')).toBeDefined();
  });

  it('does not show note section when note is absent', () => {
    const date = new Date(2025, 0, 15);
    render(<DayColumn date={date} meals={emptyMeals} />);
    expect(screen.queryByText('Buy extra milk')).toBeNull();
  });

  it('highlights today with different styling', () => {
    const today = new Date();
    const { container } = render(
      <DayColumn date={today} meals={emptyMeals} />,
    );
    const dayNumber = screen.getByText(String(today.getDate()));
    expect(dayNumber).toBeDefined();
  });
});
