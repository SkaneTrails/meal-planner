import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { ButtonGroup, IconButton, TerminalFrame } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { fontSize, spacing, useTheme } from '@/lib/theme';
import type { Recipe } from '@/lib/types';
import { RecipeRow } from './RecipeRow';

interface ExtrasSectionProps {
  recipes: Recipe[];
  t: TFunction;
  onAddExtra: (mode: 'library' | 'random') => void;
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
        {/* Header row — label left, action buttons right (matches EmptyMealSlot) */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.mealPlan.emptyBg,
            borderRadius: borderRadius.sm,
            padding: spacing.md,
            marginBottom: recipes.length > 0 ? spacing.xs : 0,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              minWidth: 80,
            }}
          >
            <Text
              style={{
                fontSize: fontSize.md,
                fontFamily: fonts.bodySemibold,
                color: colors.content.strong,
              }}
            >
              {t('mealPlan.extras.headerTitle')}
            </Text>
          </View>

          <ButtonGroup
            gap={spacing['xs-sm']}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <IconButton
              tone="alt"
              icon="book-outline"
              label="Library"
              size={34}
              iconSize={17}
              onPress={() => onAddExtra('library')}
            />
            <IconButton
              tone="alt"
              icon="dice-outline"
              label="Random"
              size={34}
              iconSize={17}
              onPress={() => onAddExtra('random')}
            />
          </ButtonGroup>
        </View>

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
