/**
 * Meal Plan screen - Weekly menu with vertical scrolling list.
 * Mobile-first design with meals grouped by day.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/components';
import { useMealPlan, useRecipes } from '@/lib/hooks';
import type { MealType, Recipe } from '@/lib/types';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=200';

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekDates(weekOffset: number = 0): Date[] {
  const today = new Date();
  const currentDay = today.getDay();
  // Start week on Monday
  const daysSinceMonday = (currentDay + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday + weekOffset * 7);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function formatWeekRange(dates: Date[]): string {
  const first = dates[0];
  const last = dates[6];
  return `${first.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} - ${last.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
}

function formatDayHeader(date: Date): string {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (isToday) return `Today · ${monthDay}`;
  return `${dayName} · ${monthDay}`;
}

// Meal type config
const MEAL_TYPES: { type: MealType; label: string }[] = [
  { type: 'lunch', label: 'Lunch' },
  { type: 'dinner', label: 'Dinner' },
];

export default function MealPlanScreen() {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [selectedMeals, setSelectedMeals] = useState<Set<string>>(new Set());

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const {
    data: mealPlan,
    isLoading: mealPlanLoading,
    refetch: refetchMealPlan,
  } = useMealPlan();
  const { data: recipes = [] } = useRecipes();

  // Create a map of recipe IDs to recipes
  const recipeMap = useMemo(() => {
    const map: Record<string, Recipe> = {};
    for (const recipe of recipes) {
      map[recipe.id] = recipe;
    }
    return map;
  }, [recipes]);

  // Get meal data for a specific date and meal type
  const getMealForSlot = (date: Date, mealType: MealType): { recipe?: Recipe; customText?: string } | null => {
    if (!mealPlan || !mealPlan.meals) return null;

    const dateStr = formatDateLocal(date);
    const key = `${dateStr}_${mealType}`;
    const value = mealPlan.meals[key];

    if (!value) return null;

    if (value.startsWith('custom:')) {
      return { customText: value.slice(7) };
    }

    const recipe = recipeMap[value];
    return recipe ? { recipe } : { customText: value };
  };

  const handleMealPress = (date: Date, mealType: MealType) => {
    const dateStr = formatDateLocal(date);
    router.push({
      pathname: '/select-recipe',
      params: { date: dateStr, mealType },
    });
  };

  const handleToggleMeal = (date: Date, mealType: MealType) => {
    const dateStr = formatDateLocal(date);
    const key = `${dateStr}_${mealType}`;
    setSelectedMeals((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleCreateGroceryList = async () => {
    if (selectedMeals.size === 0) {
      Alert.alert('No meals selected', 'Please select at least one meal to create a grocery list.');
      return;
    }

    // Save selected meals to AsyncStorage
    try {
      const mealsArray = Array.from(selectedMeals);
      console.log('[MealPlan] Saving meals to storage:', mealsArray);
      await AsyncStorage.setItem('grocery_selected_meals', JSON.stringify(mealsArray));
      console.log('[MealPlan] Saved successfully, navigating...');

      setShowGroceryModal(false);

      // Small delay to ensure storage is written
      setTimeout(() => {
        router.push('/(tabs)/grocery');
      }, 100);
    } catch (error) {
      console.error('[MealPlan] Error saving:', error);
      Alert.alert('Error', 'Failed to save selections');
    }
  };

  return (
    <GradientBackground>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 50, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#4A3728' }}>Weekly Menu</Text>
            <Pressable
              onPress={() => setShowGroceryModal(true)}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#4A3728', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}
            >
              <Ionicons name="cart" size={16} color="#fff" />
              <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '600', color: '#fff' }}>Create List</Text>
            </Pressable>
          </View>
        </View>

        {/* Week selector */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fff',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <Pressable
              onPress={() => setWeekOffset((prev) => prev - 1)}
              style={{ padding: 4 }}
            >
              <Ionicons name="chevron-back" size={20} color="#4A3728" />
            </Pressable>

            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728' }}>
                {formatWeekRange(weekDates)}
              </Text>
              {weekOffset !== 0 && (
                <Pressable onPress={() => setWeekOffset(0)}>
                  <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Back to today</Text>
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={() => setWeekOffset((prev) => prev + 1)}
              style={{ padding: 4 }}
            >
              <Ionicons name="chevron-forward" size={20} color="#4A3728" />
            </Pressable>
          </View>
        </View>

        {/* Meal list */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={mealPlanLoading}
              onRefresh={() => refetchMealPlan()}
              tintColor="#4A3728"
            />
          }
        >
          {weekDates.map((date) => {
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <View key={date.toISOString()} style={{ marginBottom: 24 }}>
                {/* Day header */}
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: isToday ? '#4A3728' : '#6b7280',
                  marginBottom: 12,
                }}>
                  {formatDayHeader(date)}
                </Text>

                {/* Meals for this day */}
                {MEAL_TYPES.map(({ type, label }) => {
                  const meal = getMealForSlot(date, type);
                  const hasContent = meal !== null;
                  const title = meal?.recipe?.title || meal?.customText;
                  const imageUrl = meal?.recipe?.image_url || PLACEHOLDER_IMAGE;

                  return (
                    <Pressable
                      key={`${date.toISOString()}-${type}`}
                      onPress={() => handleMealPress(date, type)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        borderRadius: 16,
                        padding: 12,
                        marginBottom: 8,
                      }}
                    >
                      {/* Image */}
                      <Image
                        source={{ uri: hasContent ? imageUrl : PLACEHOLDER_IMAGE }}
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 12,
                          backgroundColor: '#E8D5C4',
                          opacity: hasContent ? 1 : 0.4,
                        }}
                        resizeMode="cover"
                      />

                      {/* Content */}
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: hasContent ? '#4A3728' : '#9ca3af',
                        }}>
                          {title || `Add ${label}`}
                        </Text>
                        <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>
                          {label}
                        </Text>
                      </View>

                      {/* Checkmark or add icon */}
                      {hasContent ? (
                        <View style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: '#E8D5C4',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Ionicons name="checkmark" size={18} color="#4A3728" />
                        </View>
                      ) : (
                        <Ionicons name="add-circle-outline" size={24} color="#9ca3af" />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>

        {/* Grocery list selection modal */}
        <Modal
          visible={showGroceryModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowGroceryModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#F5E6D3', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' }}>
              {/* Modal header */}
              <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#4A3728' }}>Select Meals</Text>
                  <Pressable onPress={() => setShowGroceryModal(false)}>
                    <Ionicons name="close" size={24} color="#4A3728" />
                  </Pressable>
                </View>
                <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                  Choose which meals to include in your grocery list
                </Text>
              </View>

              {/* Meal list */}
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
                {weekDates.map((date) => {
                  const hasAnyMeal = MEAL_TYPES.some((mt) => {
                    const meal = getMealForSlot(date, mt.type);
                    return meal?.recipe || meal?.customText;
                  });

                  if (!hasAnyMeal) return null;

                  return (
                    <View key={date.toISOString()} style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728', marginBottom: 8 }}>
                        {formatDayHeader(date)}
                      </Text>
                      {MEAL_TYPES.map(({ type, label }) => {
                        const meal = getMealForSlot(date, type);
                        const hasContent = meal?.recipe || meal?.customText;
                        if (!hasContent) return null;

                        const title = meal?.recipe?.title || meal?.customText || '';
                        const dateStr = formatDateLocal(date);
                        const key = `${dateStr}_${type}`;
                        const isSelected = selectedMeals.has(key);

                        return (
                          <Pressable
                            key={type}
                            onPress={() => handleToggleMeal(date, type)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: '#fff',
                              borderRadius: 12,
                              padding: 12,
                              marginBottom: 8,
                            }}
                          >
                            {/* Checkbox */}
                            <View
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 6,
                                borderWidth: 2,
                                borderColor: isSelected ? '#4A3728' : '#e5e7eb',
                                backgroundColor: isSelected ? '#4A3728' : '#fff',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 12,
                              }}
                            >
                              {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: '#4A3728' }}>{title}</Text>
                              <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{label}</Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  );
                })}
              </ScrollView>

              {/* Modal footer */}
              <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
                <Pressable
                  onPress={handleCreateGroceryList}
                  style={{
                    backgroundColor: selectedMeals.size > 0 ? '#4A3728' : '#E8D5C4',
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                  disabled={selectedMeals.size === 0}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                    Create Grocery List ({selectedMeals.size} meals)
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </GradientBackground>
  );
}
