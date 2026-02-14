import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { AnimatedPressable } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { borderRadius, fontSize, spacing } from '@/lib/theme';

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
          backgroundColor: 'rgba(93, 78, 64, 0.08)',
          gap: spacing.xs,
        }}
      >
        <Ionicons
          name="calendar-outline"
          size={14}
          color="rgba(93, 78, 64, 0.7)"
        />
        <Text style={{ fontSize: fontSize.sm, color: 'rgba(93, 78, 64, 0.8)' }}>
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
          backgroundColor: 'rgba(93, 78, 64, 0.08)',
          gap: spacing.xs,
        }}
      >
        <Ionicons
          name="create-outline"
          size={14}
          color="rgba(93, 78, 64, 0.7)"
        />
        <Text style={{ fontSize: fontSize.sm, color: 'rgba(93, 78, 64, 0.8)' }}>
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
          backgroundColor: 'rgba(180, 80, 70, 0.1)',
          gap: spacing.xs,
        }}
      >
        <Ionicons
          name="trash-outline"
          size={14}
          color="rgba(180, 80, 70, 0.8)"
        />
        <Text
          style={{ fontSize: fontSize.sm, color: 'rgba(180, 80, 70, 0.9)' }}
        >
          {t('grocery.clearEntireList')}
        </Text>
      </AnimatedPressable>
    </View>
  );
};
