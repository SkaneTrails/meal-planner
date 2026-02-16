import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { useSelectRecipeState } from '@/lib/hooks/useSelectRecipeState';
import {
  borderRadius,
  circleStyle,
  colors,
  dotSize,
  fontSize,
  iconContainer,
  layout,
  letterSpacing,
  shadows,
  spacing,
} from '@/lib/theme';

type State = ReturnType<typeof useSelectRecipeState>;

interface RandomTabProps {
  state: State;
}

export const RandomTab = ({ state }: RandomTabProps) => {
  const {
    t,
    randomRecipe,
    mealTypeRecipes,
    shuffleRandom,
    handleSelectRecipe,
    setMeal,
    MEAL_TYPE_LABELS,
    mealType,
  } = state;

  if (!randomRecipe) {
    return (
      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: layout.tabBar.contentBottomPadding,
        }}
      >
        <EmptyState
          icon="dice-outline"
          title={t('selectRecipe.random.noRecipes', {
            mealType: MEAL_TYPE_LABELS[mealType].toLowerCase(),
          })}
          subtitle={t('selectRecipe.random.addRecipesHint', {
            mealType: MEAL_TYPE_LABELS[mealType].toLowerCase(),
          })}
          style={{ paddingVertical: spacing['4xl'] }}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: layout.tabBar.contentBottomPadding,
      }}
    >
      <View style={{ alignItems: 'center' }}>
        {/* Header */}
        <RandomHeader
          t={t}
          mealTypeCount={mealTypeRecipes.length}
          mealTypeLabel={MEAL_TYPE_LABELS[mealType].toLowerCase()}
        />

        {/* Recipe Card */}
        <View style={{ width: '100%', marginBottom: spacing.xl }}>
          <RandomRecipeCard
            recipe={randomRecipe}
            onSelect={handleSelectRecipe}
            t={t}
          />
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%' }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              onPress={() => handleSelectRecipe(randomRecipe.id)}
              disabled={setMeal.isPending}
              icon="checkmark-circle"
              label={t('selectRecipe.random.addToPlan')}
              pressedColor={colors.button.primaryPressed}
            />
          </View>
          <Pressable
            onPress={shuffleRandom}
            disabled={setMeal.isPending}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.md,
              borderRadius: borderRadius.sm,
              backgroundColor: pressed
                ? colors.glass.medium
                : colors.glass.card,
              opacity: setMeal.isPending ? 0.5 : 1,
              ...shadows.sm,
            })}
          >
            <Ionicons name="shuffle" size={20} color={colors.text.inverse} />
            <Text
              style={{
                marginLeft: spacing.sm,
                fontSize: fontSize.lg,
                fontWeight: '600',
                color: colors.text.inverse,
              }}
            >
              {t('selectRecipe.random.shuffle')}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

interface RandomHeaderProps {
  t: (key: string, opts?: Record<string, string | number>) => string;
  mealTypeCount: number;
  mealTypeLabel: string;
}

const RandomHeader = ({
  t,
  mealTypeCount,
  mealTypeLabel,
}: RandomHeaderProps) => (
  <View style={{ alignItems: 'center', marginBottom: spacing['2xl'] }}>
    <View
      style={{
        ...circleStyle(iconContainer.xl),
        backgroundColor: colors.ai.light,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
      }}
    >
      <Ionicons name="dice" size={32} color={colors.ai.primary} />
    </View>
    <Text
      style={{
        fontSize: fontSize['3xl'],
        fontWeight: '700',
        color: colors.text.inverse,
        textAlign: 'center',
        letterSpacing: letterSpacing.normal,
      }}
    >
      {t('selectRecipe.random.howAbout')}
    </Text>
    <View
      style={{
        width: 40,
        height: 3,
        borderRadius: 2,
        backgroundColor: colors.ai.primary,
        marginTop: spacing.sm,
      }}
    />
    <Text
      style={{
        fontSize: fontSize.lg,
        color: colors.gray[600],
        marginTop: spacing.xs,
      }}
    >
      {t('selectRecipe.random.matchCount', { count: mealTypeCount })}{' '}
      {mealTypeLabel}
    </Text>
  </View>
);

interface RandomRecipeCardProps {
  recipe: NonNullable<State['randomRecipe']>;
  onSelect: (id: string) => void;
  t: (key: string, opts?: Record<string, string | number>) => string;
}

const RandomRecipeCard = ({ recipe, onSelect, t }: RandomRecipeCardProps) => (
  <Pressable
    onPress={() => onSelect(recipe.id)}
    style={({ pressed }) => ({
      backgroundColor: colors.glass.card,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      ...shadows.md,
      transform: [{ scale: pressed ? 0.99 : 1 }],
    })}
  >
    {(recipe.thumbnail_url || recipe.image_url) && (
      <Image
        source={{
          uri: (recipe.thumbnail_url || recipe.image_url) ?? undefined,
        }}
        style={{ width: '100%', height: 180 }}
        resizeMode="cover"
      />
    )}
    <View style={{ padding: spacing.lg }}>
      <Text
        style={{
          fontSize: fontSize['3xl'],
          fontWeight: '700',
          color: colors.text.inverse,
          marginBottom: spacing.sm,
          letterSpacing: letterSpacing.normal,
        }}
      >
        {recipe.title}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.md,
          marginBottom: spacing.md,
        }}
      >
        {recipe.total_time && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <Ionicons name="time-outline" size={16} color={colors.gray[500]} />
            <Text style={{ fontSize: fontSize.md, color: colors.gray[600] }}>
              {t('selectRecipe.random.time', { count: recipe.total_time })}
            </Text>
          </View>
        )}
        {recipe.servings && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <Ionicons
              name="people-outline"
              size={16}
              color={colors.gray[500]}
            />
            <Text style={{ fontSize: fontSize.md, color: colors.gray[600] }}>
              {t('selectRecipe.random.servings', { count: recipe.servings })}
            </Text>
          </View>
        )}
        {recipe.diet_label && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: borderRadius.sm,
              backgroundColor:
                recipe.diet_label === 'veggie'
                  ? colors.diet.veggie.bg
                  : recipe.diet_label === 'fish'
                    ? colors.diet.fish.bg
                    : colors.diet.meat.bg,
            }}
          >
            <View
              style={{
                width: dotSize.md,
                height: dotSize.md,
                borderRadius: dotSize.md / 2,
                backgroundColor:
                  recipe.diet_label === 'veggie'
                    ? colors.diet.veggie.text
                    : recipe.diet_label === 'fish'
                      ? colors.diet.fish.text
                      : colors.diet.meat.text,
              }}
            />
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: '600',
                color:
                  recipe.diet_label === 'veggie'
                    ? colors.diet.veggie.text
                    : recipe.diet_label === 'fish'
                      ? colors.diet.fish.text
                      : colors.diet.meat.text,
              }}
            >
              {t(`labels.diet.${recipe.diet_label}`)}
            </Text>
          </View>
        )}
      </View>

      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <View>
          <Text
            style={{
              fontSize: fontSize.md,
              fontWeight: '600',
              color: colors.gray[600],
              marginBottom: spacing.xs,
            }}
          >
            {t('selectRecipe.random.ingredientsCount', {
              count: recipe.ingredients.length,
            })}
          </Text>
          <Text
            style={{
              fontSize: fontSize.base,
              color: colors.gray[500],
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {recipe.ingredients.slice(0, 5).join(' • ')}
            {recipe.ingredients.length > 5 ? ' ...' : ''}
          </Text>
        </View>
      )}
    </View>
  </Pressable>
);
