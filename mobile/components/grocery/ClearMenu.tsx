import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { AnimatedPressable } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { borderRadius, fontSize, spacing, useTheme } from '@/lib/theme';

interface ClearMenuProps {
  onClearMealPlanItems: () => void;
  onClearManualItems: () => void;
  onClearAll: () => void;
}

export const ClearMenu = ({
  onClearMealPlanItems,
  onClearManualItems,
  onClearAll,
}: ClearMenuProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{
        marginTop: spacing.sm,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
      }}
    >
      <AnimatedPressable
        onPress={onClearMealPlanItems}
        hoverScale={1.02}
        pressScale={0.98}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.md,
          backgroundColor: colors.surface.hover,
          gap: spacing.xs,
        }}
      >
        <Ionicons
          name="calendar-outline"
          size={14}
          color={colors.content.tertiary}
        />
        <Text style={{ fontSize: fontSize.sm, color: colors.content.strong }}>
          {t('grocery.clearMealPlanItems')}
        </Text>
      </AnimatedPressable>

      <AnimatedPressable
        onPress={onClearManualItems}
        hoverScale={1.02}
        pressScale={0.98}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.md,
          backgroundColor: colors.surface.hover,
          gap: spacing.xs,
        }}
      >
        <Ionicons
          name="create-outline"
          size={14}
          color={colors.content.tertiary}
        />
        <Text style={{ fontSize: fontSize.sm, color: colors.content.strong }}>
          {t('grocery.clearManualItems')}
        </Text>
      </AnimatedPressable>

      <AnimatedPressable
        onPress={onClearAll}
        hoverScale={1.02}
        pressScale={0.98}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.md,
          backgroundColor: colors.destructive.bg,
          gap: spacing.xs,
        }}
      >
        <Ionicons
          name="trash-outline"
          size={14}
          color={colors.destructive.icon}
        />
        <Text style={{ fontSize: fontSize.sm, color: colors.destructive.text }}>
          {t('grocery.clearEntireList')}
        </Text>
      </AnimatedPressable>
    </View>
  );
};
