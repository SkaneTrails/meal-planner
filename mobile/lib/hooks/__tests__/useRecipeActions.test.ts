import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createQueryWrapper, mockCurrentUser } from '@/test/helpers';
import type { Recipe } from '@/lib/types';

const mockMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();
const mockSetMealMutateAsync = vi.fn();
const mockTransferMutateAsync = vi.fn();
const mockRouterBack = vi.fn();
const mockPickImage = vi.fn();

vi.mock('@/lib/hooks', () => ({
  useCurrentUser: vi.fn(() => ({ data: mockCurrentUser() })),
  useDeleteRecipe: vi.fn(() => ({ mutateAsync: mockDeleteMutateAsync })),
  useUpdateRecipe: vi.fn(() => ({ mutateAsync: mockMutateAsync })),
  useSetMeal: vi.fn(() => ({ mutateAsync: mockSetMealMutateAsync })),
  useImagePicker: vi.fn(() => ({ pickImage: mockPickImage })),
}));

vi.mock('@/lib/hooks/use-admin', () => ({
  useHouseholds: vi.fn(() => ({ data: undefined })),
  useTransferRecipe: vi.fn(() => ({ mutateAsync: mockTransferMutateAsync })),
}));

vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({
    user: { email: 'test@example.com' },
    loading: false,
  })),
}));

vi.mock('expo-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: mockRouterBack,
    replace: vi.fn(),
  })),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key, language: 'en' }),
}));

vi.mock('@/lib/alert', () => ({
  showAlert: vi.fn(),
  showNotification: vi.fn(),
}));

vi.mock('@/lib/haptics', () => ({
  hapticLight: vi.fn(),
  hapticSuccess: vi.fn(),
  hapticWarning: vi.fn(),
  hapticSelection: vi.fn(),
}));

import { showAlert, showNotification } from '@/lib/alert';
import { useCurrentUser } from '@/lib/hooks';
import { useRecipeActions } from '../useRecipeActions';

const mockShowAlert = vi.mocked(showAlert);
const mockShowNotification = vi.mocked(showNotification);
const mockUseCurrentUser = vi.mocked(useCurrentUser);

const makeRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: 'recipe-1',
  title: 'Test Recipe',
  url: 'https://example.com/recipe',
  ingredients: ['1 cup flour', '2 eggs'],
  instructions: ['Mix', 'Bake'],
  image_url: 'https://example.com/image.jpg',
  servings: 4,
  prep_time: 10,
  cook_time: 20,
  total_time: 30,
  cuisine: null,
  category: null,
  tags: ['easy'],
  diet_label: null,
  meal_label: null,
  rating: null,
  household_id: 'household-abc',
  visibility: 'household',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockMutateAsync.mockResolvedValue(undefined);
  mockDeleteMutateAsync.mockResolvedValue(undefined);
  mockSetMealMutateAsync.mockResolvedValue(undefined);
  mockUseCurrentUser.mockReturnValue({ data: mockCurrentUser() } as any);
});

