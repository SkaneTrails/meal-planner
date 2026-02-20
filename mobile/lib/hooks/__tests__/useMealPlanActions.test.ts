import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createQueryWrapper, mockRecipe } from '@/test/helpers';
import type { Recipe } from '@/lib/types';

// PanResponder is not available in jsdom — mock the react-native module partially
vi.mock('react-native', async () => {
  const actual = await vi.importActual<typeof import('react-native')>('react-native');
  return {
    ...actual,
    PanResponder: {
      create: vi.fn(() => ({ panHandlers: {} })),
    },
  };
});

const mockMutate = vi.fn();
const mockRemoveMutate = vi.fn();
const mockRefetch = vi.fn();
const mockRouterPush = vi.fn();

const mockMealPlan = {
  meals: {
    '2026-01-05_lunch': 'recipe-1',
    '2026-01-05_dinner': 'custom:Pasta night',
    '2026-01-06_lunch': 'unknown-id',
  },
  notes: {
    '2026-01-05': 'Office Gym',
  },
};

const mockRecipes: Recipe[] = [
  mockRecipe({
    id: 'recipe-1',
    title: 'Chicken Curry',
    ingredients: ['chicken', 'curry paste'],
    instructions: ['Cook chicken', 'Add curry'],
    visibility: 'household',
    household_id: 'h1',
  }),
];

const mockSaveSelections = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockUpdateExtrasMutate = vi.fn();

vi.mock('@/lib/hooks', () => ({
  useMealPlan: vi.fn(() => ({
    data: mockMealPlan,
    isLoading: false,
    refetch: mockRefetch,
  })),
  useAllRecipes: vi.fn(() => ({ recipes: mockRecipes, totalCount: mockRecipes.length })),
  useUpdateNote: vi.fn(() => ({ mutate: mockMutate })),
  useRemoveMeal: vi.fn(() => ({ mutate: mockRemoveMutate })),
  useUpdateExtras: vi.fn(() => ({ mutate: mockUpdateExtrasMutate })),
  useGroceryState: vi.fn(() => ({ saveSelections: mockSaveSelections })),
}));

vi.mock('expo-router', () => ({
  useRouter: vi.fn(() => ({ push: mockRouterPush, back: vi.fn() })),
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
  hapticSelection: vi.fn(),
}));

vi.mock('@/lib/utils/dateFormatter', () => ({
  formatDateLocal: (d: Date) => d.toISOString().split('T')[0],
  getWeekDatesArray: () => [
    new Date('2026-01-05'),
    new Date('2026-01-06'),
    new Date('2026-01-07'),
    new Date('2026-01-08'),
    new Date('2026-01-09'),
    new Date('2026-01-10'),
    new Date('2026-01-11'),
  ],
  formatWeekRange: () => 'Jan 5–11',
  formatDayHeader: (_d: Date) => 'Monday',
}));

import { showNotification } from '@/lib/alert';
import { useMealPlanActions } from '../useMealPlanActions';

