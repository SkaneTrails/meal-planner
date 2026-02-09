import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAllRecipes, useMealPlan, useGroceryState } from '@/lib/hooks';
import { useSettings } from '@/lib/settings-context';
import { useTranslation } from '@/lib/i18n';
import { formatDateLocal } from '@/lib/utils/dateFormatter';
import type { Recipe } from '@/lib/types';

const getNextMeal = (
  mealPlan: { meals?: Record<string, string> } | undefined,
  recipes: Recipe[],
): {
  title: string;
  imageUrl?: string;
  isCustom: boolean;
  mealType: string;
  recipeId?: string;
  isTomorrow?: boolean;
} | null => {
  if (!mealPlan?.meals) return null;
  const now = new Date();
  const today = formatDateLocal(now);
  const currentHour = now.getHours();

  const mealTypes = currentHour < 12 ? ['lunch', 'dinner'] : ['dinner'];

  for (const mealType of mealTypes) {
    const key = `${today}_${mealType}`;
    const value = mealPlan.meals[key];
    if (value) {
      if (value.startsWith('custom:')) {
        return { title: value.slice(7), isCustom: true, mealType };
      }
      const recipe = recipes.find(r => r.id === value);
      if (recipe) {
        return { title: recipe.title, imageUrl: recipe.thumbnail_url || recipe.image_url || undefined, isCustom: false, mealType, recipeId: recipe.id };
      }
    }
  }

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = formatDateLocal(tomorrow);

  for (const mealType of ['lunch', 'dinner']) {
    const key = `${tomorrowStr}_${mealType}`;
    const value = mealPlan.meals[key];
    if (value) {
      if (value.startsWith('custom:')) {
        return { title: value.slice(7), isCustom: true, mealType, isTomorrow: true };
      }
      const recipe = recipes.find(r => r.id === value);
      if (recipe) {
        return { title: recipe.title, imageUrl: recipe.thumbnail_url || recipe.image_url || undefined, isCustom: false, mealType, recipeId: recipe.id, isTomorrow: true };
      }
    }
  }

  return null;
};

const getGreetingKey = (): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'greetingMorning';
  if (hour >= 12 && hour < 18) return 'greetingAfternoon';
  return 'greetingEvening';
};

export const useHomeScreenData = () => {
  const router = useRouter();
  const { recipes, totalCount, isLoading: recipesLoading, refetch: refetchRecipes } = useAllRecipes();
  const { data: mealPlan, isLoading: mealPlanLoading, refetch: refetchMealPlan } = useMealPlan();
  const { checkedItems, selectedMealKeys, customItems, refreshFromStorage } = useGroceryState();
  const { isItemAtHome } = useSettings();
  const { t } = useTranslation();
  const [recipeUrl, setRecipeUrl] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [inspirationIndex, setInspirationIndex] = useState(() => Math.floor(Math.random() * 10000));
  const greetingKey = useMemo(() => getGreetingKey(), []);

  const isLoading = recipesLoading || mealPlanLoading;

  const handleRefresh = useCallback(() => {
    refetchRecipes();
    refetchMealPlan();
    refreshFromStorage();
  }, [refetchRecipes, refetchMealPlan, refreshFromStorage]);

  const groceryItemsCount = useMemo(() => {
    if (!mealPlan || selectedMealKeys.length === 0) {
      return customItems.filter(name =>
        !checkedItems.has(name) && !isItemAtHome(name)
      ).length;
    }

    const recipeMap = new Map(recipes.map(r => [r.id, r]));
    const ingredientNames = new Set<string>();

    selectedMealKeys.forEach(key => {
      const recipeId = mealPlan.meals?.[key];
      if (!recipeId || recipeId.startsWith('custom:')) return;

      const recipe = recipeMap.get(recipeId);
      if (!recipe) return;

      recipe.ingredients.forEach(ingredient => {
        const name = ingredient.toLowerCase().trim()
          .replace(/\s*\(steg\s*\d+\)\s*$/i, '')
          .replace(/\s*\(step\s*\d+\)\s*$/i, '')
          .replace(/\s+till\s+\w+$/i, '');
        ingredientNames.add(name);
      });
    });

    customItems.forEach(name => ingredientNames.add(name));

    let uncheckedCount = 0;
    ingredientNames.forEach(name => {
      if (!isItemAtHome(name) && !checkedItems.has(name)) {
        uncheckedCount++;
      }
    });

    return uncheckedCount;
  }, [mealPlan, selectedMealKeys, recipes, customItems, checkedItems, isItemAtHome]);

  const inspirationRecipes = useMemo(() => {
    return recipes.filter(
      (recipe: Recipe) => recipe.meal_label && recipe.meal_label !== 'meal' && recipe.meal_label !== 'grill'
    );
  }, [recipes]);

  const inspirationRecipe = useMemo(() => {
    if (inspirationRecipes.length === 0) return null;
    return inspirationRecipes[inspirationIndex % inspirationRecipes.length];
  }, [inspirationRecipes, inspirationIndex]);

  const shuffleInspiration = useCallback(() => {
    if (inspirationRecipes.length <= 1) return;
    let newIndex: number;
    do {
      newIndex = Math.floor(Math.random() * inspirationRecipes.length);
    } while (newIndex === inspirationIndex && inspirationRecipes.length > 1);
    setInspirationIndex(newIndex);
  }, [inspirationRecipes.length, inspirationIndex]);

  const plannedMealsCount = mealPlan?.meals ? Object.keys(mealPlan.meals).length : 0;
  const nextMeal = getNextMeal(mealPlan, recipes);

  const handleImportRecipe = useCallback(() => {
    if (recipeUrl.trim()) {
      router.push({ pathname: '/add-recipe', params: { url: recipeUrl.trim() } });
      setRecipeUrl('');
    }
  }, [recipeUrl, router]);

  return {
    router,
    recipes,
    totalCount,
    isLoading,
    handleRefresh,
    greetingKey,
    t,
    recipeUrl,
    setRecipeUrl,
    showAddModal,
    setShowAddModal,
    groceryItemsCount,
    plannedMealsCount,
    nextMeal,
    inspirationRecipes,
    inspirationRecipe,
    shuffleInspiration,
    handleImportRecipe,
  };
};
