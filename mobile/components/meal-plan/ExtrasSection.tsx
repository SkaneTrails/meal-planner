import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { Button, TerminalFrame } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';
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
            size="sm"
            onPress={onAddExtra}
            icon="add"
            iconSize={16}
            label={t('mealPlan.extras.add')}
            color={colors.surface.subtle}
            style={{
              paddingHorizontal: spacing.sm,
              paddingVertical: 4,
              borderRadius: borderRadius.full,
            }}
          />
        </View>

        {/* Empty state */}
        {recipes.length === 0 && (
          <Button
            variant="text"
            onPress={onAddExtra}
            icon="add-circle-outline"
            iconSize={20}
            label={t('mealPlan.extras.emptyState')}
            textColor={colors.content.subtitle}
            style={{
              justifyContent: 'center',
              backgroundColor: colors.mealPlan.emptyStateBg,
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
  const { colors, fonts, borderRadius, circleStyle } = useTheme();
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
              fontFamily: fonts.bodySemibold,
              color: colors.primary,
            }}
          >
            {recipe.title}
          </Text>
          {recipe.total_time && (
            <Text
              style={{
                fontSize: fontSize.sm,
                fontFamily: fonts.body,
                color: colors.content.tertiary,
                marginTop: spacing['2xs'],
              }}
            >
              {recipe.total_time} min
            </Text>
          )}
        </View>
      </Pressable>

      <Button
        variant="icon"
        onPress={onRemove}
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
