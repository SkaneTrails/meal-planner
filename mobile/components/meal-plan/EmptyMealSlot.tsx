import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { Text, View } from 'react-native';
import { AnimatedPressable, IconCircle } from '@/components';
import { fontSize, spacing, useTheme } from '@/lib/theme';
import type { MealType } from '@/lib/types';

interface EmptyMealSlotProps {
  date: Date;
  mealType: MealType;
  label: string;
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
  onPress,
}: EmptyMealSlotProps) => {
  const { colors, fonts, borderRadius } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.mealPlan.emptyBg,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        marginBottom: spacing['xs-sm'],
      }}
    >
      {/* Label section */}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', minWidth: 80 }}
      >
        <IconCircle
          size={26}
          bg={colors.surface.active}
          style={{ marginRight: spacing.sm }}
        >
          <Ionicons name="add" size={16} color={colors.content.subtitle} />
        </IconCircle>
        <Text
          style={{
            fontSize: fontSize.md,
            fontFamily: fonts.bodySemibold,
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
          gap: spacing['xs-sm'],
        }}
      >
        {/* Library action — same style as other icon buttons */}
        <SecondaryActionButton
          icon="book-outline"
          onPress={() => onPress(date, mealType, 'library')}
        />

        {/* Other actions */}
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
};

interface SecondaryActionButtonProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}

const SecondaryActionButton = ({
  icon,
  onPress,
}: SecondaryActionButtonProps) => {
  const { colors, borderRadius } = useTheme();
  return (
    <AnimatedPressable
      onPress={onPress}
      hoverScale={1.1}
      pressScale={0.9}
      style={{
        width: 34,
        height: 34,
        borderRadius: borderRadius['sm-md'],
        backgroundColor: colors.surface.active,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={17} color={colors.content.tertiary} />
    </AnimatedPressable>
  );
};
