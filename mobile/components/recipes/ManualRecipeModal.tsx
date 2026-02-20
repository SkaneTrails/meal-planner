/**
 * Bottom-sheet modal for manually creating a recipe.
 *
 * Includes fields for title, ingredients, instructions, servings/timing,
 * and optional image. Lives on the recipes screen alongside ImportRecipeModal;
 * after a successful create it closes and navigates to the new recipe's
 * detail page.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { BottomSheetModal, Button, FormField } from '@/components';
import { showNotification } from '@/lib/alert';
import { api } from '@/lib/api';
import { useCreateRecipe, useImagePicker } from '@/lib/hooks';
import { useTranslation } from '@/lib/i18n';
import { fontSize, spacing, useTheme } from '@/lib/theme';

interface ManualRecipeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ManualRecipeModal = ({
  visible,
  onClose,
}: ManualRecipeModalProps) => {
  const { colors, fonts, borderRadius } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [servings, setServings] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');

  const createRecipe = useCreateRecipe();
  const isPending = createRecipe.isPending;

  const { pickImage: handlePickImage } = useImagePicker((uri) => {
    setSelectedImage(uri);
    setImageUrl('');
  });

  const resetAndClose = () => {
    setTitle('');
    setIngredients('');
    setInstructions('');
    setImageUrl('');
    setSelectedImage(null);
    setServings('');
    setPrepTime('');
    setCookTime('');
    onClose();
  };

  const navigateToRecipe = (id: string) => {
    resetAndClose();
    router.push(`/recipe/${id}`);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      showNotification(t('common.error'), t('addRecipe.titleRequired'));
      return;
    }

    const parsedServings = servings ? Number.parseInt(servings, 10) : null;
    if (
      parsedServings !== null &&
      (Number.isNaN(parsedServings) || parsedServings < 1)
    ) {
      showNotification(t('common.error'), t('addRecipe.servingsInvalid'));
      return;
    }

    const parsedPrepTime = prepTime ? Number.parseInt(prepTime, 10) : null;
    if (
      parsedPrepTime !== null &&
      (Number.isNaN(parsedPrepTime) || parsedPrepTime < 0)
    ) {
      showNotification(t('common.error'), t('addRecipe.prepTimeInvalid'));
      return;
    }

    const parsedCookTime = cookTime ? Number.parseInt(cookTime, 10) : null;
    if (
      parsedCookTime !== null &&
      (Number.isNaN(parsedCookTime) || parsedCookTime < 0)
    ) {
      showNotification(t('common.error'), t('addRecipe.cookTimeInvalid'));
      return;
    }

    try {
      const recipe = await createRecipe.mutateAsync({
        title: title.trim(),
        url: '',
        ingredients: ingredients
          .split('\n')
          .map((i) => i.trim())
          .filter(Boolean),
        instructions: instructions
          .split('\n')
          .map((i) => i.trim())
          .filter(Boolean),
        image_url: imageUrl.trim() || null,
        servings: parsedServings,
        prep_time: parsedPrepTime,
        cook_time: parsedCookTime,
        diet_label: null,
        meal_label: null,
      });

      if (selectedImage) {
        try {
          await api.uploadRecipeImage(recipe.id, selectedImage);
        } catch {
          showNotification(
            t('common.error'),
            t('recipeDetail.imageUploadFailed'),
          );
        }
      }

      navigateToRecipe(recipe.id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('addRecipe.createFailedDefault');
      showNotification(t('addRecipe.createFailed'), message);
    }
  };

  const inputStyle = {
    backgroundColor: colors.card.bg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.card.borderColor,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.lg,
    fontFamily: fonts.body,
    color: colors.content.body,
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={resetAndClose}
      title={t('addRecipe.manualTitle')}
      animationType="fade"
      dismissOnBackdropPress={!isPending}
      showDragHandle
      showCloseButton={false}
      backgroundColor={colors.surface.modal}
      maxHeight="90%"
    >
      {/* Title */}
      <FormField label={`${t('addRecipe.recipeTitle')} *`}>
        <TextInput
          style={inputStyle}
          placeholder={t('addRecipe.titlePlaceholder')}
          placeholderTextColor={colors.gray[500]}
          value={title}
          onChangeText={setTitle}
          editable={!isPending}
        />
      </FormField>

      {/* Ingredients */}
      <FormField label={t('addRecipe.ingredients')}>
        <TextInput
          style={{
            ...inputStyle,
            minHeight: 100,
            textAlignVertical: 'top',
          }}
          placeholder={t('addRecipe.ingredientsPlaceholder')}
          placeholderTextColor={colors.gray[500]}
          value={ingredients}
          onChangeText={setIngredients}
          multiline
          editable={!isPending}
        />
      </FormField>

      {/* Instructions */}
      <FormField label={t('addRecipe.instructions')}>
        <TextInput
          style={{
            ...inputStyle,
            minHeight: 120,
            textAlignVertical: 'top',
          }}
          placeholder={t('addRecipe.instructionsPlaceholder')}
          placeholderTextColor={colors.gray[500]}
          value={instructions}
          onChangeText={setInstructions}
          multiline
          editable={!isPending}
        />
      </FormField>

      {/* Time & Servings Row */}
      <View
        style={{
          flexDirection: 'row',
          gap: spacing.md,
          marginBottom: spacing.lg,
        }}
      >
        <NumericField
          label={t('labels.time.servings')}
          placeholder="4"
          value={servings}
          onChangeText={setServings}
          disabled={isPending}
        />
        <NumericField
          label={t('labels.time.prepMin')}
          placeholder="15"
          value={prepTime}
          onChangeText={setPrepTime}
          disabled={isPending}
        />
        <NumericField
          label={t('labels.time.cookMin')}
          placeholder="30"
          value={cookTime}
          onChangeText={setCookTime}
          disabled={isPending}
        />
      </View>

      {/* Image */}
      <View style={{ marginBottom: spacing.lg }}>
        <Text
          style={{
            fontSize: fontSize.lg,
            fontFamily: fonts.bodySemibold,
            color: colors.content.body,
            marginBottom: spacing.sm,
          }}
        >
          {t('addRecipe.imageOptional')}
        </Text>

        {(selectedImage || imageUrl) && (
          <View style={{ marginBottom: spacing.md, position: 'relative' }}>
            <Image
              source={{ uri: selectedImage || imageUrl }}
              style={{
                width: '100%',
                height: 200,
                borderRadius: borderRadius.md,
                backgroundColor: colors.gray[200],
              }}
              resizeMode="cover"
            />
            <Pressable
              onPress={() => {
                setSelectedImage(null);
                setImageUrl('');
              }}
              style={{
                position: 'absolute',
                top: spacing.sm,
                right: spacing.sm,
                backgroundColor: colors.overlay.strong,
                borderRadius: borderRadius.full,
                padding: spacing.xs,
              }}
            >
              <Ionicons name="close" size={20} color={colors.white} />
            </Pressable>
          </View>
        )}

        <Pressable
          onPress={handlePickImage}
          disabled={isPending}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.card.bg,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.card.borderColor,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Ionicons name="camera" size={20} color={colors.content.body} />
          <Text
            style={{
              marginLeft: spacing.sm,
              color: colors.content.body,
              fontSize: fontSize.md,
              fontFamily: fonts.bodyMedium,
            }}
          >
            {selectedImage || imageUrl
              ? t('recipeDetail.changeImage')
              : t('addRecipe.addImage')}
          </Text>
        </Pressable>
      </View>

      {/* Create button */}
      <View style={{ marginBottom: spacing.lg }}>
        <Button
          variant="primary"
          onPress={handleCreate}
          disabled={!title.trim()}
          isPending={isPending}
          icon="checkmark-circle-outline"
          label={t('addRecipe.createButton')}
          loadingLabel={t('addRecipe.creating')}
          color={colors.content.body}
        />
      </View>
    </BottomSheetModal>
  );
};

interface NumericFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  disabled: boolean;
}

const NumericField = ({
  label,
  placeholder,
  value,
  onChangeText,
  disabled,
}: NumericFieldProps) => {
  const { colors, fonts, borderRadius } = useTheme();

  return (
    <FormField label={label} compact>
      <TextInput
        style={{
          backgroundColor: colors.card.bg,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: colors.card.borderColor,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          fontSize: fontSize.md,
          fontFamily: fonts.body,
          color: colors.content.body,
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.gray[500]}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        editable={!disabled}
      />
    </FormField>
  );
};
