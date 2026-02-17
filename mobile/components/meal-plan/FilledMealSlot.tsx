import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { AnimatedPressable } from '@/components';
import {
  borderRadius,
  circleStyle,
  fontFamily,
  fontSize,
  spacing,
  useTheme,
} from '@/lib/theme';
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
  const { colors } = useTheme();
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
              fontFamily: fontFamily.bodySemibold,
              color: colors.primary,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: fontSize.sm,
              fontFamily: fontFamily.body,
              color: colors.content.tertiary,
              marginTop: spacing['2xs'],
            }}
          >
            {label}
          </Text>
        </View>
      </Pressable>

      <AnimatedPressable
        onPress={() => onRemove(date, mealType, title, label)}
        hoverScale={1.1}
        pressScale={0.9}
        style={{
          ...circleStyle(28),
          backgroundColor: colors.surface.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: spacing.sm,
        }}
      >
        <Ionicons name="close" size={18} color={colors.content.body} />
      </AnimatedPressable>
    </View>
  );
};
