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
  <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.xl,
        paddingVertical: 16,
      }}
    >
      <AnimatedPressable
        onPress={() => { hapticLight(); onPreviousWeek(); }}
        hoverScale={1.15}
        pressScale={0.9}
        style={{ padding: 6, borderRadius: borderRadius.sm }}
      >
        <Ionicons name="chevron-back" size={20} color="#5D4E40" />
      </AnimatedPressable>

      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#5D4E40' }}>
          {formatWeekRange(weekDates, language)}
        </Text>
        {weekOffset !== 0 && (
          <Pressable onPress={() => { hapticLight(); onJumpToToday(); }}>
            <Text style={{
              fontSize: fontSize.sm,
              color: colors.accent,
              marginTop: 4,
              fontWeight: fontWeight.medium,
            }}>{t('mealPlan.jumpToToday')}</Text>
          </Pressable>
        )}
      </View>

      <AnimatedPressable
        onPress={() => { hapticLight(); onNextWeek(); }}
        hoverScale={1.15}
        pressScale={0.9}
        style={{ padding: 6, borderRadius: borderRadius.sm }}
      >
        <Ionicons name="chevron-forward" size={20} color="#5D4E40" />
      </AnimatedPressable>
    </View>
  </View>
);
