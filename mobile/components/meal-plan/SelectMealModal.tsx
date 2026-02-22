/**
 * Unified bottom-sheet modal for selecting what goes in a meal slot.
 *
 * Supports five modes:
 * - `library` / `extras` — searchable recipe list (FlatList)
 * - `random` — random recipe suggestion with shuffle
 * - `quick`  — free-text custom meal input
 * - `copy`   — copy a meal from another day/week
 *
 * Each mode renders a dedicated content sub-component that manages its own
 * hooks, keeping query overhead proportional to what the user actually sees.
 */

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import {
  BottomSheetModal,
  Button,
  IconButton,
  IconCircle,
  RecipeCard,
} from '@/components';
import { EmptyState } from '@/components/EmptyState';
import { SearchBar } from '@/components/recipes/RecipeFilters';
import { showNotification } from '@/lib/alert';
import {
  useAllRecipes,
  useMealPlan,
  useRemoveMeal,
  useSetMeal,
  useUpdateExtras,
} from '@/lib/hooks';
import { useTranslation } from '@/lib/i18n';
import {
  accentUnderlineStyle,
  dotSize,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  spacing,
  useTheme,
} from '@/lib/theme';
import type { MealType, Recipe } from '@/lib/types';
import { formatDateLocal, toBcp47 } from '@/lib/utils/dateFormatter';

export type SelectMealMode = 'library' | 'extras' | 'random' | 'quick' | 'copy';

interface SelectMealModalProps {
  visible: boolean;
  onClose: () => void;
  date: string;
  mealType: string;
  mode: SelectMealMode;
  initialText?: string;
}

export const SelectMealModal = ({
  visible,
  onClose,
  date,
  mealType,
  mode,
  initialText = '',
}: SelectMealModalProps) => {
  const { t } = useTranslation();

  const title: Record<SelectMealMode, string> = {
    quick: t('selectRecipe.quick.title'),
    library: t('selectRecipe.tabs.library').replace(/^\S+\s*/, ''),
    extras: t('mealPlan.extras.selectTitle'),
    random: t('selectRecipe.random.howAbout'),
    copy: t('selectRecipe.tabs.copy').replace(/^\S+\s*/, ''),
  };

  const isListMode = mode === 'library' || mode === 'extras';

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title={title[mode]}>
      {visible && (
        <>
          {mode === 'quick' && (
            <QuickContent
              date={date}
              mealType={mealType}
              initialText={initialText}
              onClose={onClose}
            />
          )}
          {isListMode && (
            <LibraryContent
              date={date}
              mealType={mealType}
              mode={mode}
              onClose={onClose}
            />
          )}
          {mode === 'random' && (
            <RandomContent
              date={date}
              mealType={mealType as MealType}
              onClose={onClose}
            />
          )}
          {mode === 'copy' && (
            <CopyContent date={date} mealType={mealType} onClose={onClose} />
          )}
        </>
      )}
    </BottomSheetModal>
  );
};

/* ── Quick (free-text) ──────────────────────────────────────────────── */

