/**
 * MealTypePicker — bottom sheet content for selecting meal type filters.
 * Renders a wrap-grid of meal types with Ionicons and multi-select support.
 */

import { Pressable, Text, View } from 'react-native';
import { type IoniconName, ThemeIcon } from '@/components/ThemeIcon';
import { hapticLight, hapticSelection } from '@/lib/haptics';
import type { TFunction } from '@/lib/i18n';
import { fontSize, iconSize, spacing, useTheme } from '@/lib/theme';
import type { MealLabel } from '@/lib/types';

const MEAL_TYPE_ICONS: Record<MealLabel, IoniconName> = {
  breakfast: 'cafe-outline',
  starter: 'flame-outline',
  side_dish: 'leaf-outline',
  meal: 'restaurant-outline',
  dessert: 'ice-cream-outline',
  drink: 'wine-outline',
  sauce: 'water-outline',
  pickle: 'flask-outline',
  grill: 'bonfire-outline',
};

const MEAL_TYPES: MealLabel[] = [
  'breakfast',
  'starter',
  'side_dish',
  'meal',
  'dessert',
  'drink',
  'sauce',
  'pickle',
  'grill',
];

interface MealTypePickerProps {
  selected: MealLabel[];
  onToggle: (meal: MealLabel) => void;
  onClear: () => void;
  t: TFunction;
}

export const MealTypePicker = ({
  selected,
  onToggle,
  onClear,
  t,
}: MealTypePickerProps) => {
  const { colors, fonts, borderRadius } = useTheme();

  return (
    <View style={{ gap: spacing.md }}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
          paddingHorizontal: spacing.xs,
        }}
      >
        {MEAL_TYPES.map((meal) => {
          const isSelected = selected.includes(meal);
          return (
            <Pressable
              key={meal}
              onPress={() => {
                hapticSelection();
                onToggle(meal);
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={t(`labels.meal.${meal}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                borderRadius: borderRadius.md,
                backgroundColor: isSelected
                  ? colors.chip.mealTypeActive
                  : colors.chip.bg,
                borderWidth: isSelected ? 0 : 1,
                borderColor: colors.chip.border,
              }}
            >
              <ThemeIcon
                name={MEAL_TYPE_ICONS[meal]}
                size={iconSize.md}
                color={isSelected ? colors.white : colors.content.body}
              />
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontFamily: isSelected ? fonts.bodySemibold : fonts.body,
                  color: isSelected ? colors.white : colors.content.body,
                }}
              >
                {t(`labels.meal.${meal}`)}
              </Text>
              {isSelected && (
                <ThemeIcon
                  name="checkmark"
                  size={iconSize.sm}
                  color={colors.white}
                />
              )}
            </Pressable>
          );
        })}
      </View>
      {selected.length > 0 && (
        <Pressable
          onPress={() => {
            hapticLight();
            onClear();
          }}
          accessibilityRole="button"
          accessibilityLabel={t('labels.diet.all')}
          style={{
            alignSelf: 'center',
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.lg,
          }}
        >
          <Text
            style={{
              fontSize: fontSize.md,
              fontFamily: fonts.bodySemibold,
              color: colors.chip.mealTypeActive,
            }}
          >
            {t('labels.diet.all')}
          </Text>
        </Pressable>
      )}
    </View>
  );
};
