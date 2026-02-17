import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, type ScrollView } from 'react-native';
import type { MealTypeOption } from '@/components/meal-plan/meal-plan-constants';
import {
  DAY_SECTION_HEIGHT,
  showConfirmDelete,
} from '@/components/meal-plan/meal-plan-constants';
import { showNotification } from '@/lib/alert';
import { hapticLight } from '@/lib/haptics';
import {
  useAllRecipes,
  useGroceryState,
  useMealPlan,
  useRemoveMeal,
  useUpdateExtras,
  useUpdateNote,
} from '@/lib/hooks';
import { useTranslation } from '@/lib/i18n';
import { useSettings } from '@/lib/settings-context';
import type { MealType, Recipe } from '@/lib/types';
import { formatDateLocal, getWeekDatesArray } from '@/lib/utils/dateFormatter';

export const useMealPlanActions = () => {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { weekStart, settings } = useSettings();
  const { saveSelections } = useGroceryState();

  const MEAL_TYPES: MealTypeOption[] = useMemo(() => {
    const types: MealTypeOption[] = [];
    if (settings?.includeBreakfast) {
      types.push({ type: 'breakfast', label: t('labels.mealTime.breakfast') });
    }
    types.push(
      { type: 'lunch', label: t('labels.mealTime.lunch') },
      { type: 'dinner', label: t('labels.mealTime.dinner') },
    );
    return types;
  }, [t, settings?.includeBreakfast]);

  const DEFAULT_NOTE_SUGGESTIONS = useMemo(
    () => [
      t('mealPlan.dayLabels.office'),
      t('mealPlan.dayLabels.home'),
      t('mealPlan.dayLabels.gym'),
      t('mealPlan.dayLabels.dinnerOut'),
      t('mealPlan.dayLabels.travel'),
      t('mealPlan.dayLabels.party'),
    ],
    [t],
  );

  const NOTE_SUGGESTIONS = useMemo(
    () =>
      settings.noteSuggestions.length > 0
        ? settings.noteSuggestions
        : DEFAULT_NOTE_SUGGESTIONS,
    [settings.noteSuggestions, DEFAULT_NOTE_SUGGESTIONS],
  );

  const [weekOffset, setWeekOffset] = useState(0);
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [groceryWeekOffset, setGroceryWeekOffset] = useState(0);
  const [selectedMeals, setSelectedMeals] = useState<Set<string>>(new Set());
  const [mealServings, setMealServings] = useState<Record<string, number>>({});
  const [showJumpButton, setShowJumpButton] = useState(false);
  const [editingNoteDate, setEditingNoteDate] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [expandedPastDays, setExpandedPastDays] = useState<Set<string>>(
    new Set(),
  );
  const scrollViewRef = useRef<ScrollView>(null);
  const jumpButtonOpacity = useRef(new Animated.Value(0)).current;
  const swipeTranslateX = useRef(new Animated.Value(0)).current;

  const weekDates = useMemo(
    () => getWeekDatesArray(weekOffset, weekStart),
    [weekOffset, weekStart],
  );
  const groceryWeekDates = useMemo(
    () => getWeekDatesArray(groceryWeekOffset, weekStart),
    [groceryWeekOffset, weekStart],
  );

  const todayIndex = useMemo(() => {
    const today = new Date();
    return weekDates.findIndex(
      (date) => date.toDateString() === today.toDateString(),
    );
  }, [weekDates]);

  const {
    data: mealPlan,
    isLoading: mealPlanLoading,
    refetch: refetchMealPlan,
  } = useMealPlan();
  const { recipes } = useAllRecipes();
  const updateNote = useUpdateNote();
  const removeMeal = useRemoveMeal();
  const updateExtras = useUpdateExtras();

  const recipeMap = useMemo(() => {
    const map: Record<string, Recipe> = {};
    for (const recipe of recipes) {
      map[recipe.id] = recipe;
    }
    return map;
  }, [recipes]);

  const getNoteForDate = useCallback(
    (date: Date): string | null => {
      if (!mealPlan?.notes) return null;
      const dateStr = formatDateLocal(date);
      return mealPlan.notes[dateStr] || null;
    },
    [mealPlan],
  );

  const getMealForSlot = useCallback(
    (
      date: Date,
      mealType: MealType,
    ): { recipe?: Recipe; customText?: string } | null => {
      if (!mealPlan?.meals) return null;
      const dateStr = formatDateLocal(date);
      const key = `${dateStr}_${mealType}`;
      const value = mealPlan.meals[key];
      if (!value) return null;
      if (value.startsWith('custom:')) {
        return { customText: value.slice(7) };
      }
      const recipe = recipeMap[value];
      return recipe ? { recipe } : { customText: value };
    },
    [mealPlan, recipeMap],
  );

  const countMealsForDate = useCallback(
    (date: Date): number => {
      if (!mealPlan?.meals) return 0;
      const dateStr = formatDateLocal(date);
      return MEAL_TYPES.reduce((count, { type }) => {
        const key = `${dateStr}_${type}`;
        return mealPlan.meals[key] ? count + 1 : count;
      }, 0);
    },
    [mealPlan, MEAL_TYPES],
  );

  const togglePastDay = useCallback((dateStr: string) => {
    setExpandedPastDays((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  }, []);

  const handleScroll = useCallback(
    (scrollY: number) => {
      if (todayIndex < 0) return;
      const todayPosition = todayIndex * DAY_SECTION_HEIGHT;
      const tolerance = DAY_SECTION_HEIGHT / 2;
      const isNearToday = Math.abs(scrollY - todayPosition) < tolerance;

      if (!isNearToday && !showJumpButton) {
        setShowJumpButton(true);
        Animated.spring(jumpButtonOpacity, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      } else if (isNearToday && showJumpButton) {
        Animated.timing(jumpButtonOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setShowJumpButton(false));
      }
    },
    [todayIndex, showJumpButton, jumpButtonOpacity],
  );

  const jumpToToday = useCallback(() => {
    if (weekOffset !== 0) {
      setWeekOffset(0);
    } else if (todayIndex >= 0 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: todayIndex * DAY_SECTION_HEIGHT,
        animated: true,
      });
    }
  }, [weekOffset, todayIndex]);

  useEffect(() => {
    if (todayIndex >= 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: todayIndex * DAY_SECTION_HEIGHT,
          animated: false,
        });
      }, 100);
    }
  }, [todayIndex]);

  const swipeThreshold = 50;
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gs) => {
          const isHorizontalSwipe = Math.abs(gs.dx) > Math.abs(gs.dy) * 2;
          return isHorizontalSwipe && Math.abs(gs.dx) > 10;
        },
        onPanResponderMove: (_, gs) => {
          swipeTranslateX.setValue(gs.dx * 0.3);
        },
        onPanResponderRelease: (_, gs) => {
          const springBack = () =>
            Animated.spring(swipeTranslateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 12,
            }).start();

          if (gs.dx > swipeThreshold) {
            hapticLight();
            Animated.timing(swipeTranslateX, {
              toValue: 100,
              duration: 150,
              useNativeDriver: true,
            }).start(() => {
              setWeekOffset((prev) => prev - 1);
              swipeTranslateX.setValue(-100);
              springBack();
            });
          } else if (gs.dx < -swipeThreshold) {
            hapticLight();
            Animated.timing(swipeTranslateX, {
              toValue: -100,
              duration: 150,
              useNativeDriver: true,
            }).start(() => {
              setWeekOffset((prev) => prev + 1);
              swipeTranslateX.setValue(100);
              springBack();
            });
          } else {
            springBack();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(swipeTranslateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 12,
          }).start();
        },
      }),
    [swipeTranslateX],
  );

  const handleStartEditNote = useCallback(
    (date: Date) => {
      const dateStr = formatDateLocal(date);
      setEditingNoteDate(dateStr);
      setNoteText(getNoteForDate(date) || '');
    },
    [getNoteForDate],
  );

  const handleSaveNote = useCallback(() => {
    if (editingNoteDate) {
      updateNote.mutate(
        { date: editingNoteDate, note: noteText.trim() },
        {
          onError: () =>
            showNotification(t('common.error'), t('mealPlan.failedToSaveNote')),
        },
      );
      setEditingNoteDate(null);
      setNoteText('');
    }
  }, [editingNoteDate, noteText, updateNote, t]);

  const handleCancelEditNote = useCallback(() => {
    setEditingNoteDate(null);
    setNoteText('');
  }, []);

  const handleAddTag = useCallback(
    (tag: string) => {
      const currentTags = noteText.split(' ').filter((t) => t.trim());
      if (currentTags.includes(tag)) {
        setNoteText(currentTags.filter((t) => t !== tag).join(' '));
      } else {
        setNoteText([...currentTags, tag].join(' '));
      }
    },
    [noteText],
  );

  const handleMealPress = useCallback(
    (
      date: Date,
      mealType: MealType,
      mode?: 'library' | 'copy' | 'quick' | 'random',
    ) => {
      const dateStr = formatDateLocal(date);
      router.push({
        pathname: '/select-recipe',
        params: { date: dateStr, mealType, mode: mode || 'library' },
      });
    },
    [router],
  );

  const handleRemoveMeal = useCallback(
    (date: Date, mealType: MealType, title: string, label: string) => {
      const dateStr = formatDateLocal(date);
      showConfirmDelete(
        t('common.remove'),
        t('mealPlan.removeMealTitle', { title, meal: label.toLowerCase() }),
        () => {
          removeMeal.mutate(
            { date: dateStr, mealType },
            {
              onError: () =>
                showNotification(
                  t('common.error'),
                  t('mealPlan.failedToRemoveMeal'),
                ),
            },
          );
        },
        t('common.cancel'),
        t('mealPlan.removeMealConfirm'),
      );
    },
    [removeMeal, t],
  );

  const handleToggleMeal = useCallback(
    (date: Date, mealType: MealType, recipeServings?: number) => {
      const dateStr = formatDateLocal(date);
      const key = `${dateStr}_${mealType}`;
      setSelectedMeals((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(key)) {
          newSet.delete(key);
          setMealServings((prevServings) => {
            const { [key]: _, ...rest } = prevServings;
            return rest;
          });
        } else {
          newSet.add(key);
          setMealServings((prevServings) => ({
            ...prevServings,
            [key]: recipeServings || 2,
          }));
        }
        return newSet;
      });
    },
    [],
  );

  const handleChangeServings = useCallback((key: string, delta: number) => {
    setMealServings((prev) => {
      const current = prev[key] || 2;
      const newValue = Math.max(1, Math.min(12, current + delta));
      return { ...prev, [key]: newValue };
    });
  }, []);

  const handleCreateGroceryList = useCallback(async () => {
    if (selectedMeals.size === 0) {
      showNotification(
        t('mealPlan.noMealsSelected'),
        t('mealPlan.noMealsSelectedMessage'),
      );
      return;
    }
    try {
      const mealsArray = Array.from(selectedMeals);
      await saveSelections(mealsArray, mealServings);
      setShowGroceryModal(false);
      setTimeout(() => router.push('/(tabs)/grocery'), 100);
    } catch {
      showNotification(t('common.error'), t('mealPlan.failedToSaveSelections'));
    }
  }, [selectedMeals, mealServings, router, t, saveSelections]);

  const openGroceryModal = useCallback(() => {
    hapticLight();
    setGroceryWeekOffset(weekOffset);
    setShowGroceryModal(true);
  }, [weekOffset]);

  const getExtrasRecipes = useCallback((): Recipe[] => {
    if (!mealPlan?.extras || mealPlan.extras.length === 0) return [];
    return mealPlan.extras
      .map((id) => recipeMap[id])
      .filter((r): r is Recipe => r !== undefined);
  }, [mealPlan, recipeMap]);

  const handleAddExtra = useCallback(() => {
    hapticLight();
    router.push({
      pathname: '/select-recipe',
      params: { mode: 'extras' },
    });
  }, [router]);

  const handleRemoveExtra = useCallback(
    (recipeId: string, title: string) => {
      showConfirmDelete(
        t('common.remove'),
        t('mealPlan.extras.removeMessage', { title }),
        () => {
          hapticLight();
          const currentExtras = mealPlan?.extras || [];
          const newExtras = currentExtras.filter((id) => id !== recipeId);
          updateExtras.mutate({ extras: newExtras });
        },
        t('common.cancel'),
        t('mealPlan.removeMealConfirm'),
      );
    },
    [mealPlan, updateExtras, t],
  );

  return {
    t,
    language,
    MEAL_TYPES,
    NOTE_SUGGESTIONS,
    mealPlan,
    mealPlanLoading,
    recipes,
    weekDates,
    groceryWeekDates,
    todayIndex,
    recipeMap,
    weekOffset,
    setWeekOffset,
    showGroceryModal,
    setShowGroceryModal,
    groceryWeekOffset,
    setGroceryWeekOffset,
    selectedMeals,
    mealServings,
    showJumpButton,
    editingNoteDate,
    noteText,
    setNoteText,
    scrollViewRef,
    jumpButtonOpacity,
    swipeTranslateX,
    panResponder,
    handleScroll,
    jumpToToday,
    refetchMealPlan,
    getNoteForDate,
    getMealForSlot,
    handleStartEditNote,
    handleSaveNote,
    handleCancelEditNote,
    handleAddTag,
    handleMealPress,
    handleRemoveMeal,
    handleToggleMeal,
    handleChangeServings,
    handleCreateGroceryList,
    openGroceryModal,
    getExtrasRecipes,
    handleAddExtra,
    handleRemoveExtra,
    expandedPastDays,
    togglePastDay,
    countMealsForDate,
  };
};
