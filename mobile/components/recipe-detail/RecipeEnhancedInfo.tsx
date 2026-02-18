import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { IconCircle } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { fontSize, lineHeight, spacing, useTheme } from '@/lib/theme';
import type { Recipe } from '@/lib/types';

interface RecipeEnhancedInfoProps {
  recipe: Recipe;
  showOriginal: boolean;
  showAiChanges: boolean;
  t: TFunction;
  onToggleAiChanges: () => void;
}

export const RecipeEnhancedInfo = ({
  recipe,
  showOriginal,
  showAiChanges,
  t,
  onToggleAiChanges,
}: RecipeEnhancedInfoProps) => {
  const { colors, fonts, typography, borderRadius, shadows } = useTheme();
  return (
    <>
      {recipe.enhanced && !showOriginal && recipe.tips && (
        <View style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <IconCircle
              size="xs"
              bg={colors.ai.iconBg}
              style={{ marginRight: spacing.md }}
            >
              <Ionicons
                name="bulb-outline"
                size={18}
                color={colors.ai.primary}
              />
            </IconCircle>
            <Text
              style={{
                ...typography.displaySmall,
                color: colors.content.heading,
              }}
            >
              {t('recipe.tips')}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: colors.glass.solid,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              borderLeftWidth: 4,
              borderLeftColor: colors.ai.primary,
              ...shadows.card,
            }}
          >
            <Text
              style={{
                fontSize: fontSize.xl,
                fontFamily: fonts.body,
                color: colors.text.inverse,
                lineHeight: lineHeight.xl,
              }}
            >
              {recipe.tips}
            </Text>
          </View>
        </View>
      )}

      {recipe.enhanced &&
        !showOriginal &&
        recipe.changes_made &&
        recipe.changes_made.length > 0 && (
          <View
            style={{
              marginBottom: spacing.xl,
              backgroundColor: colors.glass.solid,
              borderRadius: borderRadius.lg,
              overflow: 'hidden',
              ...shadows.card,
            }}
          >
            <Pressable
              onPress={onToggleAiChanges}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                padding: spacing.lg,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <IconCircle
                size="xs"
                bg={colors.ai.iconBg}
                style={{ marginRight: spacing.md }}
              >
                <Ionicons name="sparkles" size={18} color={colors.ai.primary} />
              </IconCircle>
              <Text
                style={{
                  ...typography.displaySmall,
                  color: colors.content.body,
                  flex: 1,
                }}
              >
                {t('recipe.aiImprovements')}
              </Text>
              <Ionicons
                name={showAiChanges ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.content.body}
              />
            </Pressable>
            {showAiChanges && (
              <View
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingBottom: spacing.lg,
                  borderTopWidth: 1,
                  borderTopColor: colors.chip.divider,
                  paddingTop: spacing.md,
                }}
              >
                {recipe.changes_made.map((change, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      marginBottom:
                        index < (recipe.changes_made?.length ?? 0) - 1
                          ? spacing.sm
                          : 0,
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={colors.ai.primary}
                      style={{ marginRight: spacing.sm, marginTop: 2 }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: fontSize.lg,
                        fontFamily: fonts.body,
                        color: colors.content.body,
                        lineHeight: lineHeight.md,
                      }}
                    >
                      {change}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
    </>
  );
};
