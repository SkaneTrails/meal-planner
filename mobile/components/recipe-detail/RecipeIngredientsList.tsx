import { Text, View } from 'react-native';
import { Section, TerminalFrame } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { fontSize, lineHeight, spacing, useTheme } from '@/lib/theme';

interface RecipeIngredientsListProps {
  ingredients: string[];
  t: TFunction;
}

export const RecipeIngredientsList = ({
  ingredients,
  t,
}: RecipeIngredientsListProps) => {
  const { colors, fonts, borderRadius, shadows, chrome } = useTheme();

  if (chrome === 'flat') {
    return (
      <View style={{ marginTop: spacing.xl }}>
        <TerminalFrame
          variant="single"
          label={t('recipe.ingredients').toUpperCase()}
        >
          <View
            style={{
              backgroundColor: colors.mealPlan.slotBg,
              padding: spacing.lg,
            }}
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
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontFamily: fonts.body,
                      marginRight: spacing.sm,
                      fontSize: fontSize.xl,
                      lineHeight: lineHeight.lg,
                    }}
                  >
                    {'\u2022'}
                  </Text>
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
          </View>
        </TerminalFrame>
      </View>
    );
  }

  return (
    <Section
      title={t('recipe.ingredients')}
      icon="list"
      size="sm"
      spacing={0}
      style={{ marginTop: spacing.xl }}
    >
      {ingredients.length === 0 ? (
        <Text
          style={{
            color: colors.gray[500],
            fontSize: fontSize.xl,
            fontStyle: 'italic',
          }}
        >
          {t('recipe.noIngredients')}
        </Text>
      ) : (
        <View
          style={{
            backgroundColor: colors.glass.solid,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            ...shadows.card,
          }}
        >
          {ingredients.map((ingredient, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                paddingVertical: spacing.sm,
                borderBottomWidth: index < ingredients.length - 1 ? 1 : 0,
                borderBottomColor: colors.chip.divider,
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
                  color: colors.text.inverse,
                  lineHeight: lineHeight.lg,
                }}
              >
                {ingredient}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Section>
  );
};
