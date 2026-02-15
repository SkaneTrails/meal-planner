import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  letterSpacing,
  spacing,
} from '@/lib/theme';

interface RecipeIngredientsListProps {
  ingredients: string[];
  t: TFunction;
}

export const RecipeIngredientsList = ({
  ingredients,
  t,
}: RecipeIngredientsListProps) => (
  <View style={{ marginTop: spacing.xl }}>
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.surface.active,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
        }}
      >
        <Ionicons name="list" size={18} color="#5D4037" />
      </View>
      <Text
        style={{
          fontSize: fontSize['3xl'],
          fontFamily: fontFamily.display,
          color: colors.content.heading,
          letterSpacing: letterSpacing.normal,
        }}
      >
        {t('recipe.ingredients')}
      </Text>
    </View>
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
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          shadowColor: '#000',
          shadowOffset: { width: 1, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
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
              borderBottomColor: 'rgba(139, 115, 85, 0.15)',
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.primary,
                marginTop: 7,
                marginRight: spacing.md,
              }}
            />
            <Text
              style={{
                flex: 1,
                fontSize: fontSize.xl,
                fontFamily: fontFamily.body,
                color: colors.text.inverse,
                lineHeight: 22,
              }}
            >
              {ingredient}
            </Text>
          </View>
        ))}
      </View>
    )}
  </View>
);
