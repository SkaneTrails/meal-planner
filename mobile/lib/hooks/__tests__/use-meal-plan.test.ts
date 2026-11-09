/**
 * Tests for meal plan hooks — verifies the custom text prefix logic.
 *
 * Real logic tested:
 * - useSetMeal: constructs `custom:` prefix for custom text meals
 * - useSetMeal: passes recipeId directly when provided
 * - useSetMeal: passes null when neither recipeId nor customText provided
 * - useRemoveMeal: passes null value to clear a meal slot
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createQueryWrapper } from '@/test/helpers';

const mockUpdateMeal = vi.fn();
const mockGetMealPlan = vi.fn();
const mockUpdateMealPlan = vi.fn();
const mockUpdateNote = vi.fn();
const mockClearMealPlan = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    updateMeal: (...args: any[]) => mockUpdateMeal(...args),
    getMealPlan: (...args: any[]) => mockGetMealPlan(...args),
    updateMealPlan: (...args: any[]) => mockUpdateMealPlan(...args),
    updateNote: (...args: any[]) => mockUpdateNote(...args),
    clearMealPlan: (...args: any[]) => mockClearMealPlan(...args),
  },
}));

import {
  useMealPlan,
  useUpdateMealPlan,
  useSetMeal,
  useRemoveMeal,
  useUpdateNote,
  useClearMealPlan,
} from '@/lib/hooks/use-meal-plan';

describe('useMealPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMealPlan.mockResolvedValue({ meals: { 'monday-dinner': 'recipe-1' } });
  });

  it('fetches the meal plan', async () => {
    const { result } = renderHook(() => useMealPlan(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetMealPlan).toHaveBeenCalledTimes(1);
    expect(result.current.data?.meals).toBeDefined();
  });
});

describe('useUpdateMealPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateMealPlan.mockResolvedValue({ meals: {} });
  });

  it('sends the full meal plan update', async () => {
    const { result } = renderHook(() => useUpdateMealPlan(), {
      wrapper: createQueryWrapper(),
    });

    const updates = { meals: { 'monday-dinner': 'recipe-abc' } };
    await act(async () => {
      await result.current.mutateAsync(updates);
    });

    expect(mockUpdateMealPlan).toHaveBeenCalledWith(updates);
  });
});

describe('useUpdateNote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateNote.mockResolvedValue({ meals: {}, notes: { monday: 'Buy groceries' } });
  });

  it('sends a note update', async () => {
    const { result } = renderHook(() => useUpdateNote(), {
      wrapper: createQueryWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ date: '2025-01-20', note: 'Buy groceries' });
    });

    expect(mockUpdateNote).toHaveBeenCalledWith({
      date: '2025-01-20',
      note: 'Buy groceries',
    });
  });
});

describe('useClearMealPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClearMealPlan.mockResolvedValue(undefined);
  });

  it('clears the meal plan', async () => {
    const { result } = renderHook(() => useClearMealPlan(), {
      wrapper: createQueryWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(mockClearMealPlan).toHaveBeenCalledTimes(1);
  });
});

describe('useSetMeal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateMeal.mockResolvedValue({ meals: {} });
  });

  it('passes recipeId directly as value', async () => {
    const { result } = renderHook(() => useSetMeal(), {
      wrapper: createQueryWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        date: '2025-01-20',
        mealType: 'dinner',
        recipeId: 'recipe-abc',
      });
    });

    expect(mockUpdateMeal).toHaveBeenCalledWith({
      date: '2025-01-20',
      meal_type: 'dinner',
      value: 'recipe-abc',
    });
  });

  it('prefixes custom text with "custom:"', async () => {
    const { result } = renderHook(() => useSetMeal(), {
      wrapper: createQueryWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        date: '2025-01-20',
        mealType: 'lunch',
        customText: 'Leftovers from yesterday',
      });
    });

    expect(mockUpdateMeal).toHaveBeenCalledWith({
      date: '2025-01-20',
      meal_type: 'lunch',
      value: 'custom:Leftovers from yesterday',
    });
  });

  it('prefers recipeId over customText when both provided', async () => {
    const { result } = renderHook(() => useSetMeal(), {
      wrapper: createQueryWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        date: '2025-01-20',
        mealType: 'dinner',
        recipeId: 'recipe-abc',
        customText: 'Should be ignored',
      });
    });

    expect(mockUpdateMeal).toHaveBeenCalledWith({
      date: '2025-01-20',
      meal_type: 'dinner',
      value: 'recipe-abc',
    });
  });

  it('passes null when neither recipeId nor customText provided', async () => {
    const { result } = renderHook(() => useSetMeal(), {
      wrapper: createQueryWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        date: '2025-01-20',
        mealType: 'dinner',
      });
    });

    expect(mockUpdateMeal).toHaveBeenCalledWith({
      date: '2025-01-20',
      meal_type: 'dinner',
      value: null,
    });
  });
});

describe('useRemoveMeal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateMeal.mockResolvedValue({ meals: {} });
  });

  it('sends null value to clear a meal slot', async () => {
    const { result } = renderHook(() => useRemoveMeal(), {
      wrapper: createQueryWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        date: '2025-01-20',
        mealType: 'dinner',
      });
    });

    expect(mockUpdateMeal).toHaveBeenCalledWith({
      date: '2025-01-20',
      meal_type: 'dinner',
      value: null,
    });
  });
});
