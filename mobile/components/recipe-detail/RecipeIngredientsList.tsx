import { Text, View } from 'react-native';
import { Section } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { fontSize, lineHeight, spacing, useTheme } from '@/lib/theme';

interface RecipeIngredientsListProps {
  ingredients: string[];
  t: TFunction;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

export const RecipeIngredientsList = ({
  ingredients,
  t,
  collapsible = false,
  expanded = true,
  onToggle,
}: RecipeIngredientsListProps) => {
  const { colors, fonts, borderRadius } = useTheme();

  return (
    <Section
      title={t('recipe.ingredients')}
      icon="list"
      size="sm"
      spacing={0}
      collapsible={collapsible}
      expanded={expanded}
      onToggle={onToggle}
    >
      {ingredients.length === 0 ? (
        <Text
          style={{
            color: colors.content.secondary,
            fontSize: fontSize.xl,
            fontFamily: fonts.body,
            fontStyle: 'italic',
          }}
        >
          {t('recipe.noIngredients')}
        </Text>
      ) : (
        ingredients.map((ingredient, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              paddingVertical: spacing.sm,
              borderBottomWidth: index < ingredients.length - 1 ? 1 : 0,
              borderBottomColor: colors.surface.divider,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: borderRadius['2xs'],
                backgroundColor: colors.primary,
                marginTop: 7,
                marginRight: spacing.md,
              }}
            />
            <Text
              style={{
                flex: 1,
                fontSize: fontSize.xl,
                fontFamily: fonts.body,
                color: colors.content.body,
                lineHeight: lineHeight.lg,
              }}
            >
              {ingredient}
            </Text>
          </View>
        ))
      )}
    </Section>
  );
};
