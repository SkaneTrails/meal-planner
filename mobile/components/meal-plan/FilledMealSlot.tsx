import { Image, Pressable, Text, View } from 'react-native';
import { Button } from '@/components';
import { fontSize, spacing, useTheme } from '@/lib/theme';
import type { MealType, Recipe } from '@/lib/types';
import { PLACEHOLDER_IMAGE } from './meal-plan-constants';

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
  const { colors, fonts, borderRadius, circleStyle } = useTheme();
  const title = recipe?.title || customText || '';
  const imageUrl =
    recipe?.thumbnail_url || recipe?.image_url || PLACEHOLDER_IMAGE;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.mealPlan.slotBg,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        marginBottom: spacing['xs-sm'],
      }}
    >
      <Pressable
        onPress={() => {
          if (recipe) {
            onRecipePress(recipe.id);
          } else if (customText) {
            onEditCustomText(date, mealType, customText);
          } else {
            onMealPress(date, mealType, 'library');
          }
        }}
        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: 56,
            height: 56,
            borderRadius: borderRadius.sm,
            backgroundColor: colors.border,
          }}
          resizeMode="cover"
        />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text
            style={{
              fontSize: fontSize.md,
              fontFamily: fonts.bodySemibold,
              color: colors.primary,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: fontSize.sm,
              fontFamily: fonts.body,
              color: colors.content.tertiary,
              marginTop: spacing['2xs'],
            }}
          >
            {label}
          </Text>
        </View>
      </Pressable>

      <Button
        variant="icon"
        tone="cancel"
        onPress={() => onRemove(date, mealType, title, label)}
        icon="close"
        iconSize={18}
        style={{
          ...circleStyle(28),
          marginLeft: spacing.sm,
        }}
      />
    </View>
  );
};
