import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BottomSheetModal, Button } from '@/components';
import { hapticSuccess } from '@/lib/haptics';
import type { TFunction } from '@/lib/i18n';
import { fontSize, iconContainer, spacing, useTheme } from '@/lib/theme';
import type { MealType, Recipe } from '@/lib/types';
import {
  formatDateLocal,
  formatDayHeader,
  formatWeekRange,
} from '@/lib/utils/dateFormatter';
import type { MealTypeOption } from './meal-plan-constants';

interface GrocerySelectionModalProps {
  visible: boolean;
  groceryWeekDates: Date[];
  language: string;
  t: TFunction;
  mealTypes: MealTypeOption[];
  selectedMeals: Set<string>;
  mealServings: Record<string, number>;
  getMealForSlot: (
    date: Date,
    mealType: MealType,
  ) => { recipe?: Recipe; customText?: string } | null;
  onClose: () => void;
  onCreateGroceryList: () => void;
  onToggleMeal: (
    date: Date,
    mealType: MealType,
    recipeServings?: number,
  ) => void;
  onChangeServings: (key: string, delta: number) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

export const GrocerySelectionModal = ({
  visible,
  groceryWeekDates,
  language,
  t,
  mealTypes,
  selectedMeals,
  mealServings,
  getMealForSlot,
  onClose,
  onCreateGroceryList,
  onToggleMeal,
  onChangeServings,
  onPreviousWeek,
  onNextWeek,
}: GrocerySelectionModalProps) => {
  const { colors, fonts } = useTheme();
  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t('mealPlan.selectMeals')}
      subtitle={t('mealPlan.selectMealsSubtitle')}
      scrollable={false}
      footer={
        <View
          style={{
            padding: spacing.xl,
            borderTopWidth: 1,
            borderTopColor: colors.surface.divider,
          }}
        >
          <Button
            variant="primary"
            onPress={() => {
              hapticSuccess();
              onCreateGroceryList();
            }}
            disabled={selectedMeals.size === 0}
            label={t('mealPlan.createGroceryList', {
              count: selectedMeals.size,
            })}
          />
        </View>
      }
    >
      <GroceryWeekSelector
        weekDates={groceryWeekDates}
        language={language}
        onPreviousWeek={onPreviousWeek}
        onNextWeek={onNextWeek}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {groceryWeekDates.map((date) => {
          const hasAnyMeal = mealTypes.some((mt) => {
            const meal = getMealForSlot(date, mt.type);
            return meal?.recipe || meal?.customText;
          });
          if (!hasAnyMeal) return null;

          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <View key={date.toISOString()} style={{ marginBottom: spacing.lg }}>
              <Text
                style={{
                  fontSize: fontSize['lg-xl'],
                  fontFamily: fonts.bodySemibold,
                  color: isToday
                    ? colors.content.heading
                    : colors.content.tertiary,
                  marginBottom: spacing['sm-md'],
                }}
              >
                {formatDayHeader(date, language, t('mealPlan.today'))}
              </Text>
              {mealTypes.map(({ type, label }) => {
                const meal = getMealForSlot(date, type);
                if (!meal?.recipe && !meal?.customText) return null;

                const title = meal?.recipe?.title || meal?.customText || '';
                const recipeServings = meal?.recipe?.servings;
                const dateStr = formatDateLocal(date);
                const key = `${dateStr}_${type}`;
                const isSelected = selectedMeals.has(key);
                const currentServings =
                  mealServings[key] || recipeServings || 2;

                return (
                  <GroceryMealItem
                    key={type}
                    title={title}
                    label={label}
                    isSelected={isSelected}
                    currentServings={currentServings}
                    mealKey={key}
                    onToggle={() =>
                      onToggleMeal(date, type, recipeServings ?? undefined)
                    }
                    onChangeServings={onChangeServings}
                  />
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </BottomSheetModal>
  );
};

interface GroceryWeekSelectorProps {
  weekDates: Date[];
  language: string;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

const GroceryWeekSelector = ({
  weekDates,
  language,
  onPreviousWeek,
  onNextWeek,
}: GroceryWeekSelectorProps) => {
  const { colors, fonts, borderRadius, circleStyle } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
        gap: spacing.sm,
      }}
    >
      <Button
        variant="icon"
        onPress={onPreviousWeek}
        icon="chevron-back"
        iconSize={20}
        textColor={colors.content.body}
        color={colors.button.primarySubtle}
        style={circleStyle(iconContainer.xs)}
      />
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing['sm-md'],
          backgroundColor: colors.button.primarySubtle,
          borderRadius: borderRadius['md-lg'],
        }}
      >
        <Text
          style={{
            fontSize: fontSize.lg,
            fontFamily: fonts.bodySemibold,
            color: colors.content.heading,
            textAlign: 'center',
          }}
        >
          {formatWeekRange(weekDates, language)}
        </Text>
      </View>
      <Button
        variant="icon"
        onPress={onNextWeek}
        icon="chevron-forward"
        iconSize={20}
        textColor={colors.content.body}
        color={colors.button.primarySubtle}
        style={circleStyle(iconContainer.xs)}
      />
    </View>
  );
};

interface GroceryMealItemProps {
  title: string;
  label: string;
  isSelected: boolean;
  currentServings: number;
  mealKey: string;
  onToggle: () => void;
  onChangeServings: (key: string, delta: number) => void;
}

const GroceryMealItem = ({
  title,
  label,
  isSelected,
  currentServings,
  mealKey,
  onToggle,
  onChangeServings,
}: GroceryMealItemProps) => {
  const { colors, fonts, borderRadius, circleStyle } = useTheme();
  return (
    <View
      style={{
        backgroundColor: isSelected
          ? colors.ai.selectedBg
          : colors.surface.subtle,
        borderRadius: borderRadius['md-lg'],
        padding: spacing['md-lg'],
        marginBottom: spacing.sm,
        borderWidth: isSelected ? 1 : 0,
        borderColor: colors.ai.border,
      }}
    >
      <Pressable
        onPress={onToggle}
        style={{ flexDirection: 'row', alignItems: 'center' }}
      >
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: borderRadius.xs,
            borderWidth: 2,
            borderColor: isSelected
              ? colors.ai.primary
              : colors.surface.borderLight,
            backgroundColor: isSelected ? colors.ai.primary : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing['md-lg'],
          }}
        >
          {isSelected && (
            <Ionicons name="checkmark" size={16} color={colors.white} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: fontSize.xl,
              fontFamily: fonts.bodySemibold,
              color: colors.content.heading,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: fontSize.md,
              fontFamily: fonts.body,
              color: colors.content.subtitle,
              marginTop: spacing['2xs'],
            }}
          >
            {label}
          </Text>
        </View>
      </Pressable>

      {isSelected && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: spacing.md,
            marginLeft: spacing['4xl'],
            backgroundColor: colors.button.primarySurface,
            borderRadius: borderRadius.sm,
            padding: spacing['xs-sm'],
            alignSelf: 'flex-start',
          }}
        >
          <Button
            variant="icon"
            onPress={() => onChangeServings(mealKey, -1)}
            icon="remove"
            iconSize={18}
            textColor={colors.content.body}
            color={colors.glass.medium}
            style={circleStyle(iconContainer.sm)}
          />
          <View
            style={{
              paddingHorizontal: spacing['md-lg'],
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <Ionicons
              name="restaurant-outline"
              size={fontSize.xl}
              color={colors.content.body}
            />
            <Text
              style={{
                fontSize: fontSize.xl,
                fontFamily: fonts.bodySemibold,
                color: colors.content.heading,
              }}
            >
              {currentServings}
            </Text>
          </View>
          <Button
            variant="icon"
            onPress={() => onChangeServings(mealKey, 1)}
            icon="add"
            iconSize={18}
            textColor={colors.content.body}
            color={colors.glass.medium}
            style={circleStyle(iconContainer.sm)}
          />
        </View>
      )}
    </View>
  );
};
