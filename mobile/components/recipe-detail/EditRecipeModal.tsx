import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BottomSheetModal, ChipPicker } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { fontSize, letterSpacing, spacing, useTheme } from '@/lib/theme';
import type {
  DietLabel,
  Household,
  MealLabel,
  Recipe,
  RecipeVisibility,
} from '@/lib/types';
import { HouseholdTransfer } from './HouseholdTransfer';
import {
  getDietOptions,
  MEAL_OPTIONS,
  VISIBILITY_OPTIONS,
} from './recipe-detail-constants';
import { TagEditor } from './TagEditor';

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
  onDelete: () => void;
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
  onDelete,
}: EditRecipeModalProps) => {
  const { colors, fonts, borderRadius } = useTheme();
  const [editDietLabel, setEditDietLabel] = useState<DietLabel | null>(
    recipe.diet_label,
  );
  const [editMealLabel, setEditMealLabel] = useState<MealLabel | null>(
    recipe.meal_label,
  );
  const [editPrepTime, setEditPrepTime] = useState(
    recipe.prep_time?.toString() || '',
  );
  const [editCookTime, setEditCookTime] = useState(
    recipe.cook_time?.toString() || '',
  );
  const [editServings, setEditServings] = useState(
    recipe.servings?.toString() || '',
  );
  const [editTags, setEditTags] = useState(recipe.tags.join(', '));
  const [editVisibility, setEditVisibility] = useState<RecipeVisibility>(
    recipe.visibility || 'household',
  );
  const editHouseholdId = recipe.household_id || null;
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

  const handleTransfer = (targetHouseholdId: string) => {
    onTransferRecipe(targetHouseholdId);
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t('recipe.editRecipe')}
      headerRight={
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable
            onPress={onClose}
            style={{
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
            }}
          >
            <Text
              style={{
                fontSize: fontSize.xl,
                fontFamily: fonts.body,
                color: colors.gray[500],
              }}
            >
              {t('common.cancel')}
            </Text>
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
              <Text
                style={{
                  fontSize: fontSize.xl,
                  fontFamily: fonts.bodySemibold,
                  color: colors.white,
                }}
              >
                {t('common.save')}
              </Text>
            )}
          </Pressable>
        </View>
      }
    >
      {/* Diet Type */}
      <ChipPicker
        label={t('recipe.dietType')}
        options={getDietOptions(colors)}
        selected={editDietLabel}
        onSelect={setEditDietLabel}
        t={t}
        variant="solid"
      />

      {/* Meal Type */}
      <ChipPicker
        label={t('recipe.mealTypeLabel')}
        options={MEAL_OPTIONS}
        selected={editMealLabel}
        onSelect={setEditMealLabel}
        t={t}
        variant="solid"
      />

      {/* Visibility — hidden for copies (always private) */}
      {!recipe.copied_from && (
        <View style={{ marginBottom: spacing.xl }}>
          <Text
            style={{
              fontSize: fontSize.lg,
              fontFamily: fonts.bodySemibold,
              color: colors.gray[500],
              marginBottom: spacing.sm,
              textTransform: 'uppercase',
              letterSpacing: letterSpacing.wide,
            }}
          >
            {t('recipe.visibilityLabel')}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {VISIBILITY_OPTIONS.map(({ value, labelKey, icon, descKey }) => {
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
                    backgroundColor: isSelected
                      ? colors.primary
                      : pressed
                        ? colors.bgMid
                        : colors.gray[50],
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.md,
                    borderRadius: borderRadius.md,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.bgDark,
                  })}
                >
                  <Ionicons
                    name={icon}
                    size={28}
                    color={isSelected ? colors.white : colors.content.icon}
                    style={{ marginBottom: spacing.xs }}
                  />
                  <Text
                    style={{
                      fontSize: fontSize.lg,
                      fontFamily: fonts.bodySemibold,
                      color: isSelected ? colors.white : colors.text.inverse,
                    }}
                  >
                    {translatedLabel}
                  </Text>
                  <Text
                    style={{
                      fontSize: fontSize.sm,
                      fontFamily: fonts.body,
                      color: isSelected ? colors.bgDark : colors.gray[400],
                      marginTop: spacing['2xs'],
                    }}
                  >
                    {translatedDesc}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Info message for copies — visibility is locked */}
      {recipe.copied_from && (
        <View style={{ marginBottom: spacing.xl }}>
          <Text
            style={{
              fontSize: fontSize.lg,
              fontFamily: fonts.bodySemibold,
              color: colors.gray[500],
              marginBottom: spacing.sm,
              textTransform: 'uppercase',
              letterSpacing: letterSpacing.wide,
            }}
          >
            {t('recipe.visibilityLabel')}
          </Text>
          <Text
            style={{
              fontSize: fontSize.base,
              fontFamily: fonts.body,
              color: colors.gray[400],
            }}
          >
            {t('recipe.copiedRecipeVisibility')}
          </Text>
        </View>
      )}

      {/* Household Transfer (Superuser only) */}
      {isSuperuser && households && households.length > 0 && (
        <HouseholdTransfer
          households={households}
          editHouseholdId={editHouseholdId}
          isTransferring={false}
          t={t}
          onTransfer={handleTransfer}
        />
      )}

      {/* Time & Servings */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text
          style={{
            fontSize: fontSize.lg,
            fontFamily: fonts.bodySemibold,
            color: colors.gray[500],
            marginBottom: spacing.sm,
            textTransform: 'uppercase',
            letterSpacing: letterSpacing.wide,
          }}
        >
          {t('recipe.timeAndServings')}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: fontSize.base,
                fontFamily: fonts.body,
                color: colors.gray[400],
                marginBottom: spacing.xs,
              }}
            >
              {t('labels.time.prepMin')}
            </Text>
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
                fontFamily: fonts.body,
                color: colors.text.inverse,
                textAlign: 'center',
                borderWidth: 1,
                borderColor: colors.bgDark,
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: fontSize.base,
                fontFamily: fonts.body,
                color: colors.gray[400],
                marginBottom: spacing.xs,
              }}
            >
              {t('labels.time.cookMin')}
            </Text>
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
                fontFamily: fonts.body,
                color: colors.text.inverse,
                textAlign: 'center',
                borderWidth: 1,
                borderColor: colors.bgDark,
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: fontSize.base,
                fontFamily: fonts.body,
                color: colors.gray[400],
                marginBottom: spacing.xs,
              }}
            >
              {t('labels.time.servings')}
            </Text>
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
                fontFamily: fonts.body,
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

      {/* Delete Recipe */}
      <View
        style={{
          marginTop: spacing.xl,
          paddingTop: spacing.xl,
          borderTopWidth: 1,
          borderTopColor: colors.bgDark,
        }}
      >
        <Pressable
          onPress={onDelete}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? colors.errorBg : 'transparent',
            paddingVertical: spacing.md,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.error,
          })}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color={colors.error}
            style={{ marginRight: spacing.sm }}
          />
          <Text
            style={{
              fontSize: fontSize.lg,
              fontFamily: fonts.bodySemibold,
              color: colors.error,
            }}
          >
            {t('recipe.deleteRecipe')}
          </Text>
        </Pressable>
      </View>

      <View style={{ height: spacing['4xl'] }} />
    </BottomSheetModal>
  );
};
