import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { Text, View } from 'react-native';
import { AnimatedPressable } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { colors, fontFamily } from '@/lib/theme';
import type { MealType } from '@/lib/types';

interface EmptyMealSlotProps {
  date: Date;
  mealType: MealType;
  label: string;
  t: TFunction;
  onPress: (
    date: Date,
    mealType: MealType,
    mode: 'library' | 'copy' | 'quick' | 'random',
  ) => void;
}

export const EmptyMealSlot = ({
  date,
  mealType,
  label,
  t,
  onPress,
}: EmptyMealSlotProps) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(245, 242, 238, 0.7)',
      borderRadius: 12,
      padding: 12,
      marginBottom: 6,
    }}
  >
    {/* Label section */}
    <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 80 }}>
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: colors.surface.active,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 8,
        }}
      >
        <Ionicons name="add" size={16} color={colors.content.subtitle} />
      </View>
      <Text
        style={{
          fontSize: 13,
          fontFamily: fontFamily.bodySemibold,
          color: colors.content.strong,
        }}
      >
        {label}
      </Text>
    </View>

    {/* Actions: Primary (Library) + Secondary icon buttons */}
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
      }}
    >
      {/* Primary action: Library */}
      <AnimatedPressable
        onPress={() => onPress(date, mealType, 'library')}
        hoverScale={1.03}
        pressScale={0.97}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.content.body,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 10,
          gap: 5,
        }}
      >
        <Ionicons name="book-outline" size={13} color={colors.white} />
        <Text
          style={{
            fontSize: 12,
            fontFamily: fontFamily.bodySemibold,
            color: colors.white,
          }}
        >
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

const SecondaryActionButton = ({
  icon,
  onPress,
}: SecondaryActionButtonProps) => (
  <AnimatedPressable
    onPress={onPress}
    hoverScale={1.1}
    pressScale={0.9}
    style={{
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.surface.active,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Ionicons name={icon} size={17} color={colors.content.tertiary} />
  </AnimatedPressable>
);
