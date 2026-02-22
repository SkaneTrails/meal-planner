import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Button,
  FormField,
  GradientBackground,
  NumericField,
} from '@/components';
import type { useAddRecipeActions } from '@/lib/hooks/useAddRecipeActions';
import {
  fontSize,
  fontWeight,
  layout,
  letterSpacing,
  lineHeight,
  spacing,
  useTheme,
} from '@/lib/theme';

type Actions = ReturnType<typeof useAddRecipeActions>;

interface ManualRecipeFormProps {
  actions: Actions;
}

export const ManualRecipeForm = ({ actions }: ManualRecipeFormProps) => {
  const { colors, borderRadius, shadows, styles: themeStyles } = useTheme();
  const {
    t,
    isPending,
    title,
    setTitle,
    ingredients,
    setIngredients,
    instructions,
    setInstructions,
    imageUrl,
    setImageUrl,
    selectedImage,
    setSelectedImage,
    servings,
    setServings,
    prepTime,
    setPrepTime,
    cookTime,
    setCookTime,
    handleCreateManual,
    handlePickImage,
  } = actions;

  const inputStyle = {
    ...themeStyles.inputStyle,
    ...shadows.sm,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <GradientBackground style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            { padding: spacing.lg, paddingBottom: 120 },
            layout.contentContainer,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View
            style={{
              backgroundColor: colors.primary,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              marginBottom: spacing['2xl'],
              ...shadows.md,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: spacing.sm,
              }}
            >
              <Ionicons name="create" size={22} color={colors.white} />
              <Text
                style={{
                  marginLeft: spacing.sm,
                  fontSize: fontSize['2xl'],
                  fontWeight: fontWeight.semibold,
                  color: colors.white,
                  letterSpacing: letterSpacing.normal,
                }}
              >
                {t('addRecipe.manualTitle')}
              </Text>
            </View>
            <Text
              style={{
                color: colors.text.secondary,
                fontSize: fontSize.lg,
                lineHeight: lineHeight.lg,
              }}
            >
              {t('addRecipe.manualDescription')}
            </Text>
          </View>

          {/* Title */}
          <FormField label={`${t('addRecipe.recipeTitle')} *`}>
            <TextInput
              style={inputStyle}
              placeholder={t('addRecipe.titlePlaceholder')}
              placeholderTextColor={colors.input.placeholder}
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
              placeholderTextColor={colors.input.placeholder}
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
              placeholderTextColor={colors.input.placeholder}
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
                fontWeight: fontWeight.semibold,
                color: colors.text.inverse,
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
                <Button
                  variant="icon"
                  tone="cancel"
                  icon="close"
                  onPress={() => {
                    setSelectedImage(null);
                    setImageUrl('');
                  }}
                  style={{
                    position: 'absolute',
                    top: spacing.sm,
                    right: spacing.sm,
                  }}
                />
              </View>
            )}

            <Button
              variant="text"
              icon="camera"
              label={
                selectedImage || imageUrl
                  ? t('recipeDetail.changeImage')
                  : t('addRecipe.addImage')
              }
              onPress={handlePickImage}
              disabled={isPending}
            />
          </View>

          {/* Create button */}
          <Button
            variant="primary"
            onPress={handleCreateManual}
            disabled={!title.trim()}
            isPending={isPending}
            icon="checkmark-circle-outline"
            label={t('addRecipe.createButton')}
            loadingLabel={t('addRecipe.creating')}
          />
        </ScrollView>
      </GradientBackground>
    </KeyboardAvoidingView>
  );
};
