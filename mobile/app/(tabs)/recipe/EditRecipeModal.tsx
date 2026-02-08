import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { borderRadius, colors, spacing, fontFamily, fontSize, letterSpacing } from '@/lib/theme';
import { BottomSheetModal } from '@/components';
import { DIET_OPTIONS, MEAL_OPTIONS, VISIBILITY_OPTIONS } from './recipe-detail-constants';
import { TagEditor } from './TagEditor';
import { HouseholdTransfer } from './HouseholdTransfer';
import type { DietLabel, MealLabel, RecipeVisibility, Recipe, Household } from '@/lib/types';
import type { TFunction } from '@/lib/i18n';

interface EditRecipeModalProps {
  visible: boolean;
  recipe: Recipe;
  isSuperuser: boolean;
  households: Household[] | undefined;
  t: TFunction;
  onClose: () => void;
  onSave: (updates: {
    dietLabel: DietLabel | null;
    mealLabel: MealLabel | null;
    prepTime: string;
    cookTime: string;
    servings: string;
    tags: string;
    visibility: RecipeVisibility;
  }) => Promise<void>;
  onTransferRecipe: (targetHouseholdId: string) => Promise<void>;
}

export const EditRecipeModal = ({
  visible,
  recipe,
  isSuperuser,
  households,
  t,
  onClose,
  onSave,
  onTransferRecipe,
}: EditRecipeModalProps) => {
  const [editDietLabel, setEditDietLabel] = useState<DietLabel | null>(recipe.diet_label);
  const [editMealLabel, setEditMealLabel] = useState<MealLabel | null>(recipe.meal_label);
  const [editPrepTime, setEditPrepTime] = useState(recipe.prep_time?.toString() || '');
  const [editCookTime, setEditCookTime] = useState(recipe.cook_time?.toString() || '');
  const [editServings, setEditServings] = useState(recipe.servings?.toString() || '');
  const [editTags, setEditTags] = useState(recipe.tags.join(', '));
  const [editVisibility, setEditVisibility] = useState<RecipeVisibility>(recipe.visibility || 'household');
  const [editHouseholdId, setEditHouseholdId] = useState<string | null>(recipe.household_id || null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleSave = async () => {
    setIsSavingEdit(true);
    try {
      await onSave({
        dietLabel: editDietLabel,
        mealLabel: editMealLabel,
        prepTime: editPrepTime,
        cookTime: editCookTime,
        servings: editServings,
        tags: editTags,
        visibility: editVisibility,
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleTransfer = async (targetHouseholdId: string) => {
    setIsTransferring(true);
    try {
      await onTransferRecipe(targetHouseholdId);
      setEditHouseholdId(targetHouseholdId);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t('recipe.editRecipe')}
      maxHeight="90%"
      showCloseButton={false}
      headerRight={
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable
            onPress={onClose}
            style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}
          >
            <Text style={{ fontSize: fontSize.xl, fontFamily: fontFamily.body, color: colors.gray[500] }}>{t('common.cancel')}</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={isSavingEdit}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.primaryDark : colors.primary,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.sm,
              opacity: isSavingEdit ? 0.6 : 1,
            })}
          >
            {isSavingEdit ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={{ fontSize: fontSize.xl, fontFamily: fontFamily.bodySemibold, color: colors.white }}>{t('common.save')}</Text>
            )}
          </Pressable>
        </View>
      }
    >
      {/* Diet Type */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold, color: colors.gray[500], marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
          {t('recipe.dietType')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {DIET_OPTIONS.map(({ value, labelKey, emoji }) => {
            const isSelected = editDietLabel === value;
            const translatedLabel = t(labelKey);
            return (
              <Pressable
                key={labelKey}
                onPress={() => setEditDietLabel(value)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isSelected ? colors.primary : pressed ? colors.bgMid : colors.gray[50],
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : colors.bgDark,
                })}
              >
                <Text style={{ marginRight: spacing.xs }}>{emoji}</Text>
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodyMedium, color: isSelected ? colors.white : colors.text.inverse }}>
                  {translatedLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Meal Type */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold, color: colors.gray[500], marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
          {t('recipe.mealTypeLabel')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {MEAL_OPTIONS.map(({ value, labelKey }) => {
            const isSelected = editMealLabel === value;
            const translatedLabel = t(labelKey);
            return (
              <Pressable
                key={labelKey}
                onPress={() => setEditMealLabel(value)}
                style={({ pressed }) => ({
                  backgroundColor: isSelected ? colors.primary : pressed ? colors.bgMid : colors.gray[50],
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : colors.bgDark,
                })}
              >
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodyMedium, color: isSelected ? colors.white : colors.text.inverse }}>
                  {translatedLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Visibility */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold, color: colors.gray[500], marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
          {t('recipe.visibilityLabel')}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {VISIBILITY_OPTIONS.map(({ value, labelKey, emoji, descKey }) => {
            const isSelected = editVisibility === value;
            const translatedLabel = t(labelKey);
            const translatedDesc = t(descKey);
            return (
              <Pressable
                key={value}
                onPress={() => setEditVisibility(value)}
                style={({ pressed }) => ({
                  flex: 1,
                  alignItems: 'center',
                  backgroundColor: isSelected ? colors.primary : pressed ? colors.bgMid : colors.gray[50],
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  borderRadius: borderRadius.md,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : colors.bgDark,
                })}
              >
                <Text style={{ fontSize: fontSize['3xl'], marginBottom: spacing.xs }}>{emoji}</Text>
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold, color: isSelected ? colors.white : colors.text.inverse }}>
                  {translatedLabel}
                </Text>
                <Text style={{ fontSize: fontSize.sm, fontFamily: fontFamily.body, color: isSelected ? colors.bgDark : colors.gray[400], marginTop: 2 }}>
                  {translatedDesc}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Household Transfer (Superuser only) */}
      {isSuperuser && households && households.length > 0 && (
        <HouseholdTransfer
          households={households}
          editHouseholdId={editHouseholdId}
          isTransferring={isTransferring}
          t={t}
          onTransfer={handleTransfer}
        />
      )}

      {/* Time & Servings */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold, color: colors.gray[500], marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
          {t('recipe.timeAndServings')}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.base, fontFamily: fontFamily.body, color: colors.gray[400], marginBottom: spacing.xs }}>{t('labels.time.prepMin')}</Text>
            <TextInput
              value={editPrepTime}
              onChangeText={setEditPrepTime}
              placeholder="—"
              placeholderTextColor={colors.gray[300]}
              keyboardType="number-pad"
              style={{
                backgroundColor: colors.gray[50],
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.md,
                fontSize: fontSize['2xl'],
                fontFamily: fontFamily.body,
                color: colors.text.inverse,
                textAlign: 'center',
                borderWidth: 1,
                borderColor: colors.bgDark,
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.base, fontFamily: fontFamily.body, color: colors.gray[400], marginBottom: spacing.xs }}>{t('labels.time.cookMin')}</Text>
            <TextInput
              value={editCookTime}
              onChangeText={setEditCookTime}
              placeholder="—"
              placeholderTextColor={colors.gray[300]}
              keyboardType="number-pad"
              style={{
                backgroundColor: colors.gray[50],
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.md,
                fontSize: fontSize['2xl'],
                fontFamily: fontFamily.body,
                color: colors.text.inverse,
                textAlign: 'center',
                borderWidth: 1,
                borderColor: colors.bgDark,
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.base, fontFamily: fontFamily.body, color: colors.gray[400], marginBottom: spacing.xs }}>{t('labels.time.servings')}</Text>
            <TextInput
              value={editServings}
              onChangeText={setEditServings}
              placeholder="—"
              placeholderTextColor={colors.gray[300]}
              keyboardType="number-pad"
              style={{
                backgroundColor: colors.gray[50],
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.md,
                fontSize: fontSize['2xl'],
                fontFamily: fontFamily.body,
                color: colors.text.inverse,
                textAlign: 'center',
                borderWidth: 1,
                borderColor: colors.bgDark,
              }}
            />
          </View>
        </View>
      </View>

      <TagEditor editTags={editTags} setEditTags={setEditTags} t={t} />

      <View style={{ height: 40 }} />
    </BottomSheetModal>
  );
};
