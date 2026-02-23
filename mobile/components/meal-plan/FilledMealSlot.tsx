import type { MealType, Recipe } from '@/lib/types';
import { RecipeRow } from './RecipeRow';

interface FilledMealSlotProps {
  date: Date;
  mealType: MealType;
  label: string;
  recipe?: Recipe;
  customText?: string;
  onRemove: (
    date: Date,
    mealType: MealType,
    title: string,
    label: string,
  ) => void;
  onMealPress: (
    date: Date,
    mealType: MealType,
    mode: 'library' | 'copy' | 'quick' | 'random',
  ) => void;
  onEditCustomText: (
    date: Date,
    mealType: MealType,
    initialText: string,
  ) => void;
  onRecipePress: (recipeId: string) => void;
}

export const FilledMealSlot = ({
  date,
  mealType,
  label,
  recipe,
  customText,
  onRemove,
  onMealPress,
  onEditCustomText,
  onRecipePress,
}: FilledMealSlotProps) => {
  const title = recipe?.title || customText || '';
  const imageUrl = recipe?.thumbnail_url || recipe?.image_url;

  const handlePress = () => {
    if (recipe) {
      onRecipePress(recipe.id);
    } else if (customText) {
      onEditCustomText(date, mealType, customText);
    } else {
      onMealPress(date, mealType, 'library');
    }
  };

  return (
    <RecipeRow
      title={title}
      imageUrl={imageUrl}
      subtitle={label}
      onPress={handlePress}
      onRemove={() => onRemove(date, mealType, title, label)}
    />
  );
};
