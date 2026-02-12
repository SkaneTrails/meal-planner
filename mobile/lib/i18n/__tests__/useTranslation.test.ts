/**
 * Tests for the useTranslation hook.
 *
 * We test the core logic (resolve, interpolate, fallback) by controlling
 * the mocked language setting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTranslation } from '../index';

// The setup.ts mock already provides useSettings with language: 'en'.
// We import the mocked version so we can change the return value per test.
const { useSettings } = await import('@/lib/settings-context');
const mockUseSettings = vi.mocked(useSettings);

describe('useTranslation', () => {
  beforeEach(() => {
    // Default: English
    mockUseSettings.mockReturnValue({
      settings: { language: 'en', itemsAtHome: [], favoriteRecipes: [], showHiddenRecipes: false },
      isLoading: false,
      setLanguage: vi.fn(),
      addItemAtHome: vi.fn(),
      removeItemAtHome: vi.fn(),
      isItemAtHome: vi.fn(() => false),
      toggleFavorite: vi.fn(),
      isFavorite: vi.fn(() => false),
      toggleShowHiddenRecipes: vi.fn(),
    });
  });

  it('returns English strings by default', () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('common.cancel')).toBe('Cancel');
    expect(result.current.language).toBe('en');
  });

  it('resolves nested keys', () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('labels.diet.veggie')).toBe('Veggie');
    expect(result.current.t('home.stats.recipes')).toBe('Recipes');
  });

  it('interpolates {{variable}} placeholders', () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('recipes.collectionCount', { count: 42 })).toBe(
      '42 recipes in your collection',
    );
  });

  it('interpolates multiple placeholders', () => {
    const { result } = renderHook(() => useTranslation());
    expect(
      result.current.t('recipe.addedToMealPlanMessage', {
        title: 'Pasta',
        mealType: 'Dinner',
        date: 'Monday',
      }),
    ).toBe('Pasta added to Dinner on Monday');
  });

  it('returns the raw key when key does not exist', () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('returns Swedish strings when language is sv', () => {
    mockUseSettings.mockReturnValue({
      settings: { language: 'sv', itemsAtHome: [], favoriteRecipes: [], showHiddenRecipes: false },
      isLoading: false,
      setLanguage: vi.fn(),
      addItemAtHome: vi.fn(),
      removeItemAtHome: vi.fn(),
      isItemAtHome: vi.fn(() => false),
      toggleFavorite: vi.fn(),
      isFavorite: vi.fn(() => false),
      toggleShowHiddenRecipes: vi.fn(),
    });

    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('common.cancel')).toBe('Avbryt');
    expect(result.current.language).toBe('sv');
  });

  it('returns Italian strings when language is it', () => {
    mockUseSettings.mockReturnValue({
      settings: { language: 'it', itemsAtHome: [], favoriteRecipes: [], showHiddenRecipes: false },
      isLoading: false,
      setLanguage: vi.fn(),
      addItemAtHome: vi.fn(),
      removeItemAtHome: vi.fn(),
      isItemAtHome: vi.fn(() => false),
      toggleFavorite: vi.fn(),
      isFavorite: vi.fn(() => false),
      toggleShowHiddenRecipes: vi.fn(),
    });

    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('common.cancel')).toBe('Annulla');
    expect(result.current.language).toBe('it');
  });

  it('falls back to English for an unknown language', () => {
    mockUseSettings.mockReturnValue({
      settings: { language: 'xx' as any, itemsAtHome: [], favoriteRecipes: [], showHiddenRecipes: false },
      isLoading: false,
      setLanguage: vi.fn(),
      addItemAtHome: vi.fn(),
      removeItemAtHome: vi.fn(),
      isItemAtHome: vi.fn(() => false),
      toggleFavorite: vi.fn(),
      isFavorite: vi.fn(() => false),
      toggleShowHiddenRecipes: vi.fn(),
    });

    const { result } = renderHook(() => useTranslation());
    expect(result.current.t('common.cancel')).toBe('Cancel');
  });

  it('preserves unreplaced placeholders when params are missing', () => {
    const { result } = renderHook(() => useTranslation());
    // Only supply 'title', not 'mealType' or 'date'
    expect(
      result.current.t('recipe.addedToMealPlanMessage', { title: 'Pasta' }),
    ).toBe('Pasta added to {{mealType}} on {{date}}');
  });
});
