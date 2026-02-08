import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shadows, borderRadius, colors, spacing, fontSize, letterSpacing } from '@/lib/theme';
import { GradientBackground } from '@/components';
import type { useAddRecipeActions } from '@/lib/hooks/useAddRecipeActions';

type Actions = ReturnType<typeof useAddRecipeActions>;

interface ManualRecipeFormProps {
  actions: Actions;
}

export const ManualRecipeForm = ({ actions }: ManualRecipeFormProps) => {
  const {
    t, isPending, title, setTitle, ingredients, setIngredients,
    instructions, setInstructions, imageUrl, setImageUrl, selectedImage,
    setSelectedImage, servings, setServings, prepTime, setPrepTime,
    cookTime, setCookTime, handleCreateManual, handlePickImage,
  } = actions;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <GradientBackground style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{
            backgroundColor: colors.primary,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            marginBottom: spacing['2xl'],
            ...shadows.md,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <Ionicons name="create" size={22} color={colors.white} />
              <Text style={{ marginLeft: spacing.sm, fontSize: fontSize['2xl'], fontWeight: '600', color: colors.white, letterSpacing: letterSpacing.normal }}>
                {t('addRecipe.manualTitle')}
              </Text>
            </View>
            <Text style={{ color: colors.text.secondary, fontSize: fontSize.lg, lineHeight: 22 }}>
              {t('addRecipe.manualDescription')}
            </Text>
          </View>

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
              style={{ ...inputStyle, minHeight: 100, textAlignVertical: 'top' }}
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
              style={{ ...inputStyle, minHeight: 120, textAlignVertical: 'top' }}
              placeholder={t('addRecipe.instructionsPlaceholder')}
              placeholderTextColor={colors.gray[500]}
              value={instructions}
              onChangeText={setInstructions}
              multiline
              editable={!isPending}
            />
          </FormField>

          {/* Time & Servings Row */}
          <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
            <NumericField label={t('labels.time.servings')} placeholder="4" value={servings} onChangeText={setServings} disabled={isPending} />
            <NumericField label={t('labels.time.prepMin')} placeholder="15" value={prepTime} onChangeText={setPrepTime} disabled={isPending} />
            <NumericField label={t('labels.time.cookMin')} placeholder="30" value={cookTime} onChangeText={setCookTime} disabled={isPending} />
          </View>

          {/* Image */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text.inverse, marginBottom: spacing.sm }}>
              {t('addRecipe.imageOptional')}
            </Text>

            {(selectedImage || imageUrl) && (
              <View style={{ marginBottom: spacing.md, position: 'relative' }}>
                <Image
                  source={{ uri: selectedImage || imageUrl }}
                  style={{ width: '100%', height: 200, borderRadius: borderRadius.md, backgroundColor: colors.gray[200] }}
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => { setSelectedImage(null); setImageUrl(''); }}
                  style={{
                    position: 'absolute', top: spacing.sm, right: spacing.sm,
                    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: borderRadius.full, padding: spacing.xs,
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
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                backgroundColor: colors.glass.card, borderRadius: borderRadius.md,
                paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
                opacity: pressed ? 0.8 : 1, ...shadows.sm,
              })}
            >
              <Ionicons name="camera" size={20} color={colors.text.inverse} />
              <Text style={{ marginLeft: spacing.sm, color: colors.text.inverse, fontSize: fontSize.md, fontWeight: '500' }}>
                {selectedImage || imageUrl ? t('recipeDetail.changeImage') : t('addRecipe.addImage')}
              </Text>
            </Pressable>
          </View>

          {/* Create button */}
          <Pressable
            onPress={handleCreateManual}
            disabled={!title.trim() || isPending}
            style={({ pressed }) => ({
              paddingVertical: spacing.md, borderRadius: borderRadius.md,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              backgroundColor: title.trim() && !isPending ? colors.primary : colors.gray[300],
              opacity: pressed ? 0.9 : 1, ...shadows.md,
            })}
          >
            {isPending ? (
              <>
                <Ionicons name="hourglass-outline" size={20} color={colors.white} />
                <Text style={{ marginLeft: spacing.sm, color: colors.white, fontSize: fontSize.lg, fontWeight: '600' }}>
                  {t('addRecipe.creating')}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
                <Text style={{ marginLeft: spacing.sm, color: colors.white, fontSize: fontSize.lg, fontWeight: '600' }}>
                  {t('addRecipe.createButton')}
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </GradientBackground>
    </KeyboardAvoidingView>
  );
};

const inputStyle = {
  backgroundColor: colors.glass.card,
  borderRadius: borderRadius.md,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  fontSize: fontSize.lg,
  color: colors.text.inverse,
  ...shadows.sm,
};

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

const FormField = ({ label, children }: FormFieldProps) => (
  <View style={{ marginBottom: spacing.lg }}>
    <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text.inverse, marginBottom: spacing.sm }}>
      {label}
    </Text>
    {children}
  </View>
);

interface NumericFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  disabled: boolean;
}

const NumericField = ({ label, placeholder, value, onChangeText, disabled }: NumericFieldProps) => (
  <View style={{ flex: 1 }}>
    <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.text.inverse, marginBottom: spacing.xs }}>
      {label}
    </Text>
    <TextInput
      style={{
        backgroundColor: colors.glass.card, borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
        fontSize: fontSize.md, color: colors.text.inverse, ...shadows.sm,
      }}
      placeholder={placeholder}
      placeholderTextColor={colors.gray[500]}
      value={value}
      onChangeText={onChangeText}
      keyboardType="numeric"
      editable={!disabled}
    />
  </View>
);