const QuickContent = ({
  date,
  mealType,
  initialText,
  onClose,
}: {
  date: string;
  mealType: string;
  initialText: string;
  onClose: () => void;
}) => {
  const {
    colors,
    fonts,
    borderRadius,
    visibility,
    styles: themeStyles,
  } = useTheme();
  const { t } = useTranslation();
  const setMeal = useSetMeal();
  const removeMeal = useRemoveMeal();

  const [customText, setCustomText] = useState(initialText);

  useEffect(() => {
    setCustomText(initialText);
  }, [initialText]);

  const handleSubmit = async () => {
    if (!customText.trim()) return;
    try {
      await setMeal.mutateAsync({
        date,
        mealType,
        customText: customText.trim(),
      });
      setCustomText('');
      onClose();
    } catch {
      showNotification(t('common.error'), t('selectRecipe.failedToSetMeal'));
    }
  };

  const handleRemoveMeal = async () => {
    try {
      await removeMeal.mutateAsync({ date, mealType });
      onClose();
    } catch {
      showNotification(t('common.error'), t('selectRecipe.failedToRemoveMeal'));
    }
  };

  return (
    <>
      <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
        {visibility.showSectionHeaderIcon && (
          <IconCircle
            size="xl"
            bg={colors.ai.light}
            style={{ marginBottom: spacing.md }}
          >
            <Ionicons
              name="create-outline"
              size={28}
              color={colors.ai.primary}
            />
          </IconCircle>
        )}
        {visibility.showSectionHeaderIcon && (
          <View style={{ ...accentUnderlineStyle, marginTop: spacing.sm }} />
        )}
        <Text
          style={{
            fontSize: fontSize[visibility.showSectionHeaderIcon ? 'lg' : 'md'],
            fontFamily: fonts.body,
            color: colors.content.tertiary,
            marginTop: spacing.sm,
            letterSpacing: letterSpacing.normal,
          }}
        >
          {t('selectRecipe.quick.placeholder')}
        </Text>
      </View>

      <TextInput
        style={{
          ...themeStyles.inputStyle,
          borderWidth: 1,
          borderColor: colors.input.border,
          fontFamily: fonts.body,
          paddingVertical: spacing.lg,
          marginBottom: spacing.lg,
        }}
        placeholder={t('selectRecipe.quickPlaceholder')}
        placeholderTextColor={colors.input.placeholder}
        value={customText}
        onChangeText={setCustomText}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      <Button
        variant="primary"
        onPress={handleSubmit}
        disabled={!customText.trim() || setMeal.isPending}
        label={t('selectRecipe.quick.addButton')}
      />

      <Button
        variant="text"
        tone="warning"
        onPress={handleRemoveMeal}
        disabled={removeMeal.isPending}
        icon="trash-outline"
        iconSize={18}
        label={t('selectRecipe.clearMeal')}
        style={{
          justifyContent: 'center',
          paddingVertical: spacing.md,
          borderRadius: borderRadius.sm,
          marginTop: spacing.xl,
        }}
      />
    </>
  );
};

/* ── Library / Extras (searchable recipe list) ──────────────────────── */

const LibraryContent = ({
  date,
  mealType,
  mode,
  onClose,
}: {
  date: string;
  mealType: string;
  mode: 'library' | 'extras';
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const { recipes } = useAllRecipes();
  const { data: mealPlan } = useMealPlan();
  const setMeal = useSetMeal();
  const updateExtras = useUpdateExtras();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const filteredRecipes = useMemo(() => {
    if (searchQuery === '') return recipes;
    return recipes.filter((recipe) =>
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [recipes, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / PAGE_SIZE));
  const pagedRecipes = filteredRecipes.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  // Reset page when search changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset page on search change
  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  const handleSelectRecipe = async (recipeId: string) => {
    try {
      await setMeal.mutateAsync({ date, mealType, recipeId });
      setSearchQuery('');
      onClose();
    } catch {
      showNotification(t('common.error'), t('selectRecipe.failedToSetMeal'));
    }
  };

  const handleAddToExtras = async (recipeId: string) => {
    try {
      const currentExtras = mealPlan?.extras || [];
      if (currentExtras.includes(recipeId)) {
        showNotification(
          t('mealPlan.extras.alreadyAdded'),
          t('mealPlan.extras.alreadyAddedMessage'),
        );
        return;
      }
      await updateExtras.mutateAsync({ extras: [...currentExtras, recipeId] });
      setSearchQuery('');
      onClose();
    } catch {
      showNotification(t('common.error'), t('mealPlan.extras.failedToAdd'));
    }
  };

  const onRecipePress = (recipeId: string) => {
    if (mode === 'extras') {
      handleAddToExtras(recipeId);
    } else {
      handleSelectRecipe(recipeId);
    }
  };

  return (
    <>
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder={t('selectRecipe.searchPlaceholder')}
        t={t}
      />

      {filteredRecipes.length > 0 ? (
        <View style={{ paddingBottom: spacing.xl }}>
          {pagedRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              compact
              onPress={() => onRecipePress(recipe.id)}
            />
          ))}
          {totalPages > 1 && (
            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPrevious={() => setPage((p) => p - 1)}
              onNext={() => setPage((p) => p + 1)}
            />
          )}
        </View>
      ) : (
        <EmptyState
          icon={searchQuery ? 'search' : 'book-outline'}
          title={
            searchQuery
              ? t('selectRecipe.empty.noMatches')
              : t('selectRecipe.empty.noRecipes')
          }
          subtitle={
            searchQuery
              ? t('selectRecipe.empty.tryDifferent')
              : t('selectRecipe.empty.addRecipesFirst')
          }
        />
      )}
    </>
  );
};

/* ── Pagination controls ────────────────────────────────────────────── */

const PaginationControls = ({
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) => {
  const { colors, fonts, borderRadius } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.lg,
        gap: spacing.md,
      }}
    >
      <Button
        variant="text"
        onPress={onPrevious}
        disabled={page === 0}
        icon="chevron-back"
        label={t('common.previous')}
        style={{ flex: 1 }}
      />
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing['sm-md'],
          backgroundColor: colors.button.primarySubtle,
          borderRadius: borderRadius['md-lg'],
        }}
      >
        <Text
          style={{
            fontSize: fontSize.md,
            fontFamily: fonts.bodySemibold,
            color: colors.content.heading,
            textAlign: 'center',
          }}
        >
          {t('common.pageOf', {
            current: page + 1,
            total: totalPages,
          })}
        </Text>
      </View>
      <Button
        variant="text"
        onPress={onNext}
        disabled={page >= totalPages - 1}
        icon="chevron-forward"
        label={t('common.next')}
        style={{ flex: 1 }}
      />
    </View>
  );
};

