import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createQueryWrapper, mockCurrentUser } from '@/test/helpers';
import type { Recipe } from '@/lib/types';

const mockMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();
const mockSetMealMutateAsync = vi.fn();
const mockTransferMutateAsync = vi.fn();
const mockReviewMutateAsync = vi.fn();
const mockEnhanceMutateAsync = vi.fn();
const mockRouterBack = vi.fn();
const mockPickImage = vi.fn();

vi.mock('@/lib/hooks', () => ({
  useCurrentUser: vi.fn(() => ({ data: mockCurrentUser() })),
  useDeleteRecipe: vi.fn(() => ({ mutateAsync: mockDeleteMutateAsync })),
  useUpdateRecipe: vi.fn(() => ({ mutateAsync: mockMutateAsync })),
  useSetMeal: vi.fn(() => ({ mutateAsync: mockSetMealMutateAsync })),
  useImagePicker: vi.fn(() => ({ pickImage: mockPickImage })),
  useReviewEnhancement: vi.fn(() => ({ mutateAsync: mockReviewMutateAsync, isPending: false })),
  useEnhanceRecipe: vi.fn(() => ({ mutateAsync: mockEnhanceMutateAsync, isPending: false })),
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
  thumbnail_url: null,
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
  hidden: false,
  favorited: false,
  household_id: 'household-abc',
  visibility: 'household',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockMutateAsync.mockResolvedValue(undefined);
  mockDeleteMutateAsync.mockResolvedValue(undefined);
  mockSetMealMutateAsync.mockResolvedValue(undefined);
  mockReviewMutateAsync.mockResolvedValue(undefined);
  mockEnhanceMutateAsync.mockResolvedValue(undefined);
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

    it('approves and un-hides a hidden recipe', async () => {
      const recipe = makeRecipe({ hidden: true, rating: null });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      await act(async () => result.current.handleThumbUp());
      expect(mockMutateAsync).toHaveBeenCalledWith({ id: 'recipe-1', updates: { rating: 5, hidden: false } });
    });
  });

  describe('handleThumbDown', () => {
    it('does nothing when id is undefined', async () => {
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions(undefined, recipe), { wrapper });
      await act(async () => result.current.handleThumbDown());
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('hides a visible recipe', async () => {
      const recipe = makeRecipe({ hidden: false, rating: null });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      await act(async () => result.current.handleThumbDown());
      expect(mockMutateAsync).toHaveBeenCalledWith({ id: 'recipe-1', updates: { hidden: true } });
    });

    it('un-hides a hidden recipe', async () => {
      const recipe = makeRecipe({ hidden: true });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      await act(async () => result.current.handleThumbDown());
      expect(mockMutateAsync).toHaveBeenCalledWith({ id: 'recipe-1', updates: { hidden: false } });
    });

    it('clears rating when hiding an approved recipe', async () => {
      const recipe = makeRecipe({ hidden: false, rating: 5 });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      await act(async () => result.current.handleThumbDown());
      expect(mockMutateAsync).toHaveBeenCalledWith({ id: 'recipe-1', updates: { hidden: true, rating: null } });
    });

    it('shows notification when recipe not owned by user household', async () => {
      const recipe = makeRecipe({ household_id: 'other-household' });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      await act(async () => result.current.handleThumbDown());
      expect(mockShowNotification).toHaveBeenCalledWith('recipe.cannotRate', 'recipe.cannotRateMessage');
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

  describe('needsEnhancementReview', () => {
    it('returns true for enhanced recipes not yet reviewed', () => {
      const recipe = makeRecipe({ enhanced: true, enhancement_reviewed: false });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      expect(result.current.needsEnhancementReview).toBe(true);
    });

    it('returns false for already reviewed recipes', () => {
      const recipe = makeRecipe({ enhanced: true, enhancement_reviewed: true });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      expect(result.current.needsEnhancementReview).toBe(false);
    });

    it('returns false for non-enhanced recipes', () => {
      const recipe = makeRecipe({ enhanced: false });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      expect(result.current.needsEnhancementReview).toBe(false);
    });

    it('returns false when recipe is undefined', () => {
      const { result } = renderHook(() => useRecipeActions('recipe-1', undefined), { wrapper });
      expect(result.current.needsEnhancementReview).toBe(false);
    });
  });

  describe('handleReviewEnhancement', () => {
    it('does nothing when id is undefined', async () => {
      const recipe = makeRecipe({ enhanced: true });
      const { result } = renderHook(() => useRecipeActions(undefined, recipe), { wrapper });
      await act(async () => result.current.handleReviewEnhancement('approve'));
      expect(mockReviewMutateAsync).not.toHaveBeenCalled();
    });

    it('does nothing when recipe is undefined', async () => {
      const { result } = renderHook(() => useRecipeActions('recipe-1', undefined), { wrapper });
      await act(async () => result.current.handleReviewEnhancement('approve'));
      expect(mockReviewMutateAsync).not.toHaveBeenCalled();
    });

    it('shows notification when currentUser not loaded', async () => {
      mockUseCurrentUser.mockReturnValue({ data: undefined } as any);
      const recipe = makeRecipe({ enhanced: true });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      await act(async () => result.current.handleReviewEnhancement('approve'));
      expect(mockShowNotification).toHaveBeenCalledWith('recipe.pleaseWait', 'recipe.loadingAccount');
    });

    it('shows notification when recipe not owned by user household', async () => {
      const recipe = makeRecipe({ enhanced: true, household_id: 'other-household' });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      await act(async () => result.current.handleReviewEnhancement('approve'));
      expect(mockShowNotification).toHaveBeenCalledWith('recipe.cannotRate', 'recipe.cannotRateMessage');
    });

    it('calls reviewEnhancement with approve and shows success', async () => {
      const recipe = makeRecipe({ enhanced: true });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      await act(async () => result.current.handleReviewEnhancement('approve'));
      expect(mockReviewMutateAsync).toHaveBeenCalledWith({ id: 'recipe-1', action: 'approve' });
      expect(mockShowNotification).toHaveBeenCalledWith('recipe.enhancementApproved', 'recipe.enhancementApprovedMessage');
    });

    it('calls reviewEnhancement with reject and shows success', async () => {
      const recipe = makeRecipe({ enhanced: true });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      await act(async () => result.current.handleReviewEnhancement('reject'));
      expect(mockReviewMutateAsync).toHaveBeenCalledWith({ id: 'recipe-1', action: 'reject' });
      expect(mockShowNotification).toHaveBeenCalledWith('recipe.enhancementRejected', 'recipe.enhancementRejectedMessage');
    });

    it('shows error notification on failure', async () => {
      mockReviewMutateAsync.mockRejectedValue(new Error('Network error'));
      const recipe = makeRecipe({ enhanced: true });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      await act(async () => result.current.handleReviewEnhancement('approve'));
      expect(mockShowNotification).toHaveBeenCalledWith('common.error', 'recipe.reviewFailed');
    });
  });

  describe('canEnhance', () => {
    it('returns true for owned non-enhanced recipe', () => {
      const recipe = makeRecipe({ household_id: 'household-abc', enhanced: false });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      expect(result.current.canEnhance).toBe(true);
    });

    it('returns false for already enhanced recipe', () => {
      const recipe = makeRecipe({ household_id: 'household-abc', enhanced: true });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      expect(result.current.canEnhance).toBe(false);
    });

    it('returns false for non-owned recipe', () => {
      const recipe = makeRecipe({ household_id: 'other-household', enhanced: false });
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      expect(result.current.canEnhance).toBe(false);
    });

    it('returns false when recipe is undefined', () => {
      const { result } = renderHook(() => useRecipeActions('recipe-1', undefined), { wrapper });
      expect(result.current.canEnhance).toBe(false);
    });
  });

  describe('handleEnhanceRecipe', () => {
    it('does nothing when id is undefined', async () => {
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions(undefined, recipe), { wrapper });
      await act(async () => result.current.handleEnhanceRecipe());
      expect(mockShowAlert).not.toHaveBeenCalled();
    });

    it('shows confirmation dialog', async () => {
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      await act(async () => result.current.handleEnhanceRecipe());
      expect(mockShowAlert).toHaveBeenCalledWith(
        'recipe.enhanceRecipe',
        'recipe.enhanceConfirm',
        expect.arrayContaining([
          expect.objectContaining({ text: 'common.cancel' }),
          expect.objectContaining({ text: 'recipe.enhance' }),
        ]),
      );
    });

    it('calls enhanceRecipe and shows success when confirmed', async () => {
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      await act(async () => result.current.handleEnhanceRecipe());

      const buttons = mockShowAlert.mock.calls[0][2]!;
      const enhanceButton = buttons.find(b => b.text === 'recipe.enhance')!;
      await act(async () => enhanceButton.onPress!());

      expect(mockEnhanceMutateAsync).toHaveBeenCalledWith('recipe-1');
      expect(mockShowNotification).toHaveBeenCalledWith('recipe.enhanceSuccess', 'recipe.enhanceSuccessMessage');
    });

    it('shows error notification on failure', async () => {
      mockEnhanceMutateAsync.mockRejectedValue(new Error('Enhancement failed'));
      const recipe = makeRecipe();
      const { result } = renderHook(() => useRecipeActions('recipe-1', recipe), { wrapper });
      await act(async () => result.current.handleEnhanceRecipe());

      const buttons = mockShowAlert.mock.calls[0][2]!;
      const enhanceButton = buttons.find(b => b.text === 'recipe.enhance')!;
      await act(async () => enhanceButton.onPress!());

      expect(mockShowNotification).toHaveBeenCalledWith('common.error', 'recipe.enhanceFailed');
    });
  });
});
