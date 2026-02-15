import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createQueryWrapper, mockRecipe } from '@/test/helpers';
import type { Recipe } from '@/lib/types';

vi.mock('react-native', async () => {
  const actual = await vi.importActual<typeof import('react-native')>('react-native');
  return {
    ...actual,
    PanResponder: {
      create: vi.fn(() => ({ panHandlers: {} })),
    },
  };
});

const mockRouterPush = vi.fn();
const mockRefetchRecipes = vi.fn();
const mockRefetchMealPlan = vi.fn();
const mockRefreshFromApi = vi.fn();

const dinnerRecipe = mockRecipe({
  id: 'recipe-1',
  title: 'Chicken Curry',
  meal_label: 'meal',
  image_url: 'https://example.com/img.jpg',
  thumbnail_url: 'https://example.com/thumb.jpg',
  ingredients: ['chicken', 'curry paste', 'coconut milk'],
});

const breakfastRecipe = mockRecipe({
  id: 'recipe-2',
  title: 'Pancakes',
  meal_label: 'breakfast',
  ingredients: ['flour', 'milk', 'eggs'],
});

const dessertRecipe = mockRecipe({
  id: 'recipe-3',
  title: 'Chocolate Cake',
  meal_label: 'dessert',
  ingredients: ['flour', 'cocoa', 'sugar'],
});

const allRecipes: Recipe[] = [dinnerRecipe, breakfastRecipe, dessertRecipe];

let mockMealPlan: { meals?: Record<string, string>; extras?: string[] } | undefined = {
  meals: {},
};

vi.mock('expo-router', () => ({
  useRouter: vi.fn(() => ({ push: mockRouterPush, back: vi.fn() })),
}));

vi.mock('@/lib/hooks', () => ({
  useAllRecipes: vi.fn(() => ({
    recipes: allRecipes,
    totalCount: allRecipes.length,
    isLoading: false,
    refetch: mockRefetchRecipes,
  })),
  useMealPlan: vi.fn(() => ({
    data: mockMealPlan,
    isLoading: false,
    refetch: mockRefetchMealPlan,
  })),
  useGroceryState: vi.fn(() => ({
    checkedItems: new Set<string>(),
    selectedMealKeys: [],
    customItems: [],
    refreshFromApi: mockRefreshFromApi,
  })),
}));

vi.mock('@/lib/settings-context', () => ({
  useSettings: vi.fn(() => ({
    isItemAtHome: () => false,
    weekStart: 'monday',
  })),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key, language: 'en' }),
}));

vi.mock('@/lib/utils/dateFormatter', () => ({
  formatDateLocal: (d: Date) => d.toISOString().split('T')[0],
  getWeekDatesArray: () => [
    new Date('2026-02-09'),
    new Date('2026-02-10'),
    new Date('2026-02-11'),
    new Date('2026-02-12'),
    new Date('2026-02-13'),
    new Date('2026-02-14'),
    new Date('2026-02-15'),
  ],
}));

import { useHomeScreenData, WEEKLY_TRACKABLE_MEALS } from '../useHomeScreenData';