/* ── Random recipe suggestion ───────────────────────────────────────── */

const MEAL_TYPE_TO_LABEL: Record<MealType, string[]> = {
  breakfast: ['breakfast'],
  lunch: ['meal', 'grill'],
  dinner: ['meal', 'grill'],
  snack: ['dessert', 'drink'],
};

const RandomContent = ({
  date,
  mealType,
  onClose,
}: {
  date: string;
  mealType: MealType;
  onClose: () => void;
}) => {
  const { colors, fonts, borderRadius, visibility } = useTheme();
  const { t } = useTranslation();
  const { recipes } = useAllRecipes();
  const setMeal = useSetMeal();

  const randomIdRef = useRef<string | null>(null);
  const [shuffleCount, setShuffleCount] = useState(0);

  const MEAL_TYPE_LABELS: Record<MealType, string> = useMemo(
    () => ({
      breakfast: t('selectRecipe.mealTypeLabels.breakfast'),
      lunch: t('selectRecipe.mealTypeLabels.lunch'),
      dinner: t('selectRecipe.mealTypeLabels.dinner'),
      snack: t('selectRecipe.mealTypeLabels.snack'),
    }),
    [t],
  );

  const mealTypeRecipes = useMemo(() => {
    if (!mealType) return recipes;
    const allowedLabels = MEAL_TYPE_TO_LABEL[mealType] || ['meal'];
    return recipes.filter((recipe) => {
      if (recipe.meal_label) return allowedLabels.includes(recipe.meal_label);
      return mealType === 'lunch' || mealType === 'dinner';
    });
  }, [recipes, mealType]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: shuffleCount triggers re-pick intentionally
  const randomRecipe = useMemo(() => {
    if (mealTypeRecipes.length === 0) return null;
    const existing = mealTypeRecipes.find((r) => r.id === randomIdRef.current);
    if (existing) return existing;
    const picked =
      mealTypeRecipes[Math.floor(Math.random() * mealTypeRecipes.length)];
    randomIdRef.current = picked.id;
    return picked;
  }, [mealTypeRecipes, shuffleCount]);

  const shuffleRandom = useCallback(() => {
    if (mealTypeRecipes.length <= 1) return;
    let picked: Recipe;
    do {
      picked =
        mealTypeRecipes[Math.floor(Math.random() * mealTypeRecipes.length)];
    } while (picked.id === randomIdRef.current && mealTypeRecipes.length > 1);
    randomIdRef.current = picked.id;
    setShuffleCount((c) => c + 1);
  }, [mealTypeRecipes]);

  const handleSelectRecipe = async (recipeId: string) => {
    try {
      await setMeal.mutateAsync({ date, mealType, recipeId });
      onClose();
    } catch {
      showNotification(t('common.error'), t('selectRecipe.failedToSetMeal'));
    }
  };

  const mealLabel = MEAL_TYPE_LABELS[mealType]?.toLowerCase() || '';

  if (!randomRecipe) {
    return (
      <EmptyState
        icon="dice-outline"
        title={t('selectRecipe.random.noRecipes', { mealType: mealLabel })}
        subtitle={t('selectRecipe.random.addRecipesHint', {
          mealType: mealLabel,
        })}
        style={{ paddingVertical: spacing['4xl'] }}
      />
    );
  }

  return (
    <>
      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        {visibility.showSectionHeaderIcon && (
          <>
            <IconCircle
              size="xl"
              bg={colors.ai.light}
              style={{ marginBottom: spacing.md }}
            >
              <Ionicons name="dice" size={32} color={colors.ai.primary} />
            </IconCircle>
            <View style={{ ...accentUnderlineStyle, marginTop: spacing.sm }} />
          </>
        )}
        <Text
          style={{
            fontSize: fontSize[visibility.showSectionHeaderIcon ? 'lg' : 'md'],
            fontFamily: fonts.body,
            color: colors.content.tertiary,
            marginTop: spacing.xs,
          }}
        >
          {t('selectRecipe.random.matchCount', {
            count: mealTypeRecipes.length,
          })}{' '}
          {mealLabel}
        </Text>
      </View>

      <RandomRecipeCard
        recipe={randomRecipe}
        onSelect={handleSelectRecipe}
        t={t}
      />

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.md,
          marginTop: spacing.xl,
        }}
      >
        <View style={{ flex: 1 }}>
          <Button
            variant="primary"
            onPress={() => handleSelectRecipe(randomRecipe.id)}
            disabled={setMeal.isPending}
            icon="checkmark-circle"
            label={t('selectRecipe.random.addToPlan')}
          />
        </View>
        <Button
          variant="text"
          tone="alt"
          onPress={shuffleRandom}
          disabled={setMeal.isPending}
          icon="shuffle"
          iconSize={20}
          label={t('selectRecipe.random.shuffle')}
          style={{
            flex: 1,
            justifyContent: 'center',
            paddingVertical: spacing.md,
            borderRadius: borderRadius.sm,
          }}
        />
      </View>
    </>
  );
};

