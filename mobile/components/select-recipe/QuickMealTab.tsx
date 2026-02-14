import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { useSelectRecipeState } from '@/lib/hooks/useSelectRecipeState';
import {
  borderRadius,
  colors,
  fontSize,
  iconContainer,
  letterSpacing,
  spacing,
} from '@/lib/theme';

type State = ReturnType<typeof useSelectRecipeState>;

interface QuickMealTabProps {
  state: State;
}

export const QuickMealTab = ({ state }: QuickMealTabProps) => {
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
          backgroundColor: colors.glass.card,
          borderRadius: borderRadius.lg,
          padding: spacing['2xl'],
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
          <View
            style={{
              width: iconContainer.xl,
              height: iconContainer.xl,
              borderRadius: iconContainer.xl / 2,
              backgroundColor: 'rgba(107, 142, 107, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Ionicons name="create-outline" size={28} color="#6B8E6B" />
          </View>
          <Text
            style={{
              fontSize: fontSize['3xl'],
              fontWeight: '600',
              color: colors.text.inverse,
              letterSpacing: letterSpacing.normal,
            }}
          >
            {t('selectRecipe.quick.title')}
          </Text>
          <View
            style={{
              width: 40,
              height: 3,
              borderRadius: 2,
              backgroundColor: '#6B8E6B',
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

        <TextInput
          style={{
            backgroundColor: colors.glass.light,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.lg,
            fontSize: fontSize.lg,
            color: colors.text.inverse,
            marginBottom: spacing.lg,
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
            backgroundColor: customText.trim()
              ? pressed
                ? '#5A7A5A'
                : '#6B8E6B'
              : colors.gray[300],
            borderRadius: borderRadius.md,
            paddingVertical: spacing.lg,
            alignItems: 'center',
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text
            style={{
              fontSize: fontSize.lg,
              fontWeight: '600',
              color: customText.trim() ? colors.white : colors.gray[500],
            }}
          >
            {t('selectRecipe.quick.addButton')}
          </Text>
        </Pressable>
      </View>

      {/* Clear meal button */}
      <Pressable
        onPress={handleRemoveMeal}
        disabled={removeMeal.isPending}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.md,
          borderRadius: 12,
          backgroundColor: pressed
            ? 'rgba(93, 78, 64, 0.12)'
            : 'rgba(93, 78, 64, 0.08)',
          marginTop: spacing.xl,
        })}
      >
        <Ionicons
          name="trash-outline"
          size={18}
          color="rgba(93, 78, 64, 0.7)"
        />
        <Text
          style={{
            marginLeft: spacing.sm,
            fontSize: fontSize.lg,
            fontWeight: '600',
            color: 'rgba(93, 78, 64, 0.7)',
          }}
        >
          {t('selectRecipe.clearMeal')}
        </Text>
      </Pressable>
    </View>
  );
};
