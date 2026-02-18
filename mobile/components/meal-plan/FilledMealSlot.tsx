import { useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { Button } from '@/components';
import { fontSize, spacing, useTheme } from '@/lib/theme';
import type { MealType, Recipe } from '@/lib/types';
import { formatDateLocal } from '@/lib/utils/dateFormatter';
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
}

export const FilledMealSlot = ({
  date,
  mealType,
  label,
  recipe,
  customText,
  onRemove,
  onMealPress,
}: FilledMealSlotProps) => {
  const { colors, fonts, borderRadius, circleStyle } = useTheme();
  const router = useRouter();
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
            router.push(`/recipe/${recipe.id}`);
          } else if (customText) {
            const dateStr = formatDateLocal(date);
            router.push({
              pathname: '/select-recipe',
              params: {
                date: dateStr,
                mealType,
                mode: 'quick',
                initialText: customText,
              },
            });
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
        onPress={() => onRemove(date, mealType, title, label)}
        icon="close"
        iconSize={18}
        style={{
          ...circleStyle(28),
          backgroundColor: colors.surface.border,
          marginLeft: spacing.sm,
        }}
      />
    </View>
  );
};
