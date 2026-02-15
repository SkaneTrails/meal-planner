import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { AnimatedPressable } from '@/components';
import { colors, fontFamily } from '@/lib/theme';
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
  const router = useRouter();
  const title = recipe?.title || customText || '';
  const imageUrl =
    recipe?.thumbnail_url || recipe?.image_url || PLACEHOLDER_IMAGE;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(240, 235, 228, 0.85)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 6,
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
            borderRadius: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          }}
          resizeMode="cover"
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{
              fontSize: 13,
              fontFamily: fontFamily.bodySemibold,
              color: '#2D2D2D',
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontFamily: fontFamily.body,
              color: colors.content.tertiary,
              marginTop: 2,
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
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.surface.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 8,
        }}
      >
        <Ionicons name="close" size={18} color={colors.content.body} />
      </AnimatedPressable>
    </View>
  );
};