describe('useMealPlanActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderActions = () =>
    renderHook(() => useMealPlanActions(), { wrapper: createQueryWrapper() });

  describe('getMealForSlot', () => {
    it('returns recipe when meal value is a known recipe ID', () => {
      const { result } = renderActions();
      const slot = result.current.getMealForSlot(new Date('2026-01-05'), 'lunch');
      expect(slot).toEqual({ recipe: expect.objectContaining({ id: 'recipe-1', title: 'Chicken Curry' }) });
    });

    it('returns customText when meal value starts with "custom:"', () => {
      const { result } = renderActions();
      const slot = result.current.getMealForSlot(new Date('2026-01-05'), 'dinner');
      expect(slot).toEqual({ customText: 'Pasta night' });
    });

    it('returns customText with the raw value when recipe ID is unknown', () => {
      const { result } = renderActions();
      const slot = result.current.getMealForSlot(new Date('2026-01-06'), 'lunch');
      expect(slot).toEqual({ customText: 'unknown-id' });
    });

    it('returns null when no meal is set for the slot', () => {
      const { result } = renderActions();
      const slot = result.current.getMealForSlot(new Date('2026-01-07'), 'lunch');
      expect(slot).toBeNull();
    });
  });

  describe('getNoteForDate', () => {
    it('returns the note for a date with a note', () => {
      const { result } = renderActions();
      expect(result.current.getNoteForDate(new Date('2026-01-05'))).toBe('Office Gym');
    });

    it('returns null for a date without a note', () => {
      const { result } = renderActions();
      expect(result.current.getNoteForDate(new Date('2026-01-07'))).toBeNull();
    });
  });

  describe('grocery selection', () => {
    it('toggles meal selection on and sets default servings', () => {
      const { result } = renderActions();
      const date = new Date('2026-01-05');

      act(() => result.current.handleToggleMeal(date, 'lunch', 4));

      expect(result.current.selectedMeals.has('2026-01-05_lunch')).toBe(true);
      expect(result.current.mealServings['2026-01-05_lunch']).toBe(4);
    });

    it('defaults to 2 servings when recipe has no servings', () => {
      const { result } = renderActions();
      const date = new Date('2026-01-05');

      act(() => result.current.handleToggleMeal(date, 'dinner'));

      expect(result.current.selectedMeals.has('2026-01-05_dinner')).toBe(true);
      expect(result.current.mealServings['2026-01-05_dinner']).toBe(2);
    });

    it('toggles meal selection off and clears servings', () => {
      const { result } = renderActions();
      const date = new Date('2026-01-05');

      act(() => result.current.handleToggleMeal(date, 'lunch', 4));
      act(() => result.current.handleToggleMeal(date, 'lunch'));

      expect(result.current.selectedMeals.has('2026-01-05_lunch')).toBe(false);
      expect(result.current.mealServings['2026-01-05_lunch']).toBeUndefined();
    });

    it('changes servings within bounds (1–12)', () => {
      const { result } = renderActions();
      const date = new Date('2026-01-05');

      act(() => result.current.handleToggleMeal(date, 'lunch', 4));
      act(() => result.current.handleChangeServings('2026-01-05_lunch', 3));
      expect(result.current.mealServings['2026-01-05_lunch']).toBe(7);

      act(() => result.current.handleChangeServings('2026-01-05_lunch', 10));
      expect(result.current.mealServings['2026-01-05_lunch']).toBe(12);

      act(() => result.current.handleChangeServings('2026-01-05_lunch', -20));
      expect(result.current.mealServings['2026-01-05_lunch']).toBe(1);
    });
  });

  describe('handleCreateGroceryList', () => {
    it('shows notification when no meals are selected', async () => {
      const { result } = renderActions();
      await act(() => result.current.handleCreateGroceryList());
      expect(showNotification).toHaveBeenCalledWith('mealPlan.noMealsSelected', 'mealPlan.noMealsSelectedMessage');
    });

    it('saves via context and navigates when meals are selected', async () => {
      const { result } = renderActions();

      act(() => result.current.handleToggleMeal(new Date('2026-01-05'), 'lunch', 4));
      await act(() => result.current.handleCreateGroceryList());

      expect(mockSaveSelections).toHaveBeenCalledWith(
        ['2026-01-05_lunch'],
        { '2026-01-05_lunch': 4 },
      );
      expect(result.current.showGroceryModal).toBe(false);
    });
  });

  describe('handleMealPress', () => {
    it('opens modal with correct mode and date', () => {
      const { result } = renderActions();
      act(() => result.current.handleMealPress(new Date('2026-01-05'), 'lunch', 'random'));
      expect(result.current.activeModal).toBe('random');
      expect(result.current.modalDate).toBe('2026-01-05');
      expect(result.current.modalMealType).toBe('lunch');
    });

    it('defaults mode to library', () => {
      const { result } = renderActions();
      act(() => result.current.handleMealPress(new Date('2026-01-05'), 'dinner'));
      expect(result.current.activeModal).toBe('library');
      expect(result.current.modalDate).toBe('2026-01-05');
      expect(result.current.modalMealType).toBe('dinner');
    });
  });

  describe('note editing', () => {
    it('populates noteText when starting to edit a date with existing note', () => {
      const { result } = renderActions();
      act(() => result.current.handleStartEditNote(new Date('2026-01-05')));
      expect(result.current.editingNoteDate).toBe('2026-01-05');
      expect(result.current.noteText).toBe('Office Gym');
    });

    it('clears state when cancelling edit', () => {
      const { result } = renderActions();
      act(() => result.current.handleStartEditNote(new Date('2026-01-05')));
      act(() => result.current.handleCancelEditNote());
      expect(result.current.editingNoteDate).toBeNull();
      expect(result.current.noteText).toBe('');
    });

    it('calls updateNote.mutate and clears state on save', () => {
      const { result } = renderActions();
      act(() => result.current.handleStartEditNote(new Date('2026-01-05')));
      act(() => result.current.setNoteText('Updated note'));
      act(() => result.current.handleSaveNote());

      expect(mockMutate).toHaveBeenCalledWith(
        { date: '2026-01-05', note: 'Updated note' },
        expect.objectContaining({ onError: expect.any(Function) }),
      );
      expect(result.current.editingNoteDate).toBeNull();
    });

    it('toggles tags in noteText', () => {
      const { result } = renderActions();
      act(() => result.current.handleStartEditNote(new Date('2026-01-07')));

      act(() => result.current.handleAddTag('Office'));
      expect(result.current.noteText).toBe('Office');

      act(() => result.current.handleAddTag('Gym'));
      expect(result.current.noteText).toBe('Office Gym');

      act(() => result.current.handleAddTag('Office'));
      expect(result.current.noteText).toBe('Gym');
    });
  });

  describe('MEAL_TYPES', () => {
    it('provides lunch and dinner options by default', () => {
      const { result } = renderActions();
      expect(result.current.MEAL_TYPES).toHaveLength(2);
      expect(result.current.MEAL_TYPES[0].type).toBe('lunch');
      expect(result.current.MEAL_TYPES[1].type).toBe('dinner');
    });

    it('includes breakfast when includeBreakfast setting is true', async () => {
      const { useSettings } = await import('@/lib/settings-context');
      vi.mocked(useSettings).mockReturnValue({
        ...vi.mocked(useSettings)(),
        settings: {
          ...vi.mocked(useSettings)().settings,
          includeBreakfast: true,
        },
      });

      const { result } = renderActions();
      expect(result.current.MEAL_TYPES).toHaveLength(3);
      expect(result.current.MEAL_TYPES[0].type).toBe('breakfast');
      expect(result.current.MEAL_TYPES[1].type).toBe('lunch');
      expect(result.current.MEAL_TYPES[2].type).toBe('dinner');

      // Restore default mock
      vi.mocked(useSettings).mockReturnValue({
        ...vi.mocked(useSettings)(),
        settings: {
          ...vi.mocked(useSettings)().settings,
          includeBreakfast: false,
        },
      });
    });
  });

  describe('countMealsForDate', () => {
    it('counts meals that exist for a given date', () => {
      const { result } = renderActions();
      // 2026-01-05 has lunch (recipe-1) and dinner (custom:Pasta night) = 2
      expect(result.current.countMealsForDate(new Date('2026-01-05'))).toBe(2);
    });

    it('returns 0 for a date with no meals', () => {
      const { result } = renderActions();
      expect(result.current.countMealsForDate(new Date('2026-01-07'))).toBe(0);
    });

    it('counts only matching meal types (unknown-id counts as present)', () => {
      const { result } = renderActions();
      // 2026-01-06 has only lunch (unknown-id) = 1
      expect(result.current.countMealsForDate(new Date('2026-01-06'))).toBe(1);
    });
  });

  describe('expandedPastDays / togglePastDay', () => {
    it('starts with empty expanded set', () => {
      const { result } = renderActions();
      expect(result.current.expandedPastDays.size).toBe(0);
    });

    it('adds a date to expanded set', () => {
      const { result } = renderActions();
      act(() => result.current.togglePastDay('2026-01-05'));
      expect(result.current.expandedPastDays.has('2026-01-05')).toBe(true);
    });

    it('removes a date from expanded set on second toggle', () => {
      const { result } = renderActions();
      act(() => result.current.togglePastDay('2026-01-05'));
      act(() => result.current.togglePastDay('2026-01-05'));
      expect(result.current.expandedPastDays.has('2026-01-05')).toBe(false);
    });

    it('manages multiple expanded dates independently', () => {
      const { result } = renderActions();
      act(() => result.current.togglePastDay('2026-01-05'));
      act(() => result.current.togglePastDay('2026-01-06'));
      expect(result.current.expandedPastDays.size).toBe(2);

      act(() => result.current.togglePastDay('2026-01-05'));
      expect(result.current.expandedPastDays.has('2026-01-05')).toBe(false);
      expect(result.current.expandedPastDays.has('2026-01-06')).toBe(true);
    });
  });
});
