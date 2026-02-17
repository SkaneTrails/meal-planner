import type { ColorTokens } from '@/lib/theme';
import type {
  DietLabel,
  MealLabel,
  MealType,
  RecipeVisibility,
} from '@/lib/types';

export const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0teleV@';

export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800';

export const getDietOptions = (
  colors: ColorTokens,
): {
  value: DietLabel | null;
  labelKey: string;
  dotColor: string | null;
}[] => [
  { value: null, labelKey: 'labels.diet.none', dotColor: null },
  {
    value: 'veggie',
    labelKey: 'labels.diet.veggie',
    dotColor: colors.diet.veggie.text,
  },
  {
    value: 'fish',
    labelKey: 'labels.diet.fish',
    dotColor: colors.diet.fish.text,
  },
  {
    value: 'meat',
    labelKey: 'labels.diet.meat',
    dotColor: colors.diet.meat.text,
  },
];

export const VISIBILITY_OPTIONS: {
  value: RecipeVisibility;
  labelKey: string;
  icon: 'lock-closed-outline' | 'globe-outline';
  descKey: string;
}[] = [
  {
    value: 'household',
    labelKey: 'labels.visibility.private',
    icon: 'lock-closed-outline',
    descKey: 'labels.visibility.privateDesc',
  },
  {
    value: 'shared',
    labelKey: 'labels.visibility.shared',
    icon: 'globe-outline',
    descKey: 'labels.visibility.sharedDesc',
  },
];

export const MEAL_OPTIONS: { value: MealLabel | null; labelKey: string }[] = [
  { value: null, labelKey: 'labels.meal.none' },
  { value: 'breakfast', labelKey: 'labels.meal.breakfast' },
  { value: 'starter', labelKey: 'labels.meal.starter' },
  { value: 'salad', labelKey: 'labels.meal.salad' },
  { value: 'meal', labelKey: 'labels.meal.mainCourse' },
  { value: 'dessert', labelKey: 'labels.meal.dessert' },
  { value: 'drink', labelKey: 'labels.meal.drink' },
  { value: 'sauce', labelKey: 'labels.meal.sauce' },
  { value: 'pickle', labelKey: 'labels.meal.pickle' },
  { value: 'grill', labelKey: 'labels.meal.grill' },
];

export const DEFAULT_MEAL_TYPES: { type: MealType; labelKey: string }[] = [
  { type: 'lunch', labelKey: 'labels.mealTime.lunch' },
  { type: 'dinner', labelKey: 'labels.mealTime.dinner' },
];

export const getDietLabels = (
  colors: ColorTokens,
): Record<DietLabel, { dotColor: string; color: string; bgColor: string }> => ({
  veggie: {
    dotColor: colors.diet.veggie.text,
    color: colors.diet.veggie.text,
    bgColor: colors.diet.veggie.bg,
  },
  fish: {
    dotColor: colors.diet.fish.text,
    color: colors.diet.fish.text,
    bgColor: colors.diet.fish.bg,
  },
  meat: {
    dotColor: colors.diet.meat.text,
    color: colors.diet.meat.text,
    bgColor: colors.diet.meat.bg,
  },
});
