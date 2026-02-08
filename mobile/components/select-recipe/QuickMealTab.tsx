import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, colors, spacing, fontSize, letterSpacing, iconContainer } from '@/lib/theme';
import type { useSelectRecipeState } from '@/lib/hooks/useSelectRecipeState';

type State = ReturnType<typeof useSelectRecipeState>;

interface QuickMealTabProps {
  state: State;
}

export const QuickMealTab = ({ state }: QuickMealTabProps) => {
  const { t, customText, setCustomText, handleSetCustomText, setMeal } = state;

  return (
    <View style={{ flex: 1, padding: spacing.xl }}>
      <View style={{
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.lg,
        padding: spacing['2xl'],
      }}>
        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
          <View style={{
            width: iconContainer.xl, height: iconContainer.xl,
            borderRadius: iconContainer.xl / 2,
            backgroundColor: colors.glass.light,
            alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
          }}>
            <Ionicons name="create-outline" size={28} color={colors.text.inverse} />
          </View>
          <Text style={{ fontSize: fontSize['3xl'], fontWeight: '600', color: colors.text.inverse, letterSpacing: letterSpacing.normal }}>
            {t('selectRecipe.quick.title')}
          </Text>
          <Text style={{ fontSize: fontSize.lg, color: colors.gray[600], marginTop: spacing.xs }}>
            {t('selectRecipe.quick.placeholder')}
          </Text>
        </View>

        <TextInput
          style={{
            backgroundColor: colors.glass.light, borderRadius: borderRadius.md,
            paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
            fontSize: fontSize.lg, color: colors.text.inverse, marginBottom: spacing.lg,
          }}
          placeholder={t('selectRecipe.quickPlaceholder')}
          placeholderTextColor={colors.gray[500]}
          value={customText}
          onChangeText={setCustomText}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSetCustomText}
        />

        <Pressable
          onPress={handleSetCustomText}
          disabled={!customText.trim() || setMeal.isPending}
          style={({ pressed }) => ({
            backgroundColor: customText.trim() ? colors.primary : colors.gray[300],
            borderRadius: borderRadius.md, paddingVertical: spacing.lg,
            alignItems: 'center', opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: customText.trim() ? colors.white : colors.gray[500] }}>
            {t('selectRecipe.quick.addButton')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
