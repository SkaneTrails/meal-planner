/**
 * Tests for useLanguageSync and useUpdateHouseholdLanguage hooks.
 *
 * Real logic tested:
 * - useLanguageSync: syncs Firestore language → local settings on first load
 * - useLanguageSync: skips sync when languages already match
 * - useLanguageSync: ignores unsupported language values from Firestore
 * - useUpdateHouseholdLanguage: calls API to update household language
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createQueryWrapper } from '@/test/helpers';
import { useSettings } from '@/lib/settings-context';

vi.mock('@/lib/api', () => ({
  api: {
    getHouseholdSettings: vi.fn(),
    updateHouseholdSettings: vi.fn(),
  },
}));

import { api } from '@/lib/api';
import { useLanguageSync, useUpdateHouseholdLanguage } from '../use-language-sync';

const mockApi = vi.mocked(api);
const mockUseSettings = vi.mocked(useSettings);

describe('useLanguageSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSettings.mockReturnValue({
      settings: { language: 'en', itemsAtHome: [], favoriteRecipes: [] },
      isLoading: false,
      setLanguage: vi.fn(),
      addItemAtHome: vi.fn(),
      removeItemAtHome: vi.fn(),
      isItemAtHome: vi.fn(() => false),
      toggleFavorite: vi.fn(),
      isFavorite: vi.fn(() => false),
    });
  });

  it('syncs language from Firestore when it differs from local', async () => {
    const mockSetLanguage = vi.fn();
    mockUseSettings.mockReturnValue({
      settings: { language: 'en', itemsAtHome: [], favoriteRecipes: [] },
      isLoading: false,
      setLanguage: mockSetLanguage,
      addItemAtHome: vi.fn(),
      removeItemAtHome: vi.fn(),
      isItemAtHome: vi.fn(() => false),
      toggleFavorite: vi.fn(),
      isFavorite: vi.fn(() => false),
    });
    mockApi.getHouseholdSettings.mockResolvedValue({
      household_size: 2,
      default_servings: 2,
      language: 'sv',
      dietary: { seafood_ok: true, meat: 'all', minced_meat: 'meat', dairy: 'regular' },
      equipment: { airfryer: false, convection_oven: true, grill_function: false },
    });

    renderHook(() => useLanguageSync('household-123'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(mockSetLanguage).toHaveBeenCalledWith('sv');
    });
  });

  it('does NOT sync when languages already match', async () => {
    const mockSetLanguage = vi.fn();
    mockUseSettings.mockReturnValue({
      settings: { language: 'sv', itemsAtHome: [], favoriteRecipes: [] },
      isLoading: false,
      setLanguage: mockSetLanguage,
      addItemAtHome: vi.fn(),
      removeItemAtHome: vi.fn(),
      isItemAtHome: vi.fn(() => false),
      toggleFavorite: vi.fn(),
      isFavorite: vi.fn(() => false),
    });
    mockApi.getHouseholdSettings.mockResolvedValue({
      household_size: 2,
      default_servings: 2,
      language: 'sv',
      dietary: { seafood_ok: true, meat: 'all', minced_meat: 'meat', dairy: 'regular' },
      equipment: { airfryer: false, convection_oven: true, grill_function: false },
    });

    renderHook(() => useLanguageSync('household-123'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(mockApi.getHouseholdSettings).toHaveBeenCalled();
    });
    expect(mockSetLanguage).not.toHaveBeenCalled();
  });

  it('ignores unsupported language values from Firestore', async () => {
    const mockSetLanguage = vi.fn();
    mockUseSettings.mockReturnValue({
      settings: { language: 'en', itemsAtHome: [], favoriteRecipes: [] },
      isLoading: false,
      setLanguage: mockSetLanguage,
      addItemAtHome: vi.fn(),
      removeItemAtHome: vi.fn(),
      isItemAtHome: vi.fn(() => false),
      toggleFavorite: vi.fn(),
      isFavorite: vi.fn(() => false),
    });
    mockApi.getHouseholdSettings.mockResolvedValue({
      household_size: 2,
      default_servings: 2,
      language: 'fr',
      dietary: { seafood_ok: true, meat: 'all', minced_meat: 'meat', dairy: 'regular' },
      equipment: { airfryer: false, convection_oven: true, grill_function: false },
    });

    renderHook(() => useLanguageSync('household-123'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(mockApi.getHouseholdSettings).toHaveBeenCalled();
    });
    expect(mockSetLanguage).not.toHaveBeenCalled();
  });

  it('does nothing when householdId is null', async () => {
    renderHook(() => useLanguageSync(null), {
      wrapper: createQueryWrapper(),
    });

    expect(mockApi.getHouseholdSettings).not.toHaveBeenCalled();
  });
});

describe('useUpdateHouseholdLanguage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.updateHouseholdSettings.mockResolvedValue({
      household_size: 2,
      default_servings: 2,
      language: 'sv',
      dietary: { seafood_ok: true, meat: 'all', minced_meat: 'meat', dairy: 'regular' },
      equipment: { airfryer: false, convection_oven: true, grill_function: false },
    });
  });

  it('updates household language in Firestore', async () => {
    const { result } = renderHook(() => useUpdateHouseholdLanguage('household-123'), {
      wrapper: createQueryWrapper(),
    });

    await act(async () => {
      await result.current('sv');
    });

    expect(mockApi.updateHouseholdSettings).toHaveBeenCalledWith('household-123', {
      language: 'sv',
    });
  });

  it('does nothing when householdId is null', async () => {
    const { result } = renderHook(() => useUpdateHouseholdLanguage(null), {
      wrapper: createQueryWrapper(),
    });

    await act(async () => {
      await result.current('sv');
    });

    expect(mockApi.updateHouseholdSettings).not.toHaveBeenCalled();
  });
});
