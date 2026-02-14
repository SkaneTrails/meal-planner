import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BottomSheetModal } from '@/components';
import { hapticSuccess } from '@/lib/haptics';
import type { TFunction } from '@/lib/i18n';
import { fontFamily } from '@/lib/theme';
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
}: GrocerySelectionModalProps) => (
  <BottomSheetModal
    visible={visible}
    onClose={onClose}
    title={t('mealPlan.selectMeals')}
    subtitle={t('mealPlan.selectMealsSubtitle')}
    scrollable={false}
    footer={
      <View
        style={{
          padding: 20,
          borderTopWidth: 1,
          borderTopColor: 'rgba(0, 0, 0, 0.06)',
        }}
      >
        <Pressable
          onPress={() => {
            hapticSuccess();
            onCreateGroceryList();
          }}
          style={({ pressed }) => ({
            backgroundColor:
              selectedMeals.size > 0
                ? pressed
                  ? '#5D4E40'
                  : '#7A6858'
                : 'rgba(122, 104, 88, 0.2)',
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
          })}
          disabled={selectedMeals.size === 0}
        >
          <Text
            style={{
              fontSize: 17,
              fontFamily: fontFamily.bodySemibold,
              color: selectedMeals.size > 0 ? '#fff' : 'rgba(93, 78, 64, 0.5)',
            }}
          >
            {t('mealPlan.createGroceryList', { count: selectedMeals.size })}
          </Text>
        </Pressable>
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
      contentContainerStyle={{ padding: 20 }}
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
          <View key={date.toISOString()} style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: fontFamily.bodySemibold,
                color: isToday ? '#3D3D3D' : 'rgba(93, 78, 64, 0.7)',
                marginBottom: 10,
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
              const currentServings = mealServings[key] || recipeServings || 2;

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
}: GroceryWeekSelectorProps) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      gap: 8,
    }}
  >
    <Pressable
      onPress={onPreviousWeek}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: pressed
          ? 'rgba(122, 104, 88, 0.15)'
          : 'rgba(122, 104, 88, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Ionicons name="chevron-back" size={20} color="#5D4E40" />
    </Pressable>
    <View
      style={{
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(122, 104, 88, 0.08)',
        borderRadius: 14,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontFamily: fontFamily.bodySemibold,
          color: '#3D3D3D',
          textAlign: 'center',
        }}
      >
        {formatWeekRange(weekDates, language)}
      </Text>
    </View>
    <Pressable
      onPress={onNextWeek}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: pressed
          ? 'rgba(122, 104, 88, 0.15)'
          : 'rgba(122, 104, 88, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Ionicons name="chevron-forward" size={20} color="#5D4E40" />
    </Pressable>
  </View>
);

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
}: GroceryMealItemProps) => (
  <View
    style={{
      backgroundColor: isSelected
        ? 'rgba(107, 142, 107, 0.1)'
        : 'rgba(0, 0, 0, 0.02)',
      borderRadius: 14,
      padding: 14,
      marginBottom: 8,
      borderWidth: isSelected ? 1 : 0,
      borderColor: 'rgba(107, 142, 107, 0.3)',
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
          borderRadius: 8,
          borderWidth: 2,
          borderColor: isSelected ? '#6B8E6B' : 'rgba(93, 78, 64, 0.25)',
          backgroundColor: isSelected ? '#6B8E6B' : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}
      >
        {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontFamily: fontFamily.bodySemibold,
            color: '#3D3D3D',
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontFamily: fontFamily.body,
            color: 'rgba(93, 78, 64, 0.6)',
            marginTop: 2,
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
          marginTop: 12,
          marginLeft: 40,
          backgroundColor: 'rgba(122, 104, 88, 0.1)',
          borderRadius: 12,
          padding: 6,
          alignSelf: 'flex-start',
        }}
      >
        <Pressable
          onPress={() => onChangeServings(mealKey, -1)}
          style={({ pressed }) => ({
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: pressed
              ? 'rgba(122, 104, 88, 0.2)'
              : 'rgba(255, 255, 255, 0.8)',
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Ionicons name="remove" size={18} color="#5D4E40" />
        </Pressable>
        <View
          style={{
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Ionicons name="restaurant-outline" size={15} color="#5D4E40" />
          <Text
            style={{
              fontSize: 15,
              fontFamily: fontFamily.bodySemibold,
              color: '#3D3D3D',
            }}
          >
            {currentServings}
          </Text>
        </View>
        <Pressable
          onPress={() => onChangeServings(mealKey, 1)}
          style={({ pressed }) => ({
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: pressed
              ? 'rgba(122, 104, 88, 0.2)'
              : 'rgba(255, 255, 255, 0.8)',
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Ionicons name="add" size={18} color="#5D4E40" />
        </Pressable>
      </View>
    )}
  </View>
);
