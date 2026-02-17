import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { AnimatedPressable } from '@/components';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  circleStyle,
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  spacing,
} from '@/lib/theme';
import type { Recipe } from '@/lib/types';
import { PLACEHOLDER_IMAGE } from './meal-plan-constants';

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
  return (
    <View
      style={{
        marginBottom: spacing.lg,
        backgroundColor: colors.mealPlan.containerBg,
        borderRadius: borderRadius.lg,
        padding: spacing['md-lg'],
        borderWidth: 1.5,
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
              fontFamily: fontFamily.displayBold,
              fontWeight: fontWeight.semibold,
              color: colors.content.body,
              fontStyle: 'italic',
            }}
          >
            {t('mealPlan.extras.headerTitle')}
          </Text>
        </View>
        <AnimatedPressable
          onPress={onAddExtra}
          hoverScale={1.05}
          pressScale={0.95}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            backgroundColor: colors.surface.subtle,
            borderRadius: borderRadius.full,
          }}
        >
          <Ionicons name="add" size={16} color={colors.content.body} />
          <Text
            style={{
              fontSize: fontSize.sm,
              fontFamily: fontFamily.body,
              color: colors.content.body,
              marginLeft: spacing.xs,
            }}
          >
            {t('mealPlan.extras.add')}
          </Text>
        </AnimatedPressable>
      </View>

      {/* Empty state */}
      {recipes.length === 0 && (
        <Pressable
          onPress={onAddExtra}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.mealPlan.emptyStateBg,
            borderRadius: borderRadius.sm,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: colors.surface.subtle,
            borderStyle: 'dashed',
          }}
        >
          <Ionicons
            name="add-circle-outline"
            size={20}
            color={colors.content.icon}
          />
          <Text
            style={{
              fontSize: fontSize.sm,
              fontFamily: fontFamily.body,
              color: colors.content.subtitle,
              marginLeft: spacing.sm,
            }}
          >
            {t('mealPlan.extras.emptyState')}
          </Text>
        </Pressable>
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
  );
};

interface ExtraRecipeRowProps {
  recipe: Recipe;
  onRemove: () => void;
}

const ExtraRecipeRow = ({ recipe, onRemove }: ExtraRecipeRowProps) => {
  const router = useRouter();
  const imageUrl =
    recipe.thumbnail_url || recipe.image_url || PLACEHOLDER_IMAGE;

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
        onPress={() => router.push(`/recipe/${recipe.id}`)}
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
            {recipe.title}
          </Text>
          {recipe.total_time && (
            <Text
              style={{
                fontSize: fontSize.sm,
                fontFamily: fontFamily.body,
                color: colors.content.tertiary,
                marginTop: spacing['2xs'],
              }}
            >
              {recipe.total_time} min
            </Text>
          )}
        </View>
      </Pressable>

      <AnimatedPressable
        onPress={onRemove}
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
