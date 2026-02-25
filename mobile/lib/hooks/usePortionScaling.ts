import { useCallback, useMemo, useState } from 'react';
import { scaleIngredient } from '@/lib/utils/ingredientParser';

const MIN_PORTIONS = 1;
const MAX_PORTIONS = 50;

interface UsePortionScalingResult {
  currentPortions: number;
  originalPortions: number;
  scaleFactor: number;
  isScaled: boolean;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  scaleIngredients: (ingredients: string[]) => string[];
}

export const usePortionScaling = (
  originalServings: number | null | undefined,
): UsePortionScalingResult => {
  const originalPortions =
    originalServings && originalServings > 0 ? originalServings : 0;

  const [currentPortions, setCurrentPortions] = useState(originalPortions);

  const scaleFactor =
    originalPortions > 0 && currentPortions > 0
      ? currentPortions / originalPortions
      : 1;

  const isScaled = currentPortions !== originalPortions;

  const increment = useCallback(() => {
    setCurrentPortions((prev) => Math.min(prev + 1, MAX_PORTIONS));
  }, []);

  const decrement = useCallback(() => {
    setCurrentPortions((prev) => Math.max(prev - 1, MIN_PORTIONS));
  }, []);

  const reset = useCallback(() => {
    setCurrentPortions(originalPortions);
  }, [originalPortions]);

  const scaleIngredients = useCallback(
    (ingredients: string[]) => {
      if (scaleFactor === 1) return ingredients;
      return ingredients.map((ing) => scaleIngredient(ing, scaleFactor));
    },
    [scaleFactor],
  );

  return useMemo(
    () => ({
      currentPortions,
      originalPortions,
      scaleFactor,
      isScaled,
      increment,
      decrement,
      reset,
      scaleIngredients,
    }),
    [
      currentPortions,
      originalPortions,
      scaleFactor,
      isScaled,
      increment,
      decrement,
      reset,
      scaleIngredients,
    ],
  );
};
