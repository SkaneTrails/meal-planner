/**
 * Review recipe screen - allows user to preview scraped recipe,
 * set diet/meal type, and choose between original and AI-enhanced versions.
 */
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import {
  BottomActionBar,
  ChipPicker,
  FullScreenLoading,
  GradientBackground,
  PrimaryButton,
} from '@/components';
import {
  DIET_OPTIONS,
  MEAL_OPTIONS,
  PLACEHOLDER_BLURHASH,
  PLACEHOLDER_IMAGE,
} from '@/components/recipe-detail/recipe-detail-constants';
import { ReviewAiChanges } from '@/components/review-recipe/ReviewAiChanges';
import { ReviewRecipePreview } from '@/components/review-recipe/ReviewRecipePreview';
import { ReviewVersionToggle } from '@/components/review-recipe/ReviewVersionToggle';
import { showNotification } from '@/lib/alert';
import { useSavePreview } from '@/lib/hooks/use-recipes';
import { useTranslation } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  layout,
  spacing,
} from '@/lib/theme';
import type { DietLabel, MealLabel, RecipePreview } from '@/lib/types';

type VersionTab = 'original' | 'enhanced';

export default function ReviewRecipeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ preview: string }>();
  const { t } = useTranslation();
  const savePreview = useSavePreview();

  const preview: RecipePreview | null = useMemo(() => {
    if (!params.preview) return null;
    try {
      return JSON.parse(params.preview) as RecipePreview;
    } catch {
      return null;
    }
  }, [params.preview]);

  const hasEnhanced =
    preview?.enhanced !== null && preview?.enhanced !== undefined;
  const [selectedTab, setSelectedTab] = useState<VersionTab>(
    hasEnhanced ? 'enhanced' : 'original',
  );
  const [dietLabel, setDietLabel] = useState<DietLabel | null>(null);
  const [mealLabel, setMealLabel] = useState<MealLabel | null>(null);

  if (!preview) {
    return <FullScreenLoading title={t('common.error')} />;
  }

  const selectedRecipe =
    selectedTab === 'enhanced' && preview.enhanced
      ? preview.enhanced
      : preview.original;

  const handleSave = async () => {
    try {
      const saved = await savePreview.mutateAsync({
        version:
          selectedTab === 'enhanced' && preview.enhanced
            ? 'enhanced'
            : 'original',
        preview,
        diet_label: dietLabel,
        meal_label: mealLabel,
      });
      router.back();
      router.push(`/recipe/${saved.id}`);
    } catch {
      showNotification(t('common.error'), t('addRecipe.createFailed'));
    }
  };

  return (
    <GradientBackground style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: layout.tabBar.contentBottomPadding,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Recipe Image & Title */}
        <View style={{ marginBottom: spacing.xl }}>
          <Image
            source={preview.image_url || PLACEHOLDER_IMAGE}
            placeholder={PLACEHOLDER_BLURHASH}
            contentFit="cover"
            style={{
              width: '100%',
              height: 200,
              borderRadius: borderRadius.lg,
              marginBottom: spacing.md,
            }}
          />
          <Text
            style={{
              fontSize: fontSize['3xl'],
              fontFamily: fontFamily.display,
              color: colors.text.inverse,
              textAlign: 'center',
            }}
          >
            {selectedRecipe.title}
          </Text>
        </View>

        {/* Version Toggle (if enhanced available) */}
        {hasEnhanced && (
          <ReviewVersionToggle
            selectedTab={selectedTab}
            onSelectTab={setSelectedTab}
            t={t}
          />
        )}

        {/* AI Changes Summary (when enhanced tab selected) */}
        {hasEnhanced && selectedTab === 'enhanced' && (
          <ReviewAiChanges changes={preview.changes_made} t={t} />
        )}

        {/* Diet Type Picker */}
        <ChipPicker
          label={t('recipe.dietType')}
          options={DIET_OPTIONS}
          selected={dietLabel}
          onSelect={setDietLabel}
          t={t}
        />

        {/* Meal Type Picker */}
        <ChipPicker
          label={t('recipe.mealTypeLabel')}
          options={MEAL_OPTIONS}
          selected={mealLabel}
          onSelect={setMealLabel}
          t={t}
        />

        {/* Recipe Preview (Ingredients + Instructions) */}
        <ReviewRecipePreview recipe={selectedRecipe} t={t} />
      </ScrollView>

      {/* Save Button */}
      <BottomActionBar>
        <PrimaryButton
          onPress={handleSave}
          isPending={savePreview.isPending}
          label={t('reviewRecipe.saveRecipe')}
          color={colors.primary}
        />
      </BottomActionBar>
    </GradientBackground>
  );
}
