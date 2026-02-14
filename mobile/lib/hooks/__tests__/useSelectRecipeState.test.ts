import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createQueryWrapper, mockRecipe } from '@/test/helpers';
import type { Recipe, MealType } from '@/lib/types';

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
const mockRouterReplace = vi.fn();
const mockRouterBack = vi.fn();
const mockSetMealMutateAsync = vi.fn().mockResolvedValue(undefined);
const mockRemoveMealMutateAsync = vi.fn().mockResolvedValue(undefined);
const mockUpdateExtrasMutateAsync = vi.fn().mockResolvedValue(undefined);

const lunchRecipe = mockRecipe({
  id: 'recipe-lunch',
  title: 'Pasta Carbonara',
  meal_label: 'meal',
});

const breakfastRecipe = mockRecipe({
  id: 'recipe-bfast',
  title: 'Oatmeal',
  meal_label: 'breakfast',
});

const dessertRecipe = mockRecipe({
  id: 'recipe-dessert',
  title: 'Tiramisu',
  meal_label: 'dessert',
});

const grillRecipe = mockRecipe({
  id: 'recipe-grill',
  title: 'BBQ Ribs',
  meal_label: 'grill',
});

const allRecipes: Recipe[] = [lunchRecipe, breakfastRecipe, dessertRecipe, grillRecipe];

let mockSearchParams: Record<string, string | undefined> = {
  date: '2026-02-14',
  mealType: 'dinner',
};

let mockMealPlan: { meals?: Record<string, string>; extras?: string[] } | undefined = {
  meals: {
    '2026-02-10_lunch': 'recipe-lunch',
    '2026-02-10_dinner': 'custom:Pizza night',
  },
  extras: [],
};

vi.mock('expo-router', () => ({
  useLocalSearchParams: vi.fn(() => mockSearchParams),
  useRouter: vi.fn(() => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    back: mockRouterBack,
  })),
}));

vi.mock('@/lib/hooks', () => ({
  useAllRecipes: vi.fn(() => ({ recipes: allRecipes, totalCount: allRecipes.length })),
  useMealPlan: vi.fn(() => ({ data: mockMealPlan })),
  useSetMeal: vi.fn(() => ({ mutateAsync: mockSetMealMutateAsync })),
  useRemoveMeal: vi.fn(() => ({ mutateAsync: mockRemoveMealMutateAsync })),
  useUpdateExtras: vi.fn(() => ({ mutateAsync: mockUpdateExtrasMutateAsync })),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}));

vi.mock('@/lib/alert', () => ({
  showNotification: vi.fn(),
}));

vi.mock('@/lib/utils/dateFormatter', () => ({
  formatDateLocal: (d: Date) => d.toISOString().split('T')[0],
  toBcp47: (lang: string) => lang,
}));

import { showNotification } from '@/lib/alert';
import { useSelectRecipeState } from '../useSelectRecipeState';

