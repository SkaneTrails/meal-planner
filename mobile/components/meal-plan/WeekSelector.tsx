import { Pressable, Text, View } from 'react-native';
import { IconButton } from '@/components';
import { hapticLight } from '@/lib/haptics';
import type { TFunction } from '@/lib/i18n';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';
import { formatWeekRange } from '@/lib/utils/dateFormatter';

interface WeekSelectorProps {
  weekDates: Date[];
  weekOffset: number;
  language: string;
  t: TFunction;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onJumpToToday: () => void;
}

export const WeekSelector = ({
  weekDates,
  weekOffset,
  language,
  t,
  onPreviousWeek,
  onNextWeek,
  onJumpToToday,
}: WeekSelectorProps) => {
  const { colors, fonts } = useTheme();
  return (
    <View
      style={{ paddingHorizontal: spacing['2xl'], marginBottom: spacing.lg }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing['sm-md'],
        }}
      >
        <IconButton
          tone="alt"
          onPress={() => {
            hapticLight();
            onPreviousWeek();
          }}
          icon="chevron-back"
          label="\u25C4"
        />

        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: fontSize.md,
              fontFamily: fonts.bodySemibold,
              fontWeight: fontWeight.semibold,
              color: colors.content.strong,
            }}
          >
            {formatWeekRange(weekDates, language)}
          </Text>
          {weekOffset !== 0 && (
            <Pressable
              onPress={() => {
                hapticLight();
                onJumpToToday();
              }}
            >
              <Text
                style={{
                  fontSize: fontSize.xs,
                  fontFamily: fonts.body,
                  color: colors.accent,
                  marginTop: 2,
                  fontWeight: fontWeight.medium,
                }}
              >
                {t('mealPlan.jumpToToday')}
              </Text>
            </Pressable>
          )}
        </View>

        <IconButton
          tone="alt"
          onPress={() => {
            hapticLight();
            onNextWeek();
          }}
          icon="chevron-forward"
          label="\u25BA"
        />
      </View>
    </View>
  );
};
