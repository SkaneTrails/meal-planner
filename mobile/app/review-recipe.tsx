/**
 * Review recipe screen - allows user to preview scraped recipe,
 * set diet/meal type, and choose between original and AI-enhanced versions.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { GradientBackground } from '@/components';
import {
  DIET_OPTIONS,
  MEAL_OPTIONS,
  PLACEHOLDER_BLURHASH,
  PLACEHOLDER_IMAGE,
} from '@/components/recipe-detail/recipe-detail-constants';
import { useCreateRecipe } from '@/lib/hooks/use-recipes';
import { useTranslation } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  letterSpacing,
  shadows,
  spacing,
} from '@/lib/theme';
import type { DietLabel, MealLabel, RecipeCreate, RecipePreview } from '@/lib/types';

type VersionTab = 'original' | 'enhanced';

export default function ReviewRecipeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ preview: string }>();
  const { t } = useTranslation();
  const createRecipe = useCreateRecipe();

  const preview: RecipePreview | null = useMemo(() => {
    if (!params.preview) return null;
    try {
      return JSON.parse(params.preview) as RecipePreview;
    } catch {
      return null;
    }
  }, [params.preview]);

  const hasEnhanced = preview?.enhanced !== null && preview?.enhanced !== undefined;
  const [selectedTab, setSelectedTab] = useState<VersionTab>(hasEnhanced ? 'enhanced' : 'original');
  const [dietLabel, setDietLabel] = useState<DietLabel | null>(null);
  const [mealLabel, setMealLabel] = useState<MealLabel | null>(null);

  if (!preview) {
    return (
      <GradientBackground style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text.inverse, fontSize: fontSize.xl }}>
          {t('common.error')}
        </Text>
      </GradientBackground>
    );
  }

  const selectedRecipe: RecipeCreate = selectedTab === 'enhanced' && preview.enhanced
    ? preview.enhanced
    : preview.original;

  const handleSave = async () => {
    const recipeToSave: RecipeCreate = {
      ...selectedRecipe,
      diet_label: dietLabel,
      meal_label: mealLabel,
    };

    try {
      const saved = await createRecipe.mutateAsync(recipeToSave);
      router.back();
      router.push(`/recipe/${saved.id}`);
    } catch (error) {
      // Error handling is done by mutation's onError or we can show toast
    }
  };

  return (
    <GradientBackground style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
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
          <View style={{ marginBottom: spacing.xl }}>
            <Text
              style={{
                fontSize: fontSize.lg,
                fontFamily: fontFamily.bodySemibold,
                color: colors.gray[500],
                marginBottom: spacing.sm,
                textTransform: 'uppercase',
                letterSpacing: letterSpacing.wide,
              }}
            >
              {t('reviewRecipe.version')}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: colors.glass.card,
                borderRadius: borderRadius.md,
                padding: spacing.xs,
                ...shadows.sm,
              }}
            >
              <Pressable
                onPress={() => setSelectedTab('original')}
                style={{
                  flex: 1,
                  paddingVertical: spacing.md,
                  borderRadius: borderRadius.sm,
                  backgroundColor: selectedTab === 'original' ? colors.primary : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: fontSize.lg,
                    fontFamily: fontFamily.bodyMedium,
                    color: selectedTab === 'original' ? colors.white : colors.text.inverse,
                  }}
                >
                  {t('reviewRecipe.original')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedTab('enhanced')}
                style={{
                  flex: 1,
                  paddingVertical: spacing.md,
                  borderRadius: borderRadius.sm,
                  backgroundColor: selectedTab === 'enhanced' ? colors.accent : 'transparent',
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: spacing.xs,
                }}
              >
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={selectedTab === 'enhanced' ? colors.white : colors.accent}
                />
                <Text
                  style={{
                    fontSize: fontSize.lg,
                    fontFamily: fontFamily.bodyMedium,
                    color: selectedTab === 'enhanced' ? colors.white : colors.text.inverse,
                  }}
                >
                  {t('reviewRecipe.enhanced')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* AI Changes Summary (when enhanced tab selected) */}
        {hasEnhanced && selectedTab === 'enhanced' && preview.changes_made.length > 0 && (
          <View
            style={{
              backgroundColor: colors.glass.card,
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              marginBottom: spacing.xl,
              ...shadows.sm,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
              <Ionicons name="sparkles" size={18} color={colors.accent} />
              <Text
                style={{
                  marginLeft: spacing.sm,
                  fontSize: fontSize.lg,
                  fontFamily: fontFamily.bodySemibold,
                  color: colors.text.inverse,
                }}
              >
                {t('reviewRecipe.aiImprovements')}
              </Text>
            </View>
            {preview.changes_made.map((change, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: spacing.sm,
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success}
                  style={{ marginRight: spacing.sm, marginTop: 2 }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: fontSize.md,
                    color: colors.text.inverse,
                    lineHeight: 20,
                  }}
                >
                  {change}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Diet Type Picker */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text
            style={{
              fontSize: fontSize.lg,
              fontFamily: fontFamily.bodySemibold,
              color: colors.gray[500],
              marginBottom: spacing.sm,
              textTransform: 'uppercase',
              letterSpacing: letterSpacing.wide,
            }}
          >
            {t('recipe.dietType')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {DIET_OPTIONS.map(({ value, labelKey, emoji }) => {
              const isSelected = dietLabel === value;
              return (
                <Pressable
                  key={labelKey}
                  onPress={() => setDietLabel(value)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isSelected ? colors.primary : pressed ? colors.bgMid : colors.glass.card,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.glass.border,
                  })}
                >
                  <Text style={{ marginRight: spacing.xs }}>{emoji}</Text>
                  <Text
                    style={{
                      fontSize: fontSize.lg,
                      fontFamily: fontFamily.bodyMedium,
                      color: isSelected ? colors.white : colors.text.inverse,
                    }}
                  >
                    {t(labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Meal Type Picker */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text
            style={{
              fontSize: fontSize.lg,
              fontFamily: fontFamily.bodySemibold,
              color: colors.gray[500],
              marginBottom: spacing.sm,
              textTransform: 'uppercase',
              letterSpacing: letterSpacing.wide,
            }}
          >
            {t('recipe.mealTypeLabel')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {MEAL_OPTIONS.map(({ value, labelKey }) => {
              const isSelected = mealLabel === value;
              return (
                <Pressable
                  key={labelKey}
                  onPress={() => setMealLabel(value)}
                  style={({ pressed }) => ({
                    backgroundColor: isSelected ? colors.primary : pressed ? colors.bgMid : colors.glass.card,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.glass.border,
                  })}
                >
                  <Text
                    style={{
                      fontSize: fontSize.lg,
                      fontFamily: fontFamily.bodyMedium,
                      color: isSelected ? colors.white : colors.text.inverse,
                    }}
                  >
                    {t(labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Recipe Preview (Ingredients + Instructions) */}
        <View
          style={{
            backgroundColor: colors.glass.card,
            borderRadius: borderRadius.md,
            padding: spacing.lg,
            marginBottom: spacing.xl,
            ...shadows.sm,
          }}
        >
          <Text
            style={{
              fontSize: fontSize.lg,
              fontFamily: fontFamily.bodySemibold,
              color: colors.text.inverse,
              marginBottom: spacing.md,
            }}
          >
            {t('recipe.ingredients')} ({(selectedRecipe.ingredients ?? []).length})
          </Text>
          {(selectedRecipe.ingredients ?? []).slice(0, 5).map((ingredient, index) => (
            <Text
              key={index}
              style={{
                fontSize: fontSize.md,
                color: colors.text.inverse,
                marginBottom: spacing.xs,
              }}
            >
              • {ingredient}
            </Text>
          ))}
          {(selectedRecipe.ingredients ?? []).length > 5 && (
            <Text style={{ fontSize: fontSize.md, color: colors.gray[500], fontStyle: 'italic' }}>
              +{(selectedRecipe.ingredients ?? []).length - 5} {t('common.more')}
            </Text>
          )}

          <View style={{ height: spacing.lg }} />

          <Text
            style={{
              fontSize: fontSize.lg,
              fontFamily: fontFamily.bodySemibold,
              color: colors.text.inverse,
              marginBottom: spacing.md,
            }}
          >
            {t('recipe.instructions')} ({(selectedRecipe.instructions ?? []).length} {t('reviewRecipe.steps')})
          </Text>
          {(selectedRecipe.instructions ?? []).slice(0, 3).map((instruction, index) => (
            <Text
              key={index}
              style={{
                fontSize: fontSize.md,
                color: colors.text.inverse,
                marginBottom: spacing.sm,
              }}
              numberOfLines={2}
            >
              {index + 1}. {instruction}
            </Text>
          ))}
          {(selectedRecipe.instructions ?? []).length > 3 && (
            <Text style={{ fontSize: fontSize.md, color: colors.gray[500], fontStyle: 'italic' }}>
              +{(selectedRecipe.instructions ?? []).length - 3} {t('common.more')}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: spacing.lg,
          backgroundColor: colors.glass.card,
          borderTopWidth: 1,
          borderTopColor: colors.glass.border,
        }}
      >
        <Pressable
          onPress={handleSave}
          disabled={createRecipe.isPending}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.md,
            alignItems: 'center',
            opacity: pressed || createRecipe.isPending ? 0.8 : 1,
            ...shadows.md,
          })}
        >
          {createRecipe.isPending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text
              style={{
                fontSize: fontSize.xl,
                fontFamily: fontFamily.bodySemibold,
                color: colors.white,
              }}
            >
              {t('reviewRecipe.saveRecipe')}
            </Text>
          )}
        </Pressable>
      </View>
    </GradientBackground>
  );
}
