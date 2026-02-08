import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontFamily } from '@/lib/theme';
import { hapticSuccess } from '@/lib/haptics';
import { BottomSheetModal } from '@/components';
import { formatDateLocal, formatWeekRange, formatDayHeader } from '@/lib/utils/dateFormatter';
import type { MealType, Recipe } from '@/lib/types';
import type { MealTypeOption } from './meal-plan-constants';
import type { TFunction } from '@/lib/i18n';

interface GrocerySelectionModalProps {
  visible: boolean;
  groceryWeekDates: Date[];
  language: string;
  t: TFunction;
  mealTypes: MealTypeOption[];
  selectedMeals: Set<string>;
  mealServings: Record<string, number>;
  getMealForSlot: (date: Date, mealType: MealType) => { recipe?: Recipe; customText?: string } | null;
  onClose: () => void;
  onCreateGroceryList: () => void;
  onToggleMeal: (date: Date, mealType: MealType, recipeServings?: number) => void;
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
    backgroundColor="#F5E6D3"
    scrollable={false}
    footer={
      <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
        <Pressable
          onPress={() => { hapticSuccess(); onCreateGroceryList(); }}
          style={{
            backgroundColor: selectedMeals.size > 0 ? '#4A3728' : '#E8D5C4',
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
          }}
          disabled={selectedMeals.size === 0}
        >
          <Text style={{ fontSize: 16, fontFamily: fontFamily.bodySemibold, color: '#fff' }}>
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

    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
      {groceryWeekDates.map(date => {
        const hasAnyMeal = mealTypes.some(mt => {
          const meal = getMealForSlot(date, mt.type);
          return meal?.recipe || meal?.customText;
        });
        if (!hasAnyMeal) return null;

        return (
          <View key={date.toISOString()} style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 15, fontFamily: fontFamily.bodySemibold, color: '#4A3728', marginBottom: 8 }}>
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
                  onToggle={() => onToggleMeal(date, type, recipeServings ?? undefined)}
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

const GroceryWeekSelector = ({ weekDates, language, onPreviousWeek, onNextWeek }: GroceryWeekSelectorProps) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 8 }}>
    <Pressable
      onPress={onPreviousWeek}
      style={({ pressed }) => ({
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: pressed ? '#E8D5C4' : 'rgba(255, 255, 255, 0.8)',
        alignItems: 'center', justifyContent: 'center',
      })}
    >
      <Ionicons name="chevron-back" size={18} color="#4A3728" />
    </Pressable>
    <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 12 }}>
      <Text style={{ fontSize: 13, fontFamily: fontFamily.bodySemibold, color: '#4A3728', textAlign: 'center' }}>
        {formatWeekRange(weekDates, language)}
      </Text>
    </View>
    <Pressable
      onPress={onNextWeek}
      style={({ pressed }) => ({
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: pressed ? '#E8D5C4' : 'rgba(255, 255, 255, 0.8)',
        alignItems: 'center', justifyContent: 'center',
      })}
    >
      <Ionicons name="chevron-forward" size={18} color="#4A3728" />
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
  <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8 }}>
    <Pressable onPress={onToggle} style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{
        width: 24, height: 24, borderRadius: 6, borderWidth: 2,
        borderColor: isSelected ? '#4A3728' : '#e5e7eb',
        backgroundColor: isSelected ? '#4A3728' : '#fff',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
      }}>
        {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontFamily: fontFamily.bodySemibold, color: '#4A3728' }}>{title}</Text>
        <Text style={{ fontSize: 12, fontFamily: fontFamily.body, color: '#9ca3af', marginTop: 2 }}>{label}</Text>
      </View>
    </Pressable>

    {isSelected && (
      <View style={{
        flexDirection: 'row', alignItems: 'center', marginTop: 10, marginLeft: 36,
        backgroundColor: '#F5E6D3', borderRadius: 10, padding: 6, alignSelf: 'flex-start',
      }}>
        <Pressable
          onPress={() => onChangeServings(mealKey, -1)}
          style={({ pressed }) => ({
            width: 28, height: 28, borderRadius: 14,
            backgroundColor: pressed ? '#E8D5C4' : '#fff',
            alignItems: 'center', justifyContent: 'center',
          })}
        >
          <Ionicons name="remove" size={16} color="#4A3728" />
        </Pressable>
        <View style={{ paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="restaurant-outline" size={14} color="#4A3728" />
          <Text style={{ fontSize: 14, fontFamily: fontFamily.bodySemibold, color: '#4A3728' }}>{currentServings}</Text>
        </View>
        <Pressable
          onPress={() => onChangeServings(mealKey, 1)}
          style={({ pressed }) => ({
            width: 28, height: 28, borderRadius: 14,
            backgroundColor: pressed ? '#E8D5C4' : '#fff',
            alignItems: 'center', justifyContent: 'center',
          })}
        >
          <Ionicons name="add" size={16} color="#4A3728" />
        </Pressable>
      </View>
    )}
  </View>
);
