import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, TerminalFrame } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';
import type { Recipe } from '@/lib/types';
import { RecipeRow } from './RecipeRow';

interface ExtrasSectionProps {
  recipes: Recipe[];
  t: TFunction;
  onAddExtra: () => void;
  onRemoveExtra: (recipeId: string, title: string) => void;
}

export const ExtrasSection = ({
  recipes,
  t,
  onAddExtra,
  onRemoveExtra,
}: ExtrasSectionProps) => {
  const { colors, fonts, borderRadius, overrides, visibility } = useTheme();
  return (
    <TerminalFrame
      label={
        visibility.showFrameLabels
          ? t('mealPlan.extras.headerTitle').toUpperCase()
          : undefined
      }
      variant="single"
      style={{ marginBottom: spacing.lg }}
    >
      <View
        style={{
          backgroundColor: colors.mealPlan.containerBg,
          borderRadius: borderRadius.lg,
          padding: spacing['md-lg'],
          borderWidth: overrides.dashedBorderWidth,
          borderColor: colors.surface.pressed,
          borderStyle: 'dashed',
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing['sm-md'],
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name="bookmark-outline"
              size={18}
              color={colors.content.secondary}
              style={{ marginRight: spacing['xs-sm'] }}
            />
            <Text
              style={{
                fontSize: fontSize.lg,
                fontFamily: fonts.displayBold,
                fontWeight: fontWeight.semibold,
                color: colors.content.body,
                fontStyle: 'italic',
              }}
            >
              {t('mealPlan.extras.headerTitle')}
            </Text>
          </View>
          <Button
            variant="text"
            tone="alt"
            size="sm"
            onPress={onAddExtra}
            icon="add"
            label={t('mealPlan.extras.add')}
          />
        </View>

        {/* Empty state */}
        {recipes.length === 0 && (
          <Button
            variant="text"
            tone="alt"
            onPress={onAddExtra}
            icon="add-circle-outline"
            iconSize={20}
            label={t('mealPlan.extras.emptyState')}
            style={{
              justifyContent: 'center',
              borderRadius: borderRadius.sm,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.surface.subtle,
              borderStyle: 'dashed',
            }}
          />
        )}

        {/* Recipe list */}
        {recipes.map((recipe) => (
          <ExtraRecipeRow
            key={recipe.id}
            recipe={recipe}
            onRemove={() => onRemoveExtra(recipe.id, recipe.title)}
          />
        ))}
      </View>
    </TerminalFrame>
  );
};

interface ExtraRecipeRowProps {
  recipe: Recipe;
  onRemove: () => void;
}

const ExtraRecipeRow = ({ recipe, onRemove }: ExtraRecipeRowProps) => {
  const router = useRouter();
  const imageUrl = recipe.thumbnail_url || recipe.image_url;

  return (
    <RecipeRow
      title={recipe.title}
      imageUrl={imageUrl}
      subtitle={recipe.total_time ? `${recipe.total_time} min` : undefined}
      onPress={() => router.push(`/recipe/${recipe.id}`)}
      onRemove={onRemove}
    />
  );
};
