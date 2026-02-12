import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAllRecipes, useSetMeal, useRemoveMeal, useMealPlan } from '@/lib/hooks';
import { showNotification } from '@/lib/alert';
import { useTranslation } from '@/lib/i18n';
import { formatDateLocal, toBcp47 } from '@/lib/utils/dateFormatter';
import type { MealType, Recipe } from '@/lib/types';

const MEAL_TYPE_TO_LABEL: Record<MealType, string[]> = {
  breakfast: ['breakfast'],
  lunch: ['meal', 'grill'],
  dinner: ['meal', 'grill'],
  snack: ['dessert', 'drink'],
};

export type TabType = 'library' | 'copy' | 'random' | 'quick';

export const useSelectRecipeState = () => {
  const { date, mealType, mode, initialText } = useLocalSearchParams<{
    date: string;
    mealType: MealType;
    mode?: 'library' | 'copy' | 'quick' | 'random';
    initialText?: string;
  }>();
  const router = useRouter();

  const { recipes } = useAllRecipes();
  const { data: mealPlan } = useMealPlan();
  const setMeal = useSetMeal();
  const removeMeal = useRemoveMeal();
  const { t, language } = useTranslation();

  const MEAL_TYPE_LABELS: Record<MealType, string> = useMemo(() => ({
    breakfast: t('selectRecipe.mealTypeLabels.breakfast'),
    lunch: t('selectRecipe.mealTypeLabels.lunch'),
    dinner: t('selectRecipe.mealTypeLabels.dinner'),
    snack: t('selectRecipe.mealTypeLabels.snack'),
  }), [t]);

  const [activeTab, setActiveTab] = useState<TabType>(
    mode === 'copy' ? 'copy' : mode === 'random' ? 'random' : mode === 'quick' ? 'quick' : 'library'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [customText, setCustomText] = useState(initialText || '');
  const [shuffleCount, setShuffleCount] = useState(0);
  const randomIdRef = useRef<string | null>(null);
  const [copyWeekOffset, setCopyWeekOffset] = useState(0);

  useEffect(() => {
    if (mode) setActiveTab(mode);
    if (mode !== 'quick' || !initialText) setCustomText('');
  }, [mode, initialText]);

  useEffect(() => {
    if (initialText) setCustomText(initialText);
  }, [initialText]);

  const filteredRecipes = useMemo(() => {
    if (searchQuery === '') return recipes;
    return recipes.filter((recipe) =>
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recipes, searchQuery]);

  const mealTypeRecipes = useMemo(() => {
    const allowedLabels = MEAL_TYPE_TO_LABEL[mealType] || ['meal'];
    return recipes.filter((recipe) => {
      if (recipe.meal_label) return allowedLabels.includes(recipe.meal_label);
      return mealType === 'lunch' || mealType === 'dinner';
    });
  }, [recipes, mealType]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: shuffleCount triggers re-pick intentionally
  const randomRecipe = useMemo(() => {
    if (mealTypeRecipes.length === 0) return null;
    const existing = mealTypeRecipes.find(r => r.id === randomIdRef.current);
    if (existing) return existing;
    const picked = mealTypeRecipes[Math.floor(Math.random() * mealTypeRecipes.length)];
    randomIdRef.current = picked.id;
    return picked;
  }, [mealTypeRecipes, shuffleCount]);

  const shuffleRandom = useCallback(() => {
    if (mealTypeRecipes.length <= 1) return;
    let picked: Recipe;
    do {
      picked = mealTypeRecipes[Math.floor(Math.random() * mealTypeRecipes.length)];
    } while (picked.id === randomIdRef.current && mealTypeRecipes.length > 1);
    randomIdRef.current = picked.id;
    setShuffleCount(c => c + 1);
  }, [mealTypeRecipes]);

  const targetWeekDates = useMemo(() => {
    const targetDate = new Date(date + 'T00:00:00');
    const targetDay = targetDate.getDay();
    const daysSinceMonday = (targetDay + 6) % 7;
    const monday = new Date(targetDate);
    monday.setDate(targetDate.getDate() - daysSinceMonday + copyWeekOffset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: formatDateLocal(monday), end: formatDateLocal(sunday), mondayDate: monday, sundayDate: sunday };
  }, [date, copyWeekOffset]);

  const existingMeals = useMemo(() => {
    if (!mealPlan?.meals) return [];
    const recipeMap = new Map(recipes.map(r => [r.id, r]));
    const meals: { key: string; date: string; mealType: string; recipe?: Recipe; customText?: string }[] = [];

    Object.entries(mealPlan.meals).forEach(([key, value]) => {
      const [dateStr, type] = key.split('_');
      if (key === `${date}_${mealType}`) return;
      if (dateStr < targetWeekDates.start || dateStr > targetWeekDates.end) return;

      if (value.startsWith('custom:')) {
        meals.push({ key, date: dateStr, mealType: type, customText: value.slice(7) });
      } else {
        const recipe = recipeMap.get(value);
        if (recipe) meals.push({ key, date: dateStr, mealType: type, recipe });
      }
    });

    return meals.sort((a, b) => a.date.localeCompare(b.date));
  }, [mealPlan, recipes, date, mealType, targetWeekDates]);

  const bcp47 = toBcp47(language);
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString(bcp47, {
    weekday: 'long', month: 'short', day: 'numeric',
  });

  const handleSelectRecipe = async (recipeId: string) => {
    try {
      await setMeal.mutateAsync({ date, mealType, recipeId });
      router.replace('/(tabs)/meal-plan');
    } catch {
      showNotification(t('common.error'), t('selectRecipe.failedToSetMeal'));
    }
  };

  const handleSetCustomText = async () => {
    if (!customText.trim()) return;
    try {
      await setMeal.mutateAsync({ date, mealType, customText: customText.trim() });
      setCustomText('');
      router.replace('/(tabs)/meal-plan');
    } catch {
      showNotification(t('common.error'), t('selectRecipe.failedToSetMeal'));
    }
  };

  const handleCopyMeal = async (recipeId?: string, customTextValue?: string) => {
    try {
      if (recipeId) {
        await setMeal.mutateAsync({ date, mealType, recipeId });
      } else if (customTextValue) {
        await setMeal.mutateAsync({ date, mealType, customText: customTextValue });
      }
      router.replace('/(tabs)/meal-plan');
    } catch {
      showNotification(t('common.error'), t('selectRecipe.failedToCopyMeal'));
    }
  };

  const handleRemoveMeal = async () => {
    try {
      await removeMeal.mutateAsync({ date, mealType });
      router.back();
    } catch {
      showNotification(t('common.error'), t('selectRecipe.failedToRemoveMeal'));
    }
  };

  const formatMealDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(bcp47, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return {
    t, language, date, mealType, mode, router,
    MEAL_TYPE_LABELS, activeTab, setActiveTab,
    searchQuery, setSearchQuery, filteredRecipes,
    randomRecipe, mealTypeRecipes, shuffleRandom,
    customText, setCustomText, handleSetCustomText,
    copyWeekOffset, setCopyWeekOffset, targetWeekDates, existingMeals, formatMealDate,
    formattedDate, bcp47,
    handleSelectRecipe, handleCopyMeal, handleRemoveMeal,
    setMeal, removeMeal,
  };
};
