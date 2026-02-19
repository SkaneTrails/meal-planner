import { View } from 'react-native';
import { Chip } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { spacing, useTheme } from '@/lib/theme';
import type { Recipe } from '@/lib/types';
import { getDietLabels } from './recipe-detail-constants';

interface RecipeMetaLabelsProps {
  recipe: Recipe;
  t: TFunction;
}

export const RecipeMetaLabels = ({ recipe, t }: RecipeMetaLabelsProps) => {
  const { colors, visibility } = useTheme();
  const dietLabels = getDietLabels(colors);

  const mealChipBg = colors.metaChip.mealBg;
  const mealChipColor = colors.metaChip.mealText;
  const visChipBg = colors.metaChip.visibilityBg;
  const visChipColor = colors.metaChip.visibilityText;

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: spacing.md,
        gap: spacing.sm,
        alignItems: 'center',
      }}
    >
      {recipe.diet_label && (
        <Chip
          label={t(`labels.diet.${recipe.diet_label}`)}
          variant="display"
          dot={dietLabels[recipe.diet_label].dotColor}
          bg={dietLabels[recipe.diet_label].bgColor}
          color={dietLabels[recipe.diet_label].color}
        />
      )}
      {recipe.meal_label && (
        <Chip
          label={t(`labels.meal.${recipe.meal_label}`)}
          variant="display"
          bg={mealChipBg}
          color={mealChipColor}
        />
      )}
      {visibility.showVisibilityChip && recipe.visibility && (
        <Chip
          label={t(
            `labels.visibility.${recipe.visibility === 'shared' ? 'shared' : 'private'}`,
          )}
          variant="display"
          icon={
            recipe.visibility === 'shared'
              ? 'globe-outline'
              : 'lock-closed-outline'
          }
          bg={visChipBg}
          color={visChipColor}
        />
      )}
    </View>
  );
};
