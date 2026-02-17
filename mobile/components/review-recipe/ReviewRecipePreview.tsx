import { Text, View } from 'react-native';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  fontFamily,
  fontSize,
  shadows,
  spacing,
  useTheme,
} from '@/lib/theme';
import type { RecipeCreate } from '@/lib/types';

interface ReviewRecipePreviewProps {
  recipe: RecipeCreate;
  t: TFunction;
}

export const ReviewRecipePreview = ({
  recipe,
  t,
}: ReviewRecipePreviewProps) => {
  const { colors } = useTheme();
  const ingredients = recipe.ingredients ?? [];
  const instructions = recipe.instructions ?? [];

  return (
    <View
      style={{
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        ...shadows.sm,
      }}
    >
      <Text
        style={{
          fontSize: fontSize.lg,
          fontFamily: fontFamily.bodySemibold,
          color: colors.text.inverse,
          marginBottom: spacing.md,
        }}
      >
        {t('recipe.ingredients')} ({ingredients.length})
      </Text>
      {ingredients.slice(0, 5).map((ingredient, index) => (
        <Text
          key={index}
          style={{
            fontSize: fontSize.md,
            color: colors.text.inverse,
            marginBottom: spacing.xs,
          }}
        >
          • {ingredient}
        </Text>
      ))}
      {ingredients.length > 5 && (
        <Text
          style={{
            fontSize: fontSize.md,
            color: colors.gray[500],
            fontStyle: 'italic',
          }}
        >
          +{ingredients.length - 5} {t('common.more')}
        </Text>
      )}

      <View style={{ height: spacing.lg }} />

      <Text
        style={{
          fontSize: fontSize.lg,
          fontFamily: fontFamily.bodySemibold,
          color: colors.text.inverse,
          marginBottom: spacing.md,
        }}
      >
        {t('recipe.instructions')} ({instructions.length}{' '}
        {t('reviewRecipe.steps')})
      </Text>
      {instructions.slice(0, 3).map((instruction, index) => (
        <Text
          key={index}
          style={{
            fontSize: fontSize.md,
            color: colors.text.inverse,
            marginBottom: spacing.sm,
          }}
          numberOfLines={2}
        >
          {index + 1}. {instruction}
        </Text>
      ))}
      {instructions.length > 3 && (
        <Text
          style={{
            fontSize: fontSize.md,
            color: colors.gray[500],
            fontStyle: 'italic',
          }}
        >
          +{instructions.length - 3} {t('common.more')}
        </Text>
      )}
    </View>
  );
};