/* ── Random recipe card sub-component ───────────────────────────────── */

interface RandomRecipeCardProps {
  recipe: Recipe;
  onSelect: (id: string) => void;
  t: (key: string, opts?: Record<string, string | number>) => string;
}

const RandomRecipeCard = ({ recipe, onSelect, t }: RandomRecipeCardProps) => {
  const { colors, fonts, borderRadius, shadows, chrome } = useTheme();

  if (chrome === 'flat') {
    return (
      <Pressable
        onPress={() => onSelect(recipe.id)}
        style={({ pressed }) => ({
          backgroundColor: colors.mealPlan.slotBg,
          borderRadius: borderRadius.sm,
          overflow: 'hidden',
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
              fontSize: fontSize['2xl'],
              fontFamily: fonts.bodySemibold,
              color: colors.primary,
              marginBottom: spacing.sm,
            }}
          >
            {recipe.title}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {recipe.total_time && (
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontFamily: fonts.body,
                  color: colors.content.tertiary,
                }}
              >
                {t('selectRecipe.random.time', { count: recipe.total_time })}
              </Text>
            )}
            {recipe.servings && (
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontFamily: fonts.body,
                  color: colors.content.tertiary,
                }}
              >
                {'\u263B'}{' '}
                {t('selectRecipe.random.servings', { count: recipe.servings })}
              </Text>
            )}
          </View>
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <Text
              style={{
                fontSize: fontSize.base,
                fontFamily: fonts.body,
                color: colors.content.subtitle,
                lineHeight: lineHeight.sm,
                marginTop: spacing.sm,
              }}
              numberOfLines={2}
            >
              {recipe.ingredients.slice(0, 5).join(' \u2022 ')}
              {recipe.ingredients.length > 5 ? ' ...' : ''}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
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
            fontWeight: fontWeight.bold,
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
              <Ionicons
                name="time-outline"
                size={16}
                color={colors.gray[500]}
              />
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
                  fontWeight: fontWeight.semibold,
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
                fontWeight: fontWeight.semibold,
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
                lineHeight: lineHeight.sm,
              }}
              numberOfLines={2}
            >
              {recipe.ingredients.slice(0, 5).join(' \u2022 ')}
              {recipe.ingredients.length > 5 ? ' ...' : ''}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

