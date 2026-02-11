import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontFamily } from '@/lib/theme';
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
      backgroundColor: 'rgba(255, 255, 255, 0.75)',
      borderRadius: 14,
      padding: 14,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 2,
    }}
  >
    {/* Label section */}
    <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 80 }}>
      <View style={{
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(93, 78, 64, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
      }}>
        <Ionicons name="add" size={16} color="rgba(93, 78, 64, 0.5)" />
      </View>
      <Text style={{ fontSize: 14, fontFamily: fontFamily.bodySemibold, color: 'rgba(93, 78, 64, 0.7)' }}>
        {label}
      </Text>
    </View>

    {/* Actions: Primary (Library) + Secondary icon buttons */}
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
      {/* Primary action: Library */}
      <AnimatedPressable
        onPress={() => onPress(date, mealType, 'library')}
        hoverScale={1.03}
        pressScale={0.97}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#5D4E40',
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 10,
          gap: 6,
        }}
      >
        <Ionicons name="book-outline" size={14} color="#FFFFFF" />
        <Text style={{ fontSize: 13, fontFamily: fontFamily.bodySemibold, color: '#FFFFFF' }}>
          {t('mealPlan.library')}
        </Text>
      </AnimatedPressable>

      {/* Secondary actions: icon-only ghost buttons */}
      <SecondaryActionButton
        icon="dice-outline"
        onPress={() => onPress(date, mealType, 'random')}
      />
      <SecondaryActionButton
        icon="copy-outline"
        onPress={() => onPress(date, mealType, 'copy')}
      />
      <SecondaryActionButton
        icon="create-outline"
        onPress={() => onPress(date, mealType, 'quick')}
      />
    </View>
  </View>
);

interface SecondaryActionButtonProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}

const SecondaryActionButton = ({ icon, onPress }: SecondaryActionButtonProps) => (
  <AnimatedPressable
    onPress={onPress}
    hoverScale={1.1}
    pressScale={0.9}
    style={{
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: 'rgba(93, 78, 64, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Ionicons name={icon} size={16} color="rgba(93, 78, 64, 0.6)" />
  </AnimatedPressable>
);