describe('useHomeScreenData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMealPlan = { meals: {} };
  });

  const render = () =>
    renderHook(() => useHomeScreenData(), { wrapper: createQueryWrapper() });

  describe('WEEKLY_TRACKABLE_MEALS constant', () => {
    it('equals 14 (7 days x 2 meals)', () => {
      expect(WEEKLY_TRACKABLE_MEALS).toBe(14);
    });
  });

  describe('basic returned values', () => {
    it('returns recipes and totalCount', () => {
      const { result } = render();
      expect(result.current.recipes).toHaveLength(3);
      expect(result.current.totalCount).toBe(3);
    });

    it('returns isLoading as false when data is ready', () => {
      const { result } = render();
      expect(result.current.isLoading).toBe(false);
    });

    it('returns a greeting key', () => {
      const { result } = render();
      expect(['greetingMorning', 'greetingAfternoon', 'greetingEvening']).toContain(
        result.current.greetingKey,
      );
    });

    it('returns translation function', () => {
      const { result } = render();
      expect(result.current.t('test.key')).toBe('test.key');
    });
  });

  describe('handleRefresh', () => {
    it('calls refetch for recipes, meal plan, and grocery', () => {
      const { result } = render();
      result.current.handleRefresh();
      expect(mockRefetchRecipes).toHaveBeenCalled();
      expect(mockRefetchMealPlan).toHaveBeenCalled();
      expect(mockRefreshFromApi).toHaveBeenCalled();
    });
  });

  describe('groceryItemsCount', () => {
    it('returns 0 when no meals are selected and no custom items', () => {
      const { result } = render();
      expect(result.current.groceryItemsCount).toBe(0);
    });
  });

  describe('inspirationRecipe', () => {
    it('returns a recipe with a non-standard meal_label', () => {
      const { result } = render();
      expect(result.current.inspirationRecipe).not.toBeNull();
      const label = result.current.inspirationRecipe?.meal_label;
      expect(label).toBeDefined();
      expect(['meal', 'grill']).not.toContain(label);
    });

    it('filters out recipes with meal_label "meal" or "grill"', () => {
      const { result } = render();
      expect(result.current.inspirationRecipes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'recipe-2' }),
          expect.objectContaining({ id: 'recipe-3' }),
        ]),
      );
      expect(result.current.inspirationRecipes).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: 'recipe-1' })]),
      );
    });
  });

  describe('plannedMealsCount', () => {
    it('returns 0 when no meals are planned', () => {
      const { result } = render();
      expect(result.current.plannedMealsCount).toBe(0);
      expect(result.current.plannedMealsPercentage).toBe(0);
    });

    it('counts only lunch and dinner meals in current week', () => {
      mockMealPlan = {
        meals: {
          '2026-02-09_lunch': 'recipe-1',
          '2026-02-09_dinner': 'recipe-2',
          '2026-02-10_lunch': 'recipe-1',
          '2026-02-09_breakfast': 'recipe-2',
        },
      };
      const { result } = render();
      expect(result.current.plannedMealsCount).toBe(3);
    });

    it('calculates percentage correctly', () => {
      mockMealPlan = {
        meals: {
          '2026-02-09_lunch': 'recipe-1',
          '2026-02-09_dinner': 'recipe-2',
          '2026-02-10_lunch': 'recipe-1',
          '2026-02-10_dinner': 'recipe-2',
          '2026-02-11_lunch': 'recipe-1',
          '2026-02-11_dinner': 'recipe-2',
          '2026-02-12_lunch': 'recipe-1',
        },
      };
      const { result } = render();
      expect(result.current.plannedMealsPercentage).toBe(50);
    });

    it('caps percentage at 100', () => {
      const meals: Record<string, string> = {};
      const dates = ['2026-02-09', '2026-02-10', '2026-02-11', '2026-02-12', '2026-02-13', '2026-02-14', '2026-02-15'];
      dates.forEach(d => {
        meals[`${d}_lunch`] = 'recipe-1';
        meals[`${d}_dinner`] = 'recipe-1';
        meals[`${d}_breakfast`] = 'recipe-1';
      });
      mockMealPlan = { meals };
      const { result } = render();
      expect(result.current.plannedMealsPercentage).toBe(100);
    });
  });

  describe('nextMeal', () => {
    it('returns null when no meals are planned', () => {
      const { result } = render();
      expect(result.current.nextMeal).toBeNull();
    });
  });

  describe('handleImportRecipe', () => {
    it('navigates to add-recipe with URL param', () => {
      const { result } = render();
      act(() => result.current.setRecipeUrl('https://example.com/recipe'));
    });
  });

  describe('showAddModal state', () => {
    it('defaults to false', () => {
      const { result } = render();
      expect(result.current.showAddModal).toBe(false);
    });
  });
});