/* ── Copy from another day/week ─────────────────────────────────────── */

const CopyContent = ({
  date,
  mealType,
  onClose,
}: {
  date: string;
  mealType: string;
  onClose: () => void;
}) => {
  const { colors, fonts, borderRadius, shadows, visibility } = useTheme();
  const { t, language } = useTranslation();
  const bcp47 = toBcp47(language);
  const { recipes } = useAllRecipes();
  const { data: mealPlan } = useMealPlan();
  const setMeal = useSetMeal();
  const removeMeal = useRemoveMeal();

  const [copyWeekOffset, setCopyWeekOffset] = useState(0);

  const MEAL_TYPE_LABELS: Record<MealType, string> = useMemo(
    () => ({
      breakfast: t('selectRecipe.mealTypeLabels.breakfast'),
      lunch: t('selectRecipe.mealTypeLabels.lunch'),
      dinner: t('selectRecipe.mealTypeLabels.dinner'),
      snack: t('selectRecipe.mealTypeLabels.snack'),
    }),
    [t],
  );

  const targetWeekDates = useMemo(() => {
    if (!date)
      return {
        start: '',
        end: '',
        mondayDate: new Date(),
        sundayDate: new Date(),
      };
    const targetDate = new Date(`${date}T00:00:00`);
    const targetDay = targetDate.getDay();
    const daysSinceMonday = (targetDay + 6) % 7;
    const monday = new Date(targetDate);
    monday.setDate(targetDate.getDate() - daysSinceMonday + copyWeekOffset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: formatDateLocal(monday),
      end: formatDateLocal(sunday),
      mondayDate: monday,
      sundayDate: sunday,
    };
  }, [date, copyWeekOffset]);

  const existingMeals = useMemo(() => {
    if (!mealPlan?.meals) return [];
    const recipeMap = new Map(recipes.map((r) => [r.id, r]));
    const meals: {
      key: string;
      date: string;
      mealType: string;
      recipe?: Recipe;
      customText?: string;
    }[] = [];

    for (const [key, value] of Object.entries(mealPlan.meals)) {
      const [dateStr, type] = key.split('_');
      if (key === `${date}_${mealType}`) continue;
      if (dateStr < targetWeekDates.start || dateStr > targetWeekDates.end)
        continue;

      if (value.startsWith('custom:')) {
        meals.push({
          key,
          date: dateStr,
          mealType: type,
          customText: value.slice(7),
        });
      } else {
        const recipe = recipeMap.get(value);
        if (recipe) meals.push({ key, date: dateStr, mealType: type, recipe });
      }
    }

    return meals.sort((a, b) => a.date.localeCompare(b.date));
  }, [mealPlan, recipes, date, mealType, targetWeekDates]);

  const formatMealDate = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString(bcp47, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCopyMeal = async (
    recipeId?: string,
    customTextValue?: string,
  ) => {
    try {
      if (recipeId) {
        await setMeal.mutateAsync({ date, mealType, recipeId });
      } else if (customTextValue) {
        await setMeal.mutateAsync({
          date,
          mealType,
          customText: customTextValue,
        });
      }
      onClose();
    } catch {
      showNotification(t('common.error'), t('selectRecipe.failedToCopyMeal'));
    }
  };

  const handleRemoveMeal = async () => {
    try {
      await removeMeal.mutateAsync({ date, mealType });
      onClose();
    } catch {
      showNotification(t('common.error'), t('selectRecipe.failedToRemoveMeal'));
    }
  };

  return (
    <>
      {/* Header */}
      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        {visibility.showSectionHeaderIcon && (
          <>
            <IconCircle
              size="lg"
              bg={colors.ai.light}
              style={{ marginBottom: spacing.sm }}
            >
              <Ionicons name="copy" size={24} color={colors.ai.primary} />
            </IconCircle>
            <View style={{ ...accentUnderlineStyle, marginTop: spacing.sm }} />
          </>
        )}
        <Text
          style={{
            fontSize: fontSize['2xl'],
            fontFamily: fonts.bodySemibold,
            color: colors.content.heading,
            textAlign: 'center',
            letterSpacing: letterSpacing.snug,
            marginTop: spacing.xs,
          }}
        >
          {t('selectRecipe.copy.title')}
        </Text>
      </View>

      {/* Week selector */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
          gap: spacing.sm,
        }}
      >
        <IconButton
          tone="alt"
          onPress={() => setCopyWeekOffset((prev) => prev - 1)}
          icon="chevron-back"
        />
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            backgroundColor: colors.card.bg,
            borderRadius: borderRadius.sm,
          }}
        >
          <Text
            style={{
              fontSize: fontSize.md,
              fontFamily: fonts.bodySemibold,
              color: colors.card.textPrimary,
              textAlign: 'center',
            }}
          >
            {targetWeekDates.mondayDate.toLocaleDateString(bcp47, {
              month: 'short',
              day: 'numeric',
            })}{' '}
            -{' '}
            {targetWeekDates.sundayDate.toLocaleDateString(bcp47, {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        <IconButton
          tone="alt"
          onPress={() => setCopyWeekOffset((prev) => prev + 1)}
          icon="chevron-forward"
        />
      </View>

      {/* Meal list */}
      {existingMeals.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={t('selectRecipe.copy.noMeals')}
          subtitle={t('selectRecipe.copy.planFirst')}
          style={{ paddingVertical: spacing['4xl'] }}
        />
      ) : (
        existingMeals.map((meal) => (
          <Pressable
            key={meal.key}
            onPress={() => handleCopyMeal(meal.recipe?.id, meal.customText)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: pressed ? colors.card.bgPressed : colors.card.bg,
              borderRadius: borderRadius.sm,
              padding: spacing.lg,
              marginBottom: spacing.sm,
              ...shadows.sm,
            })}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: fontSize.lg,
                  fontFamily: fonts.bodySemibold,
                  color: colors.card.textPrimary,
                }}
              >
                {meal.recipe?.title || meal.customText}
              </Text>
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontFamily: fonts.body,
                  color: colors.card.textSecondary,
                  marginTop: spacing.xs,
                }}
              >
                {formatMealDate(meal.date)} {'\u00B7'}{' '}
                {MEAL_TYPE_LABELS[meal.mealType as MealType] || meal.mealType}
              </Text>
            </View>
            {visibility.showSectionHeaderIcon ? (
              <IconCircle size="md" bg={colors.glass.light}>
                <Ionicons
                  name="copy-outline"
                  size={18}
                  color={colors.text.inverse}
                />
              </IconCircle>
            ) : (
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: fontSize.md,
                  color: colors.border,
                }}
              >
                {'\u25B6'}
              </Text>
            )}
          </Pressable>
        ))
      )}

      {/* Clear meal button */}
      <Button
        variant="text"
        tone="warning"
        onPress={handleRemoveMeal}
        disabled={removeMeal.isPending}
        icon="trash-outline"
        iconSize={18}
        label={t('selectRecipe.clearMeal')}
        style={{
          justifyContent: 'center',
          paddingVertical: spacing.md,
          borderRadius: borderRadius.sm,
          marginTop: spacing.lg,
        }}
      />
    </>
  );
};
