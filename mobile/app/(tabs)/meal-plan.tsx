/**
 * Meal Plan screen - Weekly menu with vertical scrolling list.
 * Mobile-first design with meals grouped by day.
 */

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  PanResponder,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GradientBackground } from '@/components';
import { hapticLight, hapticSelection, hapticSuccess } from '@/lib/haptics';
import {
  useEnhancedMode,
  useMealPlan,
  useRecipes,
  useRemoveMeal,
  useSetMeal,
  useUpdateNote,
} from '@/lib/hooks';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  letterSpacing,
  spacing,
} from '@/lib/theme';
import type { MealType, Recipe } from '@/lib/types';

// Quick note suggestions
const NOTE_SUGGESTIONS = [
  '🏢 Office',
  '🏠 Home',
  '🏃 Gym',
  '🍽️ Dinner out',
  '✈️ Travel',
  '🎉 Party',
];

// Cross-platform confirm dialog
const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=200';

// Approximate height of each day section (header + 2 meal cards)
const DAY_SECTION_HEIGHT = 180;

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
  const monthDay = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

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
  const [mealServings, setMealServings] = useState<Record<string, number>>({}); // key -> servings
  const [showJumpButton, setShowJumpButton] = useState(false);
  const [editingNoteDate, setEditingNoteDate] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const jumpButtonOpacity = useRef(new Animated.Value(0)).current;

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  // Find today's index in the week
  const todayIndex = useMemo(() => {
    const today = new Date();
    return weekDates.findIndex(
      (date) => date.toDateString() === today.toDateString(),
    );
  }, [weekDates]);

  // Handle scroll to show/hide jump button
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (todayIndex < 0) return; // Today not in current week

    const scrollY = event.nativeEvent.contentOffset.y;
    const todayPosition = todayIndex * DAY_SECTION_HEIGHT;
    const tolerance = DAY_SECTION_HEIGHT / 2; // Half a day section

    const isNearToday = Math.abs(scrollY - todayPosition) < tolerance;

    if (!isNearToday && !showJumpButton) {
      setShowJumpButton(true);
      Animated.spring(jumpButtonOpacity, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else if (isNearToday && showJumpButton) {
      Animated.timing(jumpButtonOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowJumpButton(false));
    }
  };

  // Jump to today function
  const jumpToToday = () => {
    if (weekOffset !== 0) {
      // If not in current week, go back to current week first
      setWeekOffset(0);
    } else if (todayIndex >= 0 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: todayIndex * DAY_SECTION_HEIGHT,
        animated: true,
      });
    }
  };

  // Scroll to today when component mounts or week changes
  useEffect(() => {
    if (todayIndex >= 0 && scrollViewRef.current) {
      // Small delay to ensure layout is complete
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: todayIndex * DAY_SECTION_HEIGHT,
          animated: false,
        });
      }, 100);
    }
  }, [todayIndex, weekOffset]);

  // Swipe gesture for week navigation
  // Note: PanResponder only captures gestures when conditions are met,
  // allowing ScrollView's vertical scrolling to work normally.
  const swipeThreshold = 50; // Minimum horizontal distance to trigger week change
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // Only respond to horizontal swipes (not vertical scrolling)
          // Requires: horizontal movement > 2x vertical (to distinguish from scroll)
          // AND horizontal movement > 10px (to filter out small accidental movements)
          const isHorizontalSwipe =
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
          const hasMinimumMovement = Math.abs(gestureState.dx) > 10;
          return isHorizontalSwipe && hasMinimumMovement;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > swipeThreshold) {
            // Swipe right -> go to previous week
            hapticLight();
            setWeekOffset((prev) => prev - 1);
          } else if (gestureState.dx < -swipeThreshold) {
            // Swipe left -> go to next week
            hapticLight();
            setWeekOffset((prev) => prev + 1);
          }
        },
      }),
    [],
  );

  const {
    data: mealPlan,
    isLoading: mealPlanLoading,
    refetch: refetchMealPlan,
  } = useMealPlan();
  const { isEnhanced } = useEnhancedMode();
  const { data: recipes = [] } = useRecipes(undefined, isEnhanced);
  const setMeal = useSetMeal();
  const updateNote = useUpdateNote();
  const removeMeal = useRemoveMeal();

  // Get note for a specific date
  const getNoteForDate = (date: Date): string | null => {
    if (!mealPlan || !mealPlan.notes) return null;
    const dateStr = formatDateLocal(date);
    return mealPlan.notes[dateStr] || null;
  };

  // Handle note editing
  const handleStartEditNote = (date: Date) => {
    const dateStr = formatDateLocal(date);
    setEditingNoteDate(dateStr);
    setNoteText(getNoteForDate(date) || '');
  };

  const handleSaveNote = () => {
    if (editingNoteDate) {
      updateNote.mutate({ date: editingNoteDate, note: noteText.trim() });
      setEditingNoteDate(null);
      setNoteText('');
    }
  };

  const handleAddTag = (tag: string) => {
    const currentTags = noteText.split(' ').filter((t) => t.trim());
    if (currentTags.includes(tag)) {
      // Remove tag if already present
      setNoteText(currentTags.filter((t) => t !== tag).join(' '));
    } else {
      // Add tag
      setNoteText([...currentTags, tag].join(' '));
    }
  };

  // Create a map of recipe IDs to recipes
  const recipeMap = useMemo(() => {
    const map: Record<string, Recipe> = {};
    for (const recipe of recipes) {
      map[recipe.id] = recipe;
    }
    return map;
  }, [recipes]);

  // Get meal data for a specific date and meal type
  const getMealForSlot = (
    date: Date,
    mealType: MealType,
  ): { recipe?: Recipe; customText?: string } | null => {
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

  const handleMealPress = (
    date: Date,
    mealType: MealType,
    mode?: 'library' | 'copy' | 'quick' | 'random',
  ) => {
    const dateStr = formatDateLocal(date);

    if (mode === 'quick') {
      // Navigate to select-recipe with quick mode
      router.push({
        pathname: '/select-recipe',
        params: { date: dateStr, mealType, mode: 'quick' },
      });
      return;
    }

    router.push({
      pathname: '/select-recipe',
      params: { date: dateStr, mealType, mode: mode || 'library' },
    });
  };

  const handleToggleMeal = (
    date: Date,
    mealType: MealType,
    recipeServings?: number,
  ) => {
    const dateStr = formatDateLocal(date);
    const key = `${dateStr}_${mealType}`;
    setSelectedMeals((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
        // Also remove servings when deselected
        setMealServings((prevServings) => {
          const newServings = { ...prevServings };
          delete newServings[key];
          return newServings;
        });
      } else {
        newSet.add(key);
        // Set default servings (recipe servings or 2)
        setMealServings((prevServings) => ({
          ...prevServings,
          [key]: recipeServings || 2,
        }));
      }
      return newSet;
    });
  };

  const handleChangeServings = (key: string, delta: number) => {
    setMealServings((prev) => {
      const current = prev[key] || 2;
      const newValue = Math.max(1, Math.min(12, current + delta));
      return { ...prev, [key]: newValue };
    });
  };

  const handleCreateGroceryList = async () => {
    if (selectedMeals.size === 0) {
      Alert.alert(
        'No meals selected',
        'Please select at least one meal to create a grocery list.',
      );
      return;
    }

    // Save selected meals and servings to AsyncStorage
    try {
      const mealsArray = Array.from(selectedMeals);
      console.log('[MealPlan] Saving meals to storage:', mealsArray);
      console.log('[MealPlan] Saving servings:', mealServings);
      await AsyncStorage.setItem(
        'grocery_selected_meals',
        JSON.stringify(mealsArray),
      );
      await AsyncStorage.setItem(
        'grocery_meal_servings',
        JSON.stringify(mealServings),
      );
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
      <View style={{ flex: 1, paddingBottom: 100 }}>
        {/* Header */}
        <View
          style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12 }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: fontSize['4xl'],
                  fontWeight: '600',
                  color: colors.text.primary,
                  letterSpacing: letterSpacing.tight,
                }}
              >
                Weekly Menu
              </Text>
              <Text
                style={{
                  fontSize: fontSize.lg,
                  color: colors.text.secondary,
                  marginTop: 4,
                }}
              >
                Plan your meals ahead
              </Text>
            </View>
            <Pressable
              onPress={() => {
                hapticLight();
                setShowGroceryModal(true);
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: pressed ? '#6A5848' : '#7A6858',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: borderRadius.lg,
              })}
            >
              <Ionicons name="cart-outline" size={16} color={colors.white} />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: fontSize.md,
                  fontWeight: fontWeight.semibold,
                  color: colors.white,
                }}
              >
                Create List
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Week selector */}
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
            <Pressable
              onPress={() => {
                hapticLight();
                setWeekOffset((prev) => prev - 1);
              }}
              style={({ pressed }) => ({
                padding: 6,
                backgroundColor: pressed ? colors.gray[100] : 'transparent',
                borderRadius: borderRadius.sm,
              })}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={colors.text.primary}
              />
            </Pressable>

            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: fontSize.lg,
                  fontWeight: fontWeight.semibold,
                  color: colors.text.primary,
                }}
              >
                {formatWeekRange(weekDates)}
              </Text>
              {weekOffset !== 0 && (
                <Pressable
                  onPress={() => {
                    hapticLight();
                    setWeekOffset(0);
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSize.sm,
                      color: colors.accent,
                      marginTop: 4,
                      fontWeight: fontWeight.medium,
                    }}
                  >
                    Back to today
                  </Text>
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={() => {
                hapticLight();
                setWeekOffset((prev) => prev + 1);
              }}
              style={({ pressed }) => ({
                padding: 6,
                backgroundColor: pressed ? colors.gray[100] : 'transparent',
                borderRadius: borderRadius.sm,
              })}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.primary}
              />
            </Pressable>
          </View>
        </View>

        {/* Meal list with swipe gesture for week navigation */}
        <View style={{ flex: 1 }} {...panResponder.panHandlers}>
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 100,
            }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={mealPlanLoading}
                onRefresh={() => refetchMealPlan()}
                tintColor={colors.accent}
              />
            }
          >
            {weekDates.map((date) => {
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <View key={date.toISOString()} style={{ marginBottom: 24 }}>
                  {/* Day header with note */}
                  {(() => {
                    const dateStr = formatDateLocal(date);
                    const note = getNoteForDate(date);
                    const isEditing = editingNoteDate === dateStr;

                    return (
                      <>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: isEditing ? 8 : 12,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                            }}
                          >
                            {isToday && (
                              <View
                                style={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                  paddingHorizontal: 10,
                                  paddingVertical: 4,
                                  borderRadius: 8,
                                  marginRight: 10,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 12,
                                    fontWeight: '700',
                                    color: colors.white,
                                  }}
                                >
                                  TODAY
                                </Text>
                              </View>
                            )}
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: isToday
                                  ? colors.text.primary
                                  : colors.text.secondary,
                                letterSpacing: -0.2,
                              }}
                            >
                              {formatDayHeader(date)}
                            </Text>
                          </View>

                          {/* Note pill on right side */}
                          {!isEditing && (
                            <Pressable
                              onPress={() => handleStartEditNote(date)}
                            >
                              {note ? (
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 12,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 12,
                                      color: colors.white,
                                    }}
                                  >
                                    {note}
                                  </Text>
                                </View>
                              ) : (
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor:
                                      'rgba(255, 255, 255, 0.15)',
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 12,
                                  }}
                                >
                                  <Ionicons
                                    name="add"
                                    size={12}
                                    color={colors.text.secondary}
                                  />
                                  <Text
                                    style={{
                                      fontSize: 12,
                                      color: colors.text.secondary,
                                      marginLeft: 2,
                                    }}
                                  >
                                    note
                                  </Text>
                                </View>
                              )}
                            </Pressable>
                          )}
                        </View>

                        {/* Note editor (below header when editing) */}
                        {isEditing && (
                          <View style={{ marginBottom: 12 }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#f9f5f0',
                                borderRadius: 12,
                                padding: 10,
                                gap: 8,
                              }}
                            >
                              <TextInput
                                value={noteText}
                                onChangeText={setNoteText}
                                placeholder="Add a note..."
                                style={{
                                  flex: 1,
                                  fontSize: 14,
                                  color: '#4A3728',
                                  padding: 0,
                                }}
                                autoFocus
                              />
                              <Pressable onPress={handleSaveNote}>
                                <Text
                                  style={{
                                    fontSize: 14,
                                    fontWeight: '600',
                                    color: '#4A3728',
                                  }}
                                >
                                  Save
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={() => {
                                  setEditingNoteDate(null);
                                  setNoteText('');
                                }}
                              >
                                <Text
                                  style={{ fontSize: 14, color: '#9ca3af' }}
                                >
                                  Cancel
                                </Text>
                              </Pressable>
                            </View>
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              style={{ marginTop: 8 }}
                            >
                              <View style={{ flexDirection: 'row', gap: 6 }}>
                                {NOTE_SUGGESTIONS.map((suggestion) => (
                                  <Pressable
                                    key={suggestion}
                                    onPress={() => handleAddTag(suggestion)}
                                    style={{
                                      backgroundColor: noteText.includes(
                                        suggestion,
                                      )
                                        ? '#e8dfd4'
                                        : '#fff',
                                      paddingHorizontal: 12,
                                      paddingVertical: 6,
                                      borderRadius: 16,
                                      borderWidth: 1,
                                      borderColor: noteText.includes(suggestion)
                                        ? '#4A3728'
                                        : '#e5e7eb',
                                    }}
                                  >
                                    <Text
                                      style={{ fontSize: 13, color: '#4A3728' }}
                                    >
                                      {suggestion}
                                    </Text>
                                  </Pressable>
                                ))}
                              </View>
                            </ScrollView>
                          </View>
                        )}
                      </>
                    );
                  })()}

                  {/* Meals for this day */}
                  {MEAL_TYPES.map(({ type, label }) => {
                    const meal = getMealForSlot(date, type);
                    const hasContent = meal !== null;
                    const title = meal?.recipe?.title || meal?.customText;
                    const imageUrl =
                      meal?.recipe?.image_url || PLACEHOLDER_IMAGE;

                    // Empty meal slot - show action buttons with glass effect
                    if (!hasContent) {
                      return (
                        <View
                          key={`${date.toISOString()}-${type}`}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.35)',
                            borderRadius: 16,
                            padding: 12,
                            marginBottom: 8,
                          }}
                        >
                          {/* Plus icon + Meal type label */}
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              marginRight: 12,
                            }}
                          >
                            <View
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 8,
                              }}
                            >
                              <Ionicons
                                name="add"
                                size={18}
                                color={colors.white}
                              />
                            </View>
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: colors.text.secondary,
                              }}
                            >
                              {label}
                            </Text>
                          </View>

                          {/* Action buttons in 2x2 grid */}
                          <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                gap: 6,
                                marginBottom: 6,
                              }}
                            >
                              <Pressable
                                onPress={() =>
                                  handleMealPress(date, type, 'library')
                                }
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                                  paddingHorizontal: 10,
                                  paddingVertical: 6,
                                  borderRadius: 10,
                                  gap: 4,
                                  minWidth: 75,
                                  justifyContent: 'center',
                                }}
                              >
                                <Ionicons
                                  name="book-outline"
                                  size={14}
                                  color="#5D4E40"
                                />
                                <Text
                                  style={{
                                    fontSize: 12,
                                    fontWeight: '600',
                                    color: '#5D4E40',
                                  }}
                                >
                                  Library
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={() =>
                                  handleMealPress(date, type, 'random')
                                }
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  backgroundColor: 'rgba(220, 215, 210, 0.9)',
                                  paddingHorizontal: 10,
                                  paddingVertical: 6,
                                  borderRadius: 10,
                                  gap: 4,
                                  minWidth: 75,
                                  justifyContent: 'center',
                                }}
                              >
                                <Ionicons
                                  name="dice-outline"
                                  size={14}
                                  color="#5D4E40"
                                />
                                <Text
                                  style={{
                                    fontSize: 12,
                                    fontWeight: '600',
                                    color: '#5D4E40',
                                  }}
                                >
                                  Random
                                </Text>
                              </Pressable>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                              <Pressable
                                onPress={() =>
                                  handleMealPress(date, type, 'copy')
                                }
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  backgroundColor: 'rgba(160, 150, 140, 0.85)',
                                  paddingHorizontal: 10,
                                  paddingVertical: 6,
                                  borderRadius: 10,
                                  gap: 4,
                                  minWidth: 75,
                                  justifyContent: 'center',
                                }}
                              >
                                <Ionicons
                                  name="copy-outline"
                                  size={14}
                                  color="#FFFFFF"
                                />
                                <Text
                                  style={{
                                    fontSize: 12,
                                    fontWeight: '600',
                                    color: '#FFFFFF',
                                  }}
                                >
                                  Copy
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={() =>
                                  handleMealPress(date, type, 'quick')
                                }
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  backgroundColor: 'rgba(93, 78, 64, 0.85)',
                                  paddingHorizontal: 10,
                                  paddingVertical: 6,
                                  borderRadius: 10,
                                  gap: 4,
                                  minWidth: 75,
                                  justifyContent: 'center',
                                }}
                              >
                                <Ionicons
                                  name="create-outline"
                                  size={14}
                                  color="#FFFFFF"
                                />
                                <Text
                                  style={{
                                    fontSize: 12,
                                    fontWeight: '600',
                                    color: '#FFFFFF',
                                  }}
                                >
                                  Quick
                                </Text>
                              </Pressable>
                            </View>
                          </View>
                        </View>
                      );
                    }

                    // Meal slot with content
                    return (
                      <View
                        key={`${date.toISOString()}-${type}`}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: colors.glass.card,
                          borderRadius: borderRadius.md,
                          padding: spacing.md,
                          marginBottom: spacing.sm,
                        }}
                      >
                        {/* Tappable area for recipe details */}
                        <Pressable
                          onPress={() => handleMealPress(date, type, 'library')}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flex: 1,
                          }}
                        >
                          {/* Image */}
                          <Image
                            source={{ uri: imageUrl }}
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 12,
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            }}
                            resizeMode="cover"
                          />

                          {/* Content */}
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text
                              style={{
                                fontSize: 15,
                                fontWeight: '600',
                                color: colors.text.primary,
                              }}
                            >
                              {title}
                            </Text>
                            <Text
                              style={{
                                fontSize: 13,
                                color: colors.text.secondary,
                                marginTop: 2,
                              }}
                            >
                              {label}
                            </Text>
                          </View>
                        </Pressable>

                        {/* View button - opens recipe detail */}
                        {meal?.recipe && (
                          <Pressable
                            onPress={() =>
                              router.push(`/recipe/${meal.recipe!.id}`)
                            }
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: '#DBEAFE',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginLeft: 8,
                            }}
                          >
                            <Ionicons name="eye" size={16} color="#3B82F6" />
                          </Pressable>
                        )}
                        {/* Remove button */}
                        <Pressable
                          onPress={() => {
                            const dateStr = formatDateLocal(date);
                            showConfirm(
                              'Remove meal',
                              `Remove ${title} from ${label.toLowerCase()}?`,
                              () => {
                                removeMeal.mutate({
                                  date: dateStr,
                                  mealType: type,
                                });
                              },
                            );
                          }}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: '#FEE2E2',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: 8,
                          }}
                        >
                          <Ionicons name="close" size={18} color="#DC2626" />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Floating Jump to Today button */}
        {(showJumpButton || weekOffset !== 0) && (
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 100,
              alignSelf: 'center',
              opacity: weekOffset !== 0 ? 1 : jumpButtonOpacity,
              transform: [
                {
                  scale:
                    weekOffset !== 0
                      ? 1
                      : jumpButtonOpacity.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                },
              ],
            }}
          >
            <Pressable
              onPress={jumpToToday}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#7A6858',
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
                borderRadius: borderRadius.xl,
              }}
            >
              <Ionicons name="today" size={18} color={colors.white} />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.white,
                }}
              >
                Jump to Today
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Grocery list selection modal */}
        <Modal
          visible={showGroceryModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowGroceryModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                backgroundColor: '#F5E6D3',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: '80%',
              }}
            >
              {/* Modal header */}
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#e5e7eb',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '700',
                      color: '#4A3728',
                    }}
                  >
                    Select Meals
                  </Text>
                  <Pressable onPress={() => setShowGroceryModal(false)}>
                    <Ionicons name="close" size={24} color="#4A3728" />
                  </Pressable>
                </View>
                <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                  Choose which meals to include in your grocery list
                </Text>
              </View>

              {/* Meal list */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 20 }}
                showsVerticalScrollIndicator={false}
              >
                {weekDates.map((date) => {
                  const hasAnyMeal = MEAL_TYPES.some((mt) => {
                    const meal = getMealForSlot(date, mt.type);
                    return meal?.recipe || meal?.customText;
                  });

                  if (!hasAnyMeal) return null;

                  return (
                    <View key={date.toISOString()} style={{ marginBottom: 16 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: '#4A3728',
                          marginBottom: 8,
                        }}
                      >
                        {formatDayHeader(date)}
                      </Text>
                      {MEAL_TYPES.map(({ type, label }) => {
                        const meal = getMealForSlot(date, type);
                        const hasContent = meal?.recipe || meal?.customText;
                        if (!hasContent) return null;

                        const title =
                          meal?.recipe?.title || meal?.customText || '';
                        const recipeServings = meal?.recipe?.servings;
                        const dateStr = formatDateLocal(date);
                        const key = `${dateStr}_${type}`;
                        const isSelected = selectedMeals.has(key);
                        const currentServings =
                          mealServings[key] || recipeServings || 2;

                        return (
                          <View
                            key={type}
                            style={{
                              backgroundColor: '#fff',
                              borderRadius: 12,
                              padding: 12,
                              marginBottom: 8,
                            }}
                          >
                            <Pressable
                              onPress={() =>
                                handleToggleMeal(
                                  date,
                                  type,
                                  recipeServings ?? undefined,
                                )
                              }
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                              }}
                            >
                              {/* Checkbox */}
                              <View
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 6,
                                  borderWidth: 2,
                                  borderColor: isSelected
                                    ? '#4A3728'
                                    : '#e5e7eb',
                                  backgroundColor: isSelected
                                    ? '#4A3728'
                                    : '#fff',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginRight: 12,
                                }}
                              >
                                {isSelected && (
                                  <Ionicons
                                    name="checkmark"
                                    size={16}
                                    color="#fff"
                                  />
                                )}
                              </View>

                              <View style={{ flex: 1 }}>
                                <Text
                                  style={{
                                    fontSize: 14,
                                    fontWeight: '600',
                                    color: '#4A3728',
                                  }}
                                >
                                  {title}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 12,
                                    color: '#9ca3af',
                                    marginTop: 2,
                                  }}
                                >
                                  {label}
                                </Text>
                              </View>
                            </Pressable>

                            {/* Servings picker - only show when selected */}
                            {isSelected && (
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  marginTop: 10,
                                  marginLeft: 36,
                                  backgroundColor: '#F5E6D3',
                                  borderRadius: 10,
                                  padding: 6,
                                  alignSelf: 'flex-start',
                                }}
                              >
                                <Pressable
                                  onPress={() => handleChangeServings(key, -1)}
                                  style={({ pressed }) => ({
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    backgroundColor: pressed
                                      ? '#E8D5C4'
                                      : '#fff',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  })}
                                >
                                  <Ionicons
                                    name="remove"
                                    size={16}
                                    color="#4A3728"
                                  />
                                </Pressable>
                                <View style={{ paddingHorizontal: 12 }}>
                                  <Text
                                    style={{
                                      fontSize: 14,
                                      fontWeight: '600',
                                      color: '#4A3728',
                                    }}
                                  >
                                    {currentServings} 👤
                                  </Text>
                                </View>
                                <Pressable
                                  onPress={() => handleChangeServings(key, 1)}
                                  style={({ pressed }) => ({
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    backgroundColor: pressed
                                      ? '#E8D5C4'
                                      : '#fff',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  })}
                                >
                                  <Ionicons
                                    name="add"
                                    size={16}
                                    color="#4A3728"
                                  />
                                </Pressable>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </ScrollView>

              {/* Modal footer */}
              <View
                style={{
                  padding: 20,
                  borderTopWidth: 1,
                  borderTopColor: '#e5e7eb',
                }}
              >
                <Pressable
                  onPress={() => {
                    hapticSuccess();
                    handleCreateGroceryList();
                  }}
                  style={{
                    backgroundColor:
                      selectedMeals.size > 0 ? '#4A3728' : '#E8D5C4',
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                  disabled={selectedMeals.size === 0}
                >
                  <Text
                    style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}
                  >
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
