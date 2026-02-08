import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily } from '@/lib/theme';
import { AnimatedPressable } from '@/components';
import type { MealType } from '@/lib/types';
import type { TFunction } from '@/lib/i18n';

interface EmptyMealSlotProps {
  date: Date;
  mealType: MealType;
  label: string;
  t: TFunction;
  onPress: (date: Date, mealType: MealType, mode: 'library' | 'copy' | 'quick' | 'random') => void;
}

export const EmptyMealSlot = ({ date, mealType, label, t, onPress }: EmptyMealSlotProps) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.35)',
      borderRadius: 16,
      padding: 12,
      marginBottom: 8,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
      <View style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
      }}>
        <Ionicons name="add" size={18} color={colors.white} />
      </View>
      <Text style={{ fontSize: 14, fontFamily: fontFamily.bodySemibold, color: '#5D4E40' }}>
        {label}
      </Text>
    </View>

    <View style={{ flex: 1, alignItems: 'flex-end' }}>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
        <ActionButton
          icon="book-outline"
          label={t('mealPlan.library')}
          bgColor="rgba(255, 255, 255, 0.85)"
          textColor="#5D4E40"
          onPress={() => onPress(date, mealType, 'library')}
        />
        <ActionButton
          icon="dice-outline"
          label={t('mealPlan.random')}
          bgColor="rgba(220, 215, 210, 0.9)"
          textColor="#5D4E40"
          onPress={() => onPress(date, mealType, 'random')}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <ActionButton
          icon="copy-outline"
          label={t('mealPlan.copy')}
          bgColor="rgba(160, 150, 140, 0.85)"
          textColor="#FFFFFF"
          onPress={() => onPress(date, mealType, 'copy')}
        />
        <ActionButton
          icon="create-outline"
          label={t('mealPlan.quick')}
          bgColor="rgba(93, 78, 64, 0.85)"
          textColor="#FFFFFF"
          onPress={() => onPress(date, mealType, 'quick')}
        />
      </View>
    </View>
  </View>
);

interface ActionButtonProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  bgColor: string;
  textColor: string;
  onPress: () => void;
}

const ActionButton = ({ icon, label, bgColor, textColor, onPress }: ActionButtonProps) => (
  <AnimatedPressable
    onPress={onPress}
    hoverScale={1.05}
    pressScale={0.95}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: bgColor,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      gap: 4,
      minWidth: 75,
      justifyContent: 'center',
    }}
  >
    <Ionicons name={icon} size={14} color={textColor} />
    <Text style={{ fontSize: 12, fontFamily: fontFamily.bodySemibold, color: textColor }}>{label}</Text>
  </AnimatedPressable>
);