describe('useSelectRecipeState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = { date: '2026-02-14', mealType: 'dinner' };
    mockMealPlan = {
      meals: {
        '2026-02-10_lunch': 'recipe-lunch',
        '2026-02-10_dinner': 'custom:Pizza night',
      },
      extras: [],
    };
  });

  const render = () =>
    renderHook(() => useSelectRecipeState(), { wrapper: createQueryWrapper() });

  describe('search and filtering', () => {
    it('returns all recipes when searchQuery is empty', () => {
      const { result } = render();
      expect(result.current.filteredRecipes).toHaveLength(4);
    });

    it('filters recipes by title', () => {
      const { result } = render();
      act(() => result.current.setSearchQuery('pasta'));
      expect(result.current.filteredRecipes).toHaveLength(1);
      expect(result.current.filteredRecipes[0].id).toBe('recipe-lunch');
    });

    it('returns empty list when no recipes match search', () => {
      const { result } = render();
      act(() => result.current.setSearchQuery('nonexistent'));
      expect(result.current.filteredRecipes).toHaveLength(0);
    });
  });

  describe('mealType filtering', () => {
    it('filters recipes for dinner mealType (allows "meal" and "grill" labels)', () => {
      const { result } = render();
      expect(result.current.mealTypeRecipes).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: 'recipe-lunch' })]),
      );
    });

    it('filters recipes for breakfast mealType', () => {
      mockSearchParams = { date: '2026-02-14', mealType: 'breakfast' };
      const { result } = render();
      expect(result.current.mealTypeRecipes).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: 'recipe-bfast' })]),
      );
      expect(result.current.mealTypeRecipes).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: 'recipe-lunch' })]),
      );
    });

    it('filters recipes for snack mealType (allows "dessert" and "drink")', () => {
      mockSearchParams = { date: '2026-02-14', mealType: 'snack' };
      const { result } = render();
      expect(result.current.mealTypeRecipes).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: 'recipe-dessert' })]),
      );
    });
  });

  describe('random recipe', () => {
    it('returns a recipe from mealType-filtered list', () => {
      const { result } = render();
      expect(result.current.randomRecipe).not.toBeNull();
    });

    it('shuffleRandom changes the selected recipe ref', () => {
      const { result } = render();
      const firstId = result.current.randomRecipe?.id;
      let changed = false;
      for (let i = 0; i < 20; i++) {
        act(() => result.current.shuffleRandom());
        if (result.current.randomRecipe?.id !== firstId) {
          changed = true;
          break;
        }
      }
      expect(changed || allRecipes.length <= 1).toBe(true);
    });
  });

  describe('tab state', () => {
    it('defaults to library tab', () => {
      const { result } = render();
      expect(result.current.activeTab).toBe('library');
    });

    it('starts on copy tab when mode=copy', () => {
      mockSearchParams = { date: '2026-02-14', mealType: 'dinner', mode: 'copy' };
      const { result } = render();
      expect(result.current.activeTab).toBe('copy');
    });

    it('allows changing tab', () => {
      const { result } = render();
      act(() => result.current.setActiveTab('random'));
      expect(result.current.activeTab).toBe('random');
    });
  });

  describe('formatted date', () => {
    it('returns a formatted date string', () => {
      const { result } = render();
      expect(result.current.formattedDate).toBeTruthy();
    });
  });

  describe('handleSelectRecipe', () => {
    it('calls setMeal and navigates to meal-plan', async () => {
      const { result } = render();
      await act(() => result.current.handleSelectRecipe('recipe-lunch'));
      expect(mockSetMealMutateAsync).toHaveBeenCalledWith({
        date: '2026-02-14',
        mealType: 'dinner',
        recipeId: 'recipe-lunch',
      });
      expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)/meal-plan');
    });

    it('shows notification on error', async () => {
      mockSetMealMutateAsync.mockRejectedValueOnce(new Error('fail'));
      const { result } = render();
      await act(() => result.current.handleSelectRecipe('recipe-lunch'));
      expect(showNotification).toHaveBeenCalledWith(
        'common.error',
        'selectRecipe.failedToSetMeal',
      );
    });
  });

  describe('handleSetCustomText', () => {
    it('does nothing when customText is empty', async () => {
      const { result } = render();
      await act(() => result.current.handleSetCustomText());
      expect(mockSetMealMutateAsync).not.toHaveBeenCalled();
    });

    it('calls setMeal with custom text and navigates', async () => {
      const { result } = render();
      act(() => result.current.setCustomText('Leftover pasta'));
      await act(() => result.current.handleSetCustomText());
      expect(mockSetMealMutateAsync).toHaveBeenCalledWith({
        date: '2026-02-14',
        mealType: 'dinner',
        customText: 'Leftover pasta',
      });
      expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)/meal-plan');
    });
  });

  describe('handleCopyMeal', () => {
    it('copies a recipe meal', async () => {
      const { result } = render();
      await act(() => result.current.handleCopyMeal('recipe-lunch'));
      expect(mockSetMealMutateAsync).toHaveBeenCalledWith({
        date: '2026-02-14',
        mealType: 'dinner',
        recipeId: 'recipe-lunch',
      });
    });

    it('copies a custom text meal', async () => {
      const { result } = render();
      await act(() => result.current.handleCopyMeal(undefined, 'Pizza night'));
      expect(mockSetMealMutateAsync).toHaveBeenCalledWith({
        date: '2026-02-14',
        mealType: 'dinner',
        customText: 'Pizza night',
      });
    });

    it('shows notification on error', async () => {
      mockSetMealMutateAsync.mockRejectedValueOnce(new Error('fail'));
      const { result } = render();
      await act(() => result.current.handleCopyMeal('recipe-lunch'));
      expect(showNotification).toHaveBeenCalledWith(
        'common.error',
        'selectRecipe.failedToCopyMeal',
      );
    });
  });

  describe('handleRemoveMeal', () => {
    it('calls removeMeal and navigates back', async () => {
      const { result } = render();
      await act(() => result.current.handleRemoveMeal());
      expect(mockRemoveMealMutateAsync).toHaveBeenCalledWith({
        date: '2026-02-14',
        mealType: 'dinner',
      });
      expect(mockRouterBack).toHaveBeenCalled();
    });

    it('shows notification on error', async () => {
      mockRemoveMealMutateAsync.mockRejectedValueOnce(new Error('fail'));
      const { result } = render();
      await act(() => result.current.handleRemoveMeal());
      expect(showNotification).toHaveBeenCalledWith(
        'common.error',
        'selectRecipe.failedToRemoveMeal',
      );
    });
  });

  describe('handleAddToExtras', () => {
    it('adds recipe to extras and navigates', async () => {
      const { result } = render();
      await act(() => result.current.handleAddToExtras('recipe-lunch'));
      expect(mockUpdateExtrasMutateAsync).toHaveBeenCalledWith({
        extras: ['recipe-lunch'],
      });
      expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)/meal-plan');
    });

    it('shows notification when recipe already in extras', async () => {
      mockMealPlan = { meals: {}, extras: ['recipe-lunch'] };
      const { result } = render();
      await act(() => result.current.handleAddToExtras('recipe-lunch'));
      expect(mockUpdateExtrasMutateAsync).not.toHaveBeenCalled();
      expect(showNotification).toHaveBeenCalledWith(
        'mealPlan.extras.alreadyAdded',
        'mealPlan.extras.alreadyAddedMessage',
      );
    });

    it('shows notification on error', async () => {
      mockUpdateExtrasMutateAsync.mockRejectedValueOnce(new Error('fail'));
      const { result } = render();
      await act(() => result.current.handleAddToExtras('recipe-lunch'));
      expect(showNotification).toHaveBeenCalledWith(
        'common.error',
        'mealPlan.extras.failedToAdd',
      );
    });
  });

  describe('existingMeals for copy tab', () => {
    it('returns meals from the target week excluding current slot', () => {
      mockMealPlan = {
        meals: {
          '2026-02-10_lunch': 'recipe-lunch',
          '2026-02-10_dinner': 'custom:Pizza night',
          '2026-02-14_dinner': 'recipe-lunch',
        },
        extras: [],
      };
      const { result } = render();
      const existing = result.current.existingMeals;
      expect(existing).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: '2026-02-14_dinner' }),
        ]),
      );
    });

    it('returns custom text meals with customText field', () => {
      mockMealPlan = {
        meals: { '2026-02-10_dinner': 'custom:Pizza night' },
        extras: [],
      };
      const { result } = render();
      const customMeal = result.current.existingMeals.find(m => m.customText);
      expect(customMeal?.customText).toBe('Pizza night');
    });
  });

  describe('MEAL_TYPE_LABELS', () => {
    it('provides labels for all meal types', () => {
      const { result } = render();
      expect(result.current.MEAL_TYPE_LABELS).toHaveProperty('breakfast');
      expect(result.current.MEAL_TYPE_LABELS).toHaveProperty('lunch');
      expect(result.current.MEAL_TYPE_LABELS).toHaveProperty('dinner');
      expect(result.current.MEAL_TYPE_LABELS).toHaveProperty('snack');
    });
  });
});
