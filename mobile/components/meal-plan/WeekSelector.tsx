import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, colors, spacing, fontSize, fontWeight } from '@/lib/theme';
import { AnimatedPressable } from '@/components';
import { hapticLight } from '@/lib/haptics';
import { formatWeekRange } from '@/lib/utils/dateFormatter';
import type { TFunction } from '@/lib/i18n';

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
}: WeekSelectorProps) => (
  <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
      }}
    >
      <AnimatedPressable
        onPress={() => { hapticLight(); onPreviousWeek(); }}
        hoverScale={1.1}
        pressScale={0.9}
        style={{
          padding: 8,
          borderRadius: borderRadius.full,
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
        }}
      >
        <Ionicons name="chevron-back" size={18} color="rgba(93, 78, 64, 0.7)" />
      </AnimatedPressable>

      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: 'rgba(93, 78, 64, 0.85)' }}>
          {formatWeekRange(weekDates, language)}
        </Text>
        {weekOffset !== 0 && (
          <Pressable onPress={() => { hapticLight(); onJumpToToday(); }}>
            <Text style={{
              fontSize: fontSize.xs,
              color: colors.accent,
              marginTop: 2,
              fontWeight: fontWeight.medium,
            }}>{t('mealPlan.jumpToToday')}</Text>
          </Pressable>
        )}
      </View>

      <AnimatedPressable
        onPress={() => { hapticLight(); onNextWeek(); }}
        hoverScale={1.1}
        pressScale={0.9}
        style={{
          padding: 8,
          borderRadius: borderRadius.full,
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
        }}
      >
        <Ionicons name="chevron-forward" size={18} color="rgba(93, 78, 64, 0.7)" />
      </AnimatedPressable>
    </View>
  </View>
);
