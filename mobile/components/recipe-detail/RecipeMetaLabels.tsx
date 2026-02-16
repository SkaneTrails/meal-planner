import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  dotSize,
  fontFamily,
  fontSize,
  spacing,
} from '@/lib/theme';
import type { Recipe } from '@/lib/types';
import { DIET_LABELS } from './recipe-detail-constants';

interface RecipeMetaLabelsProps {
  recipe: Recipe;
  t: TFunction;
}

export const RecipeMetaLabels = ({ recipe, t }: RecipeMetaLabelsProps) => (
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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: DIET_LABELS[recipe.diet_label].bgColor,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.md,
          gap: spacing.xs,
        }}
      >
        <View
          style={{
            width: dotSize.md,
            height: dotSize.md,
            borderRadius: dotSize.md / 2,
            backgroundColor: DIET_LABELS[recipe.diet_label].dotColor,
          }}
        />
        <Text
          style={{
            fontSize: fontSize.md,
            fontFamily: fontFamily.bodySemibold,
            color: DIET_LABELS[recipe.diet_label].color,
          }}
        >
          {t(`labels.diet.${recipe.diet_label}`)}
        </Text>
      </View>
    )}
    {recipe.meal_label && (
      <View
        style={{
          backgroundColor: colors.bgDark,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.lg,
        }}
      >
        <Text
          style={{
            fontSize: fontSize.md,
            fontFamily: fontFamily.bodySemibold,
            color: colors.text.inverse,
          }}
        >
          {t(`labels.meal.${recipe.meal_label}`)}
        </Text>
      </View>
    )}
    {recipe.visibility && (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.glass.solid,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.lg,
          gap: spacing.xs,
        }}
      >
        <Ionicons
          name={
            recipe.visibility === 'shared'
              ? 'globe-outline'
              : 'lock-closed-outline'
          }
          size={14}
          color={colors.text.inverse}
        />
        <Text
          style={{
            fontSize: fontSize.md,
            fontFamily: fontFamily.bodySemibold,
            color: colors.text.inverse,
          }}
        >
          {t(
            `labels.visibility.${recipe.visibility === 'shared' ? 'shared' : 'private'}`,
          )}
        </Text>
      </View>
    )}
  </View>
);
