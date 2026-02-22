import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Section } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { fontSize, lineHeight, spacing, useTheme } from '@/lib/theme';
import type { Recipe } from '@/lib/types';

interface RecipeEnhancedInfoProps {
  recipe: Recipe;
  showOriginal: boolean;
  showAiChanges: boolean;
  t: TFunction;
  onToggleAiChanges: () => void;
  /** Which section to render. Parent decides visibility. */
  section?: 'tips' | 'changes' | 'all';
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

export const RecipeEnhancedInfo = ({
  recipe,
  showOriginal,
  showAiChanges,
  t,
  onToggleAiChanges,
  section = 'all',
  collapsible = false,
  expanded = true,
  onToggle,
}: RecipeEnhancedInfoProps) => {
  const { colors, fonts, borderRadius } = useTheme();

  const showTips =
    (section === 'tips' || section === 'all') &&
    recipe.enhanced &&
    !showOriginal &&
    recipe.tips;

  const showChanges =
    (section === 'changes' || section === 'all') &&
    recipe.enhanced &&
    !showOriginal &&
    recipe.changes_made &&
    recipe.changes_made.length > 0;

  if (!showTips && !showChanges) return null;

  if (section === 'tips' && showTips) {
    return (
      <Section
        title={t('recipe.tips')}
        icon="bulb-outline"
        iconColor={colors.ai.primary}
        iconBg={colors.ai.iconBg}
        size="sm"
        spacing={0}
        collapsible={collapsible}
        expanded={expanded}
        onToggle={onToggle}
      >
        <View
          style={{
            borderLeftWidth: 4,
            borderLeftColor: colors.ai.primary,
            borderRadius: borderRadius.sm,
            paddingLeft: spacing.md,
          }}
        >
          <Text
            style={{
              fontSize: fontSize.xl,
              fontFamily: fonts.body,
              color: colors.content.body,
              lineHeight: lineHeight.xl,
            }}
          >
            {recipe.tips}
          </Text>
        </View>
      </Section>
    );
  }

  if (section === 'changes' && showChanges) {
    return (
      <Section
        title={t('recipe.aiImprovements')}
        icon="sparkles"
        iconColor={colors.ai.primary}
        iconBg={colors.ai.iconBg}
        size="sm"
        spacing={0}
        collapsible={collapsible}
        expanded={expanded}
        onToggle={onToggle}
      >
        {recipe.changes_made?.map((change, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              marginBottom:
                index < (recipe.changes_made?.length ?? 0) - 1 ? spacing.sm : 0,
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
      </Section>
    );
  }

  // section === 'all' — legacy rendering for both
  return (
    <>
      {showTips && (
        <Section
          title={t('recipe.tips')}
          icon="bulb-outline"
          iconColor={colors.ai.primary}
          iconBg={colors.ai.iconBg}
          size="sm"
          spacing={0}
        >
          <View
            style={{
              borderLeftWidth: 4,
              borderLeftColor: colors.ai.primary,
              borderRadius: borderRadius.sm,
              paddingLeft: spacing.md,
            }}
          >
            <Text
              style={{
                fontSize: fontSize.xl,
                fontFamily: fonts.body,
                color: colors.content.body,
                lineHeight: lineHeight.xl,
              }}
            >
              {recipe.tips}
            </Text>
          </View>
        </Section>
      )}

      {showChanges && (
        <Section
          title={t('recipe.aiImprovements')}
          icon="sparkles"
          iconColor={colors.ai.primary}
          iconBg={colors.ai.iconBg}
          size="sm"
          spacing={0}
          collapsible
          expanded={showAiChanges}
          onToggle={onToggleAiChanges}
        >
          {recipe.changes_made?.map((change, index) => (
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
        </Section>
      )}
    </>
  );
};
