import { Ionicons } from '@expo/vector-icons';
import { Text, TextInput, View } from 'react-native';
import { Button, IconCircle } from '@/components';
import type { useSelectRecipeState } from '@/lib/hooks/useSelectRecipeState';
import {
  accentUnderlineStyle,
  fontSize,
  fontWeight,
  letterSpacing,
  spacing,
  useTheme,
} from '@/lib/theme';

type State = ReturnType<typeof useSelectRecipeState>;

interface QuickMealTabProps {
  state: State;
}

export const QuickMealTab = ({ state }: QuickMealTabProps) => {
  const { colors, fonts, borderRadius, crt } = useTheme();
  const {
    t,
    customText,
    setCustomText,
    handleSetCustomText,
    setMeal,
    handleRemoveMeal,
    removeMeal,
  } = state;

  return (
    <View style={{ flex: 1, padding: spacing.xl }}>
      <View
        style={{
          backgroundColor: crt ? colors.mealPlan.slotBg : colors.glass.card,
          borderRadius: crt ? borderRadius.sm : borderRadius.lg,
          padding: spacing['2xl'],
        }}
      >
        {crt ? (
          <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
            <Text
              style={{
                fontSize: fontSize['2xl'],
                fontFamily: fonts.bodySemibold,
                color: colors.primary,
              }}
            >
              {t('selectRecipe.quick.title')}
            </Text>
            <Text
              style={{
                fontSize: fontSize.md,
                fontFamily: fonts.body,
                color: colors.content.tertiary,
                marginTop: spacing.sm,
              }}
            >
              {t('selectRecipe.quick.placeholder')}
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
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
            <Text
              style={{
                fontSize: fontSize['3xl'],
                fontWeight: fontWeight.semibold,
                color: colors.text.inverse,
                letterSpacing: letterSpacing.normal,
              }}
            >
              {t('selectRecipe.quick.title')}
            </Text>
            <View
              style={{
                ...accentUnderlineStyle,
                marginTop: spacing.sm,
              }}
            />
            <Text
              style={{
                fontSize: fontSize.lg,
                color: colors.gray[600],
                marginTop: spacing.sm,
              }}
            >
              {t('selectRecipe.quick.placeholder')}
            </Text>
          </View>
        )}

        <TextInput
          style={{
            backgroundColor: crt ? colors.bgBase : colors.glass.light,
            borderRadius: crt ? borderRadius.sm : borderRadius.md,
            borderWidth: crt ? 1 : 0,
            borderColor: crt ? colors.border : undefined,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.lg,
            fontSize: fontSize.lg,
            fontFamily: crt ? fonts.body : undefined,
            color: crt ? colors.primary : colors.text.inverse,
            marginBottom: spacing.lg,
          }}
          placeholder={t('selectRecipe.quickPlaceholder')}
          placeholderTextColor={
            crt ? colors.content.placeholder : colors.gray[500]
          }
          value={customText}
          onChangeText={setCustomText}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSetCustomText}
        />

        <Button
          variant="primary"
          onPress={handleSetCustomText}
          disabled={!customText.trim() || setMeal.isPending}
          label={t('selectRecipe.quick.addButton')}
          color={customText.trim() ? colors.ai.primary : colors.gray[300]}
          textColor={customText.trim() ? colors.white : colors.gray[500]}
        />
      </View>

      {/* Clear meal button */}
      <Button
        variant="text"
        tone="destructive"
        onPress={handleRemoveMeal}
        disabled={removeMeal.isPending}
        icon="trash-outline"
        iconSize={18}
        label={t('selectRecipe.clearMeal')}
        textColor={colors.content.tertiary}
        color={colors.surface.hover}
        style={{
          justifyContent: 'center',
          paddingVertical: spacing.md,
          borderRadius: borderRadius.sm,
          marginTop: spacing.xl,
        }}
      />
    </View>
  );
};