describe('useRecipeActions', () => {
  const wrapper = createQueryWrapper();

  describe('canEdit', () => {
    it('returns true when recipe belongs to user household', () => {
      const recipe = makeRecipe({ household_id: 'household-abc' });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      expect(result.current.canEdit).toBe(true);
    });

    it('returns false when recipe belongs to different household', () => {
      const recipe = makeRecipe({ household_id: 'other-household' });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      expect(result.current.canEdit).toBe(false);
    });

    it('returns false when currentUser is not loaded', () => {
      mockUseCurrentUser.mockReturnValue({ data: undefined } as any);
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      expect(result.current.canEdit).toBe(false);
    });
  });

  describe('handleThumbUp', () => {
    it('does nothing when id is undefined', async () => {
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions(undefined, recipe), { wrapper });
      await act(async () => result.current.handleThumbUp());
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('shows notification when currentUser not loaded', async () => {
      mockUseCurrentUser.mockReturnValue({ data: undefined } as any);
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      await act(async () => result.current.handleThumbUp());
      expect(mockShowNotification).toHaveBeenCalledWith('recipe.pleaseWait', 'recipe.loadingAccount');
    });

    it('shows notification when recipe not owned by user household', async () => {
      const recipe = makeRecipe({ household_id: 'other-household' });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      await act(async () => result.current.handleThumbUp());
      expect(mockShowNotification).toHaveBeenCalledWith('recipe.cannotRate', 'recipe.cannotRateMessage');
    });

    it('toggles rating to 5 when not rated', async () => {
      const recipe = makeRecipe({ rating: null });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      await act(async () => result.current.handleThumbUp());
      expect(mockMutateAsync).toHaveBeenCalledWith({ id: 'recipe-1', updates: { rating: 5 } });
    });

    it('clears rating when already 5', async () => {
      const recipe = makeRecipe({ rating: 5 });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      await act(async () => result.current.handleThumbUp());
      expect(mockMutateAsync).toHaveBeenCalledWith({ id: 'recipe-1', updates: { rating: null } });
    });
  });

  describe('handleThumbDown', () => {
    it('does nothing when id is undefined', () => {
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions(undefined, recipe), { wrapper });
      act(() => result.current.handleThumbDown());
      expect(mockShowAlert).not.toHaveBeenCalled();
    });

    it('shows delete confirm when rating already 1', () => {
      const recipe = makeRecipe({ rating: 1 });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      act(() => result.current.handleThumbDown());
      expect(mockShowAlert).toHaveBeenCalledWith(
        'recipe.deleteRecipe',
        expect.any(String),
        expect.any(Array),
      );
    });

    it('shows mark-not-favorite dialog when unrated', () => {
      const recipe = makeRecipe({ rating: null });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      act(() => result.current.handleThumbDown());
      expect(mockShowAlert).toHaveBeenCalledWith(
        'recipe.notFavorite',
        expect.any(String),
        expect.any(Array),
      );
    });
  });

  describe('handleDelete', () => {
    it('does nothing when id is undefined', () => {
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions(undefined, recipe), { wrapper });
      act(() => result.current.handleDelete());
      expect(mockShowAlert).not.toHaveBeenCalled();
    });

    it('shows delete confirmation dialog', () => {
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      act(() => result.current.handleDelete());
      expect(mockShowAlert).toHaveBeenCalledWith(
        'recipe.deleteRecipe',
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ text: 'common.cancel' }),
          expect.objectContaining({ text: 'common.delete', style: 'destructive' }),
        ]),
      );
    });

    it('calls deleteRecipe and navigates back when confirmed', async () => {
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      act(() => result.current.handleDelete());

      const buttons = mockShowAlert.mock.calls[0][2]!;
      const deleteButton = buttons.find(b => b.style === 'destructive')!;
      await act(async () => deleteButton.onPress!());

      expect(mockDeleteMutateAsync).toHaveBeenCalledWith('recipe-1');
      expect(mockRouterBack).toHaveBeenCalled();
    });
  });

  describe('handleSaveEdit', () => {
    it('does nothing when id is undefined', async () => {
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions(undefined, recipe), { wrapper });
      await act(async () => result.current.handleSaveEdit({
        dietLabel: null, mealLabel: null, prepTime: '', cookTime: '',
        servings: '', tags: '', visibility: 'household',
      }));
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('parses tags and saves updates', async () => {
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      await act(async () => result.current.handleSaveEdit({
        dietLabel: 'veggie', mealLabel: 'meal', prepTime: '15', cookTime: '30',
        servings: '4', tags: '#Pasta, easy, #Italian', visibility: 'shared',
      }));
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: 'recipe-1',
        updates: {
          diet_label: 'veggie',
          meal_label: 'meal',
          prep_time: 15,
          cook_time: 30,
          servings: 4,
          tags: ['pasta', 'easy', 'italian'],
          visibility: 'shared',
        },
      });
    });

    it('closes edit modal on success', async () => {
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });

      act(() => result.current.setShowEditModal(true));
      expect(result.current.showEditModal).toBe(true);

      await act(async () => result.current.handleSaveEdit({
        dietLabel: null, mealLabel: null, prepTime: '', cookTime: '',
        servings: '', tags: '', visibility: 'household',
      }));
      expect(result.current.showEditModal).toBe(false);
    });
  });

  describe('saveImageUrl', () => {
    it('does nothing when id is undefined', async () => {
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions(undefined, recipe), { wrapper });
      await act(async () => result.current.saveImageUrl('https://example.com/new.jpg'));
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('updates image_url and shows success notification', async () => {
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      await act(async () => result.current.saveImageUrl('https://example.com/new.jpg'));
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: 'recipe-1',
        updates: { image_url: 'https://example.com/new.jpg' },
      });
      expect(mockShowNotification).toHaveBeenCalledWith('common.success', 'recipe.photoUpdated');
    });
  });

  describe('handlePlanMeal', () => {
    it('does nothing when id is undefined', async () => {
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions(undefined, recipe), { wrapper });
      await act(async () => result.current.handlePlanMeal(new Date('2026-02-09'), 'lunch'));
      expect(mockSetMealMutateAsync).not.toHaveBeenCalled();
    });

    it('sets meal and closes plan modal', async () => {
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });

      act(() => result.current.setShowPlanModal(true));

      await act(async () => result.current.handlePlanMeal(new Date('2026-02-09'), 'lunch'));

      expect(mockSetMealMutateAsync).toHaveBeenCalledWith({
        date: '2026-02-09',
        mealType: 'lunch',
        recipeId: 'recipe-1',
      });
      expect(result.current.showPlanModal).toBe(false);
    });
  });

  describe('modal state', () => {
    it('initializes all modals as closed', () => {
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      expect(result.current.showPlanModal).toBe(false);
      expect(result.current.showEditModal).toBe(false);
      expect(result.current.showUrlModal).toBe(false);
    });

    it('can toggle modal visibility', () => {
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });

      act(() => result.current.setShowPlanModal(true));
      expect(result.current.showPlanModal).toBe(true);

      act(() => result.current.setShowEditModal(true));
      expect(result.current.showEditModal).toBe(true);

      act(() => result.current.setShowUrlModal(true));
      expect(result.current.showUrlModal).toBe(true);
    });
  });

  describe('isSuperuser', () => {
    it('returns false for regular member', () => {
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      expect(result.current.isSuperuser).toBe(false);
    });

    it('returns true for superuser role', () => {
      mockUseCurrentUser.mockReturnValue({ data: mockCurrentUser({ role: 'superuser' }) } as any);
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      expect(result.current.isSuperuser).toBe(true);
    });
  });
});
