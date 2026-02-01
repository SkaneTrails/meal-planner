/**
 * Recipe detail screen.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Alert,
  Share,
  Linking,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { shadows, borderRadius, colors, spacing } from '@/lib/theme';
import { useRecipe, useDeleteRecipe, useUpdateRecipe, useEnhancedMode, useSetMeal, useMealPlan, useEnhancedRecipeExists } from '@/lib/hooks';
import { useAuth } from '@/lib/hooks/use-auth';
import { BouncingLoader } from '@/components';
import { hapticLight, hapticSuccess, hapticWarning, hapticSelection } from '@/lib/haptics';
import type { DietLabel, MealLabel, MealType } from '@/lib/types';

// All diet label options
const DIET_OPTIONS: { value: DietLabel | null; label: string; emoji: string }[] = [
  { value: null, label: 'None', emoji: '➖' },
  { value: 'veggie', label: 'Vegetarian', emoji: '🥬' },
  { value: 'fish', label: 'Seafood', emoji: '🐟' },
  { value: 'meat', label: 'Meat', emoji: '🥩' },
];

// All meal label options
const MEAL_OPTIONS: { value: MealLabel | null; label: string }[] = [
  { value: null, label: 'None' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'starter', label: 'Starter' },
  { value: 'salad', label: 'Salad' },
  { value: 'meal', label: 'Main Course' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'drink', label: 'Drink' },
  { value: 'sauce', label: 'Sauce' },
  { value: 'pickle', label: 'Pickle' },
  { value: 'grill', label: 'Grill' },
];

// Helper to format date for meal key
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get current week dates (Saturday to Friday)
function getWeekDates(weekOffset: number = 0): Date[] {
  const today = new Date();
  const currentDay = today.getDay();
  const daysSinceSaturday = (currentDay + 1) % 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - daysSinceSaturday + weekOffset * 7);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(saturday);
    date.setDate(saturday.getDate() + i);
    dates.push(date);
  }
  return dates;
}

const MEAL_TYPES: { type: MealType; label: string }[] = [
  { type: 'lunch', label: 'Lunch' },
  { type: 'dinner', label: 'Dinner' },
];

const DIET_LABELS: Record<DietLabel, { emoji: string; label: string; color: string; bgColor: string }> = {
  veggie: { emoji: '🥬', label: 'Vegetarian', color: '#166534', bgColor: '#DCFCE7' },  // pastel green
  fish: { emoji: '🐟', label: 'Seafood', color: '#1E40AF', bgColor: '#DBEAFE' },       // pastel blue
  meat: { emoji: '🥩', label: 'Meat', color: '#991B1B', bgColor: '#FEE2E2' },          // pastel red/pink
};

const MEAL_LABELS: Record<MealLabel, string> = {
  breakfast: 'Breakfast',
  starter: 'Starter',
  salad: 'Salad',
  meal: 'Main Course',
  dessert: 'Dessert',
  drink: 'Drink',
  sauce: 'Sauce',
  pickle: 'Pickle',
  grill: 'Grill',
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800';

// Thumb Rating component (thumbs up/down)
interface ThumbRatingProps {
  rating: number | null;
  onThumbUp: () => void;
  onThumbDown: () => void;
  size?: number;
}

function ThumbRating({ rating, onThumbUp, onThumbDown, size = 28 }: ThumbRatingProps) {
  // rating: null = no rating, 1 = thumbs down, 5 = thumbs up
  const isThumbUp = rating === 5;
  const isThumbDown = rating === 1;

  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Pressable
        onPress={onThumbDown}
        style={({ pressed }) => ({
          padding: 8,
          borderRadius: 20,
          backgroundColor: isThumbDown ? '#FEE2E2' : pressed ? '#F5E6D3' : 'transparent',
        })}
      >
        <Ionicons
          name={isThumbDown ? 'thumbs-down' : 'thumbs-down-outline'}
          size={size}
          color={isThumbDown ? '#DC2626' : '#9CA3AF'}
        />
      </Pressable>
      <Pressable
        onPress={onThumbUp}
        style={({ pressed }) => ({
          padding: 8,
          borderRadius: 20,
          backgroundColor: isThumbUp ? '#DCFCE7' : pressed ? '#F5E6D3' : 'transparent',
        })}
      >
        <Ionicons
          name={isThumbUp ? 'thumbs-up' : 'thumbs-up-outline'}
          size={size}
          color={isThumbUp ? '#16A34A' : '#9CA3AF'}
        />
      </Pressable>
    </View>
  );
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isEnhanced: globalEnhanced } = useEnhancedMode();
  const { user, loading: authLoading } = useAuth();
  const isAuthReady = !authLoading && !!user;

  // Local override for enhanced mode (null = use global, true/false = override)
  const [localEnhancedOverride, setLocalEnhancedOverride] = useState<boolean | null>(null);

  // Effective enhanced mode: local override takes precedence over global
  const isEnhanced = localEnhancedOverride !== null ? localEnhancedOverride : globalEnhanced;

  // Check if enhanced version exists (only fetch when auth is ready)
  const { data: hasEnhancedVersion } = useEnhancedRecipeExists(id, isAuthReady);

  const { data: recipe, isLoading, error } = useRecipe(id, isEnhanced);
  const deleteRecipe = useDeleteRecipe();
  const updateRecipe = useUpdateRecipe();
  const setMeal = useSetMeal();

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const { data: mealPlan } = useMealPlan();

  // Instruction step completion tracking (local state - resets on page reload)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (index: number) => {
    hapticSelection();
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Edit form state
  const [editDietLabel, setEditDietLabel] = useState<DietLabel | null>(null);
  const [editMealLabel, setEditMealLabel] = useState<MealLabel | null>(null);
  const [editPrepTime, setEditPrepTime] = useState('');
  const [editCookTime, setEditCookTime] = useState('');
  const [editServings, setEditServings] = useState('');
  const [editTags, setEditTags] = useState('');
  const [newTag, setNewTag] = useState('');
  // URL input modal state (for cross-platform support)
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Initialize edit form when opening modal
  const openEditModal = () => {
    if (recipe) {
      setEditDietLabel(recipe.diet_label);
      setEditMealLabel(recipe.meal_label);
      setEditPrepTime(recipe.prep_time?.toString() || '');
      setEditCookTime(recipe.cook_time?.toString() || '');
      setEditServings(recipe.servings?.toString() || '');
      setEditTags(recipe.tags.join(', '));
    }
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    setIsSavingEdit(true);
    try {
      // Parse tags from comma-separated string
      const tagsArray = editTags
        .split(',')
        .map(t => t.trim().toLowerCase().replace(/^#/, ''))
        .filter(t => t.length > 0);

      await updateRecipe.mutateAsync({
        id,
        updates: {
          diet_label: editDietLabel,
          meal_label: editMealLabel,
          prep_time: editPrepTime ? parseInt(editPrepTime, 10) : null,
          cook_time: editCookTime ? parseInt(editCookTime, 10) : null,
          servings: editServings ? parseInt(editServings, 10) : null,
          tags: tagsArray,
        },
        enhanced: isEnhanced,
      });
      setShowEditModal(false);
      Alert.alert('Saved', 'Recipe details updated');
    } catch {
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase().replace(/^#/, '');
    if (tag && !editTags.toLowerCase().includes(tag)) {
      setEditTags(prev => prev ? `${prev}, ${tag}` : tag);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const tagsArray = editTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.toLowerCase() !== tagToRemove.toLowerCase());
    setEditTags(tagsArray.join(', '));
  };

  // Helper to check if a meal slot is taken
  const getMealForSlot = (date: Date, mealType: MealType): string | null => {
    if (!mealPlan?.meals) return null;
    const dateStr = formatDateLocal(date);
    const key = `${dateStr}_${mealType}`;
    return mealPlan.meals[key] || null;
  };

  // Check if date is in the past
  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const handlePickImage = async () => {
    // Ask user for permission and show options
    Alert.alert(
      'Change Recipe Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Camera permission is required to take photos');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [16, 9],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              await saveImage(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Photo library permission is required');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [16, 9],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              await saveImage(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Enter URL',
          onPress: () => {
            // Use cross-platform modal instead of iOS-only Alert.prompt
            setImageUrlInput(recipe?.image_url || '');
            setShowUrlModal(true);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const saveImage = async (localUri: string) => {
    // Upload to cloud storage via API
    setIsUpdatingImage(true);
    try {
      const { api } = await import('@/lib/api');
      await api.uploadRecipeImage(id!, localUri, isEnhanced);
      // Refetch the recipe to get updated image URL
      // The mutation will invalidate the cache
      await updateRecipe.mutateAsync({
        id: id!,
        updates: {}, // Empty update just to trigger cache refresh
        enhanced: isEnhanced,
      });
      Alert.alert('Success', 'Recipe photo uploaded!');
    } catch (err) {
      // Fallback: save local URI if upload fails
      console.warn('Upload failed, saving local URI:', err);
      try {
        await updateRecipe.mutateAsync({
          id: id!,
          updates: { image_url: localUri },
          enhanced: isEnhanced,
        });
        Alert.alert('Saved Locally', 'Photo saved locally (upload to cloud failed)');
      } catch {
        Alert.alert('Error', 'Failed to update photo');
      }
    } finally {
      setIsUpdatingImage(false);
    }
  };

  const saveImageUrl = async (url: string) => {
    setIsUpdatingImage(true);
    try {
      await updateRecipe.mutateAsync({
        id: id!,
        updates: { image_url: url },
        enhanced: isEnhanced,
      });
      Alert.alert('Success', 'Recipe photo updated!');
    } catch {
      Alert.alert('Error', 'Failed to update photo');
    } finally {
      setIsUpdatingImage(false);
    }
  };

  const handlePlanMeal = async (date: Date, mealType: MealType) => {
    if (!id) return;
    hapticSuccess();
    try {
      await setMeal.mutateAsync({
        date: formatDateLocal(date),
        mealType: mealType,
        recipeId: id,
      });
      setShowPlanModal(false);
      Alert.alert('Added!', `${recipe?.title} added to ${mealType} on ${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`);
    } catch {
      Alert.alert('Error', 'Failed to add to meal plan');
    }
  };

  const handleClearMeal = async (date: Date, mealType: MealType) => {
    hapticLight();
    try {
      await setMeal.mutateAsync({
        date: formatDateLocal(date),
        mealType: mealType,
        recipeId: undefined,
      });
    } catch {
      Alert.alert('Error', 'Failed to clear meal');
    }
  };

  const handleThumbUp = async () => {
    if (!id) return;
    hapticSuccess();
    try {
      await updateRecipe.mutateAsync({
        id,
        updates: { rating: 5 },
        enhanced: isEnhanced,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to update rating');
    }
  };

  const handleThumbDown = () => {
    if (!id || !recipe) return;
    hapticWarning();
    // If already thumbs down, ask to delete
    if (recipe.rating === 1) {
      Alert.alert(
        'Delete Recipe?',
        `Do you want to delete "${recipe.title}"?`,
        [
          { text: 'No, keep it', style: 'cancel' },
          {
            text: 'Yes, delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteRecipe.mutateAsync({ id, enhanced: isEnhanced });
                router.back();
              } catch (err) {
                Alert.alert('Error', 'Failed to delete recipe');
              }
            },
          },
        ]
      );
    } else {
      // First thumb down - just mark it
      Alert.alert(
        'Not a favorite?',
        'Do you want to delete this recipe?',
        [
          {
            text: 'No, just mark as not favorite',
            onPress: async () => {
              try {
                await updateRecipe.mutateAsync({
                  id,
                  updates: { rating: 1 },
                  enhanced: isEnhanced,
                });
              } catch (err) {
                Alert.alert('Error', 'Failed to update rating');
              }
            }
          },
          {
            text: 'Yes, delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteRecipe.mutateAsync({ id, enhanced: isEnhanced });
                router.back();
              } catch (err) {
                Alert.alert('Error', 'Failed to delete recipe');
              }
            },
          },
        ]
      );
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe?.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe.mutateAsync({ id, enhanced: isEnhanced });
              router.back();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete recipe');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!recipe) return;

    try {
      await Share.share({
        title: recipe.title,
        message: `Check out this recipe: ${recipe.title}\n\n${recipe.url || ''}`,
        url: recipe.url,
      });
    } catch (err) {
      // User cancelled
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5E6D3' }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#E8D5C4',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}>
          <BouncingLoader size={14} />
        </View>
        <Text style={{ color: '#4A3728', fontSize: 16, fontWeight: '500' }}>Loading recipe...</Text>
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5E6D3', padding: 32 }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#E8D5C4',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Ionicons name="alert-circle-outline" size={40} color="#4A3728" />
        </View>
        <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '600' }}>Recipe not found</Text>
        <Text style={{ color: colors.text.secondary, fontSize: 14, marginTop: 8, textAlign: 'center' }}>This recipe may have been deleted or moved</Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: spacing.xl,
            paddingHorizontal: 28,
            paddingVertical: 14,
            backgroundColor: colors.primary,
            borderRadius: borderRadius.sm,
            ...shadows.lg,
          }}
        >
          <Text style={{ color: colors.white, fontSize: 15, fontWeight: '600' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const totalTime = recipe.total_time ||
    (recipe.prep_time && recipe.cook_time ? recipe.prep_time + recipe.cook_time : null) ||
    recipe.prep_time ||
    recipe.cook_time;

  return (
    <>
      <Stack.Screen
        options={{
          title: recipe.title,
          headerRight: () => (
            <Pressable onPress={handleDelete} style={{ padding: 8 }}>
              <Ionicons name="trash-outline" size={24} color="white" />
            </Pressable>
          ),
        }}
      />

      <ScrollView style={{ flex: 1, backgroundColor: '#F5E6D3' }}>
        {/* Hero image with camera button next to it */}
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: recipe.image_url || PLACEHOLDER_IMAGE }}
            style={{ width: '100%', height: 280 }}
            resizeMode="cover"
          />
          {/* Camera button floating on right side */}
          <Pressable
            onPress={handlePickImage}
            style={({ pressed }) => ({
              position: 'absolute',
              bottom: 48,
              right: 16,
              backgroundColor: pressed ? 'rgba(74, 55, 40, 1)' : 'rgba(74, 55, 40, 0.85)',
              borderRadius: borderRadius.xl,
              width: 48,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadows.lg,
            })}
          >
            {isUpdatingImage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={22} color="#fff" />
            )}
          </Pressable>
        </View>

        {/* Content */}
        <View style={{
          padding: spacing.xl,
          marginTop: -32,
          backgroundColor: colors.white,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          ...shadows.xl,
          minHeight: 500,
        }}>
          {/* Title and rating */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#4A3728', letterSpacing: -0.3, flex: 1, marginRight: 12 }}>
              {recipe.title}
            </Text>
            <ThumbRating
              rating={recipe.rating}
              onThumbUp={handleThumbUp}
              onThumbDown={handleThumbDown}
              size={24}
            />
          </View>

          {/* Action buttons row */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <Pressable
              onPress={openEditModal}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: pressed ? '#E8D5C4' : '#F5E6D3',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Ionicons name="create-outline" size={20} color="#4A3728" />
            </Pressable>
            <Pressable
              onPress={() => setShowPlanModal(true)}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: pressed ? '#E8D5C4' : '#F5E6D3',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Ionicons name="calendar-outline" size={20} color="#4A3728" />
            </Pressable>
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: pressed ? '#E8D5C4' : '#F5E6D3',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Ionicons name="share-outline" size={20} color="#4A3728" />
            </Pressable>

            {/* Enhanced/Original toggle - only show if enhanced version exists */}
            {hasEnhancedVersion && (
              <Pressable
                onPress={() => setLocalEnhancedOverride(prev => prev === null ? !globalEnhanced : !prev)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginLeft: 'auto',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isEnhanced
                    ? (pressed ? '#C4B5FD' : '#DDD6FE')
                    : (pressed ? '#E8D5C4' : '#F5E6D3'),
                })}
              >
                <Ionicons
                  name={isEnhanced ? 'sparkles' : 'document-text-outline'}
                  size={16}
                  color={isEnhanced ? '#7C3AED' : '#4A3728'}
                />
                <Text style={{
                  marginLeft: 6,
                  fontSize: 12,
                  fontWeight: '600',
                  color: isEnhanced ? '#7C3AED' : '#4A3728',
                }}>
                  {isEnhanced ? 'AI Enhanced' : 'Original'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Meta info (labels) */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 10, alignItems: 'center' }}>
            {recipe.diet_label && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: DIET_LABELS[recipe.diet_label].bgColor,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 12,
              }}>
                <Text style={{ marginRight: 6, fontSize: 14 }}>{DIET_LABELS[recipe.diet_label].emoji}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: DIET_LABELS[recipe.diet_label].color }}>
                  {DIET_LABELS[recipe.diet_label].label}
                </Text>
              </View>
            )}
            {recipe.meal_label && (
              <View style={{ backgroundColor: '#E8D5C4', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#4A3728' }}>
                  {MEAL_LABELS[recipe.meal_label]}
                </Text>
              </View>
            )}
          </View>

          {/* Time and servings - compact */}
          <View style={{
            flexDirection: 'row',
            marginTop: 16,
            backgroundColor: '#F5E6D3',
            borderRadius: 16,
            paddingVertical: 12,
            paddingHorizontal: 8,
          }}>
            {recipe.prep_time && (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Ionicons name="timer-outline" size={18} color="#4A3728" />
                <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Prep</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#4A3728' }}>
                  {recipe.prep_time}m
                </Text>
              </View>
            )}
            {recipe.cook_time && (
              <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: recipe.prep_time ? 1 : 0, borderLeftColor: '#E8D5C4' }}>
                <Ionicons name="flame-outline" size={18} color="#4A3728" />
                <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Cook</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#4A3728' }}>
                  {recipe.cook_time}m
                </Text>
              </View>
            )}
            {totalTime && (
              <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: (recipe.prep_time || recipe.cook_time) ? 1 : 0, borderLeftColor: '#E8D5C4' }}>
                <Ionicons name="time-outline" size={18} color="#4A3728" />
                <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Total</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#4A3728' }}>
                  {totalTime}m
                </Text>
              </View>
            )}
            {recipe.servings && (
              <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: (recipe.prep_time || recipe.cook_time || totalTime) ? 1 : 0, borderLeftColor: '#E8D5C4' }}>
                <Ionicons name="people-outline" size={18} color="#4A3728" />
                <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Serves</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#4A3728' }}>
                  {recipe.servings}
                </Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 18, gap: 8 }}>
              {recipe.tags.map((tag) => (
                <View
                  key={tag}
                  style={{ backgroundColor: '#4A3728', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#fff' }}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Ingredients */}
          <View style={{ marginTop: 28 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8D5C4', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="list" size={18} color="#4A3728" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#4A3728', letterSpacing: -0.3 }}>
                Ingredients
              </Text>
            </View>
            {recipe.ingredients.length === 0 ? (
              <Text style={{ color: '#6b7280', fontSize: 15, fontStyle: 'italic' }}>No ingredients listed</Text>
            ) : (
              <View style={{ backgroundColor: '#F9F5F0', borderRadius: 16, padding: 16 }}>
                {recipe.ingredients.map((ingredient, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      paddingVertical: 10,
                      borderBottomWidth: index < recipe.ingredients.length - 1 ? 1 : 0,
                      borderBottomColor: '#E8D5C4',
                    }}
                  >
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4A3728', marginTop: 7, marginRight: 14 }} />
                    <Text style={{ flex: 1, fontSize: 15, color: '#4A3728', lineHeight: 22 }}>
                      {ingredient}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Instructions */}
          <View style={{ marginTop: 28, marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8D5C4', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="book" size={18} color="#4A3728" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#4A3728', letterSpacing: -0.3 }}>
                Instructions
              </Text>
              {completedSteps.size > 0 && recipe.instructions.length > 0 && (
                <Text style={{ marginLeft: 'auto', fontSize: 13, color: '#16A34A', fontWeight: '500' }}>
                  {completedSteps.size}/{recipe.instructions.length} done
                </Text>
              )}
            </View>
            {recipe.instructions.length === 0 ? (
              <Text style={{ color: '#6b7280', fontSize: 15, fontStyle: 'italic' }}>No instructions listed</Text>
            ) : (
              recipe.instructions.map((instruction, index) => {
                const isCompleted = completedSteps.has(index);
                return (
                  <Pressable
                    key={index}
                    onPress={() => toggleStep(index)}
                    style={({ pressed }) => ({ 
                      flexDirection: 'row', 
                      alignItems: 'flex-start', 
                      paddingVertical: 14,
                      backgroundColor: isCompleted 
                        ? '#DCFCE7' 
                        : (index % 2 === 0 ? '#F9F5F0' : (pressed ? '#F5E6D3' : 'transparent')),
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      marginBottom: 4,
                      opacity: isCompleted ? 0.7 : 1,
                    })}
                  >
                    <View style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: 16, 
                      backgroundColor: isCompleted ? '#16A34A' : '#4A3728', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      marginRight: 14,
                      marginTop: 2,
                    }}>
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={18} color="#fff" />
                      ) : (
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{index + 1}</Text>
                      )}
                    </View>
                    <Text style={{ 
                      flex: 1, 
                      fontSize: 15, 
                      color: isCompleted ? '#166534' : '#4A3728', 
                      lineHeight: 24,
                      textDecorationLine: isCompleted ? 'line-through' : 'none',
                    }}>
                      {instruction}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>

          {/* Tips (only for enhanced recipes) */}
          {isEnhanced && recipe.tips && (
            <View style={{ marginTop: 8, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#DDD6FE', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name="bulb" size={18} color="#7C3AED" />
                </View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#4A3728', letterSpacing: -0.3 }}>
                  Tips
                </Text>
              </View>
              <View style={{ backgroundColor: '#F5F3FF', borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: '#7C3AED' }}>
                <Text style={{ fontSize: 15, color: '#4A3728', lineHeight: 24 }}>
                  {recipe.tips}
                </Text>
              </View>
            </View>
          )}

          {/* Changes made (only for enhanced recipes, collapsible) */}
          {isEnhanced && recipe.changes_made && recipe.changes_made.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#DDD6FE', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name="sparkles" size={18} color="#7C3AED" />
                </View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#4A3728', letterSpacing: -0.3 }}>
                  AI Improvements
                </Text>
              </View>
              <View style={{ backgroundColor: '#F5F3FF', borderRadius: 16, padding: 16 }}>
                {recipe.changes_made.map((change, index) => (
                  <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: index < recipe.changes_made!.length - 1 ? 8 : 0 }}>
                    <Ionicons name="checkmark-circle" size={18} color="#7C3AED" style={{ marginRight: 10, marginTop: 2 }} />
                    <Text style={{ flex: 1, fontSize: 14, color: '#4A3728', lineHeight: 20 }}>
                      {change}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Source link */}
          {recipe.url && (
            <Pressable
              onPress={() => Linking.openURL(recipe.url).catch(() => {
                Alert.alert('Error', 'Could not open the recipe URL');
              })}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 16,
                marginTop: 8,
                backgroundColor: '#F5E6D3',
                borderRadius: 14,
              }}
            >
              <Ionicons name="link-outline" size={18} color="#4A3728" />
              <Text style={{ color: '#4A3728', marginLeft: 8, fontSize: 15, fontWeight: '500' }} numberOfLines={1}>
                View original recipe
              </Text>
            </Pressable>
          )}

          {/* Add to Meal Plan button */}
          <Pressable
            onPress={() => setShowPlanModal(true)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.lg,
              marginTop: spacing.md,
              marginBottom: spacing.xl,
              backgroundColor: pressed ? colors.primaryDark : colors.primary,
              borderRadius: borderRadius.sm,
              ...shadows.lg,
            })}
          >
            <Ionicons name="calendar" size={20} color={colors.white} />
            <Text style={{ color: colors.white, marginLeft: 10, fontSize: 16, fontWeight: '600' }}>
              Add to Meal Plan
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Plan Modal */}
      <Modal
        visible={showPlanModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPlanModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 20,
            paddingBottom: 40,
            maxHeight: '80%',
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#4A3728' }}>Add to Meal Plan</Text>
              <Pressable onPress={() => setShowPlanModal(false)} style={{ padding: 8 }}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>

            {/* Week navigation */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginBottom: 16, gap: 20 }}>
              <Pressable
                onPress={() => setWeekOffset(0)}
                disabled={weekOffset === 0}
                style={{ padding: 8, opacity: weekOffset === 0 ? 0.3 : 1 }}
              >
                <Ionicons name="chevron-back" size={24} color="#4A3728" />
              </Pressable>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728' }}>
                {weekOffset === 0 ? 'This Week' : 'Next Week'}
              </Text>
              <Pressable
                onPress={() => setWeekOffset(1)}
                disabled={weekOffset === 1}
                style={{ padding: 8, opacity: weekOffset === 1 ? 0.3 : 1 }}
              >
                <Ionicons name="chevron-forward" size={24} color="#4A3728" />
              </Pressable>
            </View>

            <Text style={{ fontSize: 15, color: '#6b7280', paddingHorizontal: 20, marginBottom: 16 }}>
              Select a day and meal for "{recipe.title}"
            </Text>

            <ScrollView style={{ paddingHorizontal: 20 }}>
              {weekDates.map((date) => {
                const isToday = date.toDateString() === new Date().toDateString();
                const isPast = isPastDate(date);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                  <View key={date.toISOString()} style={{ marginBottom: 16, opacity: isPast ? 0.4 : 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      {isToday && (
                        <View style={{ backgroundColor: '#4A3728', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>TODAY</Text>
                        </View>
                      )}
                      <Text style={{ fontSize: 15, fontWeight: '600', color: isToday ? '#4A3728' : '#6b7280' }}>
                        {dayName} · {monthDay}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {MEAL_TYPES.map(({ type, label }) => {
                        const existingMeal = getMealForSlot(date, type);
                        const isTaken = !!existingMeal;

                        return (
                          <View key={type} style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
                            <Pressable
                              onPress={() => handlePlanMeal(date, type)}
                              disabled={isPast}
                              style={({ pressed }) => ({
                                flex: 1,
                                backgroundColor: isTaken
                                  ? '#E8D5C4'
                                  : pressed
                                    ? '#E8D5C4'
                                    : '#F5E6D3',
                                paddingVertical: 12,
                                borderRadius: isTaken ? 10 : 12,
                                borderTopRightRadius: isTaken ? 0 : 12,
                                borderBottomRightRadius: isTaken ? 0 : 12,
                                alignItems: 'center',
                                borderWidth: isTaken ? 2 : 0,
                                borderRightWidth: isTaken ? 0 : 0,
                                borderColor: '#4A3728',
                              })}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                {isTaken && <Ionicons name="checkmark-circle" size={16} color="#4A3728" />}
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#4A3728' }}>{label}</Text>
                              </View>
                            </Pressable>
                            {isTaken && !isPast && (
                              <Pressable
                                onPress={() => handleClearMeal(date, type)}
                                style={({ pressed }) => ({
                                  backgroundColor: pressed ? '#DC2626' : '#FEE2E2',
                                  paddingHorizontal: 10,
                                  borderRadius: 10,
                                  borderTopLeftRadius: 0,
                                  borderBottomLeftRadius: 0,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderWidth: 2,
                                  borderLeftWidth: 0,
                                  borderColor: '#4A3728',
                                })}
                              >
                                {({ pressed }) => (
                                  <Ionicons name="trash-outline" size={16} color={pressed ? '#fff' : '#DC2626'} />
                                )}
                              </Pressable>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 20,
            paddingBottom: 40,
            maxHeight: '90%',
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#4A3728' }}>Edit Recipe</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={() => setShowEditModal(false)}
                  style={{ paddingHorizontal: 16, paddingVertical: 8 }}
                >
                  <Text style={{ fontSize: 15, color: '#6b7280' }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveEdit}
                  disabled={isSavingEdit}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? '#3D2D1F' : '#4A3728',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    opacity: isSavingEdit ? 0.6 : 1,
                  })}
                >
                  {isSavingEdit ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Save</Text>
                  )}
                </Pressable>
              </View>
            </View>

            <ScrollView style={{ paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled">
              {/* Diet Type */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Diet Type
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {DIET_OPTIONS.map(({ value, label, emoji }) => {
                    const isSelected = editDietLabel === value;
                    return (
                      <Pressable
                        key={label}
                        onPress={() => setEditDietLabel(value)}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: isSelected ? '#4A3728' : pressed ? '#F5E6D3' : '#F9F5F0',
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: isSelected ? '#4A3728' : '#E8D5C4',
                        })}
                      >
                        <Text style={{ marginRight: 6 }}>{emoji}</Text>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: isSelected ? '#fff' : '#4A3728' }}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Meal Type */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Meal Type
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {MEAL_OPTIONS.map(({ value, label }) => {
                    const isSelected = editMealLabel === value;
                    return (
                      <Pressable
                        key={label}
                        onPress={() => setEditMealLabel(value)}
                        style={({ pressed }) => ({
                          backgroundColor: isSelected ? '#4A3728' : pressed ? '#F5E6D3' : '#F9F5F0',
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: isSelected ? '#4A3728' : '#E8D5C4',
                        })}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '500', color: isSelected ? '#fff' : '#4A3728' }}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Time & Servings */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Time & Servings
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>Prep (min)</Text>
                    <TextInput
                      value={editPrepTime}
                      onChangeText={setEditPrepTime}
                      placeholder="—"
                      placeholderTextColor="#d1d5db"
                      keyboardType="number-pad"
                      style={{
                        backgroundColor: '#F9F5F0',
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#4A3728',
                        textAlign: 'center',
                        borderWidth: 1,
                        borderColor: '#E8D5C4',
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>Cook (min)</Text>
                    <TextInput
                      value={editCookTime}
                      onChangeText={setEditCookTime}
                      placeholder="—"
                      placeholderTextColor="#d1d5db"
                      keyboardType="number-pad"
                      style={{
                        backgroundColor: '#F9F5F0',
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#4A3728',
                        textAlign: 'center',
                        borderWidth: 1,
                        borderColor: '#E8D5C4',
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>Servings</Text>
                    <TextInput
                      value={editServings}
                      onChangeText={setEditServings}
                      placeholder="—"
                      placeholderTextColor="#d1d5db"
                      keyboardType="number-pad"
                      style={{
                        backgroundColor: '#F9F5F0',
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: '#4A3728',
                        textAlign: 'center',
                        borderWidth: 1,
                        borderColor: '#E8D5C4',
                      }}
                    />
                  </View>
                </View>
              </View>

              {/* Tags */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Tags
                </Text>

                {/* Add new tag input */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <TextInput
                    value={newTag}
                    onChangeText={setNewTag}
                    placeholder="Add a tag..."
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    onSubmitEditing={handleAddTag}
                    returnKeyType="done"
                    style={{
                      flex: 1,
                      backgroundColor: '#F9F5F0',
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      fontSize: 15,
                      color: '#4A3728',
                      borderWidth: 1,
                      borderColor: '#E8D5C4',
                    }}
                  />
                  <Pressable
                    onPress={handleAddTag}
                    disabled={!newTag.trim()}
                    style={({ pressed }) => ({
                      backgroundColor: newTag.trim() ? (pressed ? '#3D2D1F' : '#4A3728') : '#E5E7EB',
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                    })}
                  >
                    <Ionicons name="add" size={24} color={newTag.trim() ? '#fff' : '#9ca3af'} />
                  </Pressable>
                </View>

                {/* Current tags */}
                {editTags && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {editTags.split(',').map((tag) => {
                      const trimmedTag = tag.trim();
                      if (!trimmedTag) return null;
                      return (
                        <View
                          key={trimmedTag}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#4A3728',
                            paddingLeft: 12,
                            paddingRight: 6,
                            paddingVertical: 6,
                            borderRadius: 16,
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '500', color: '#fff', marginRight: 6 }}>
                            #{trimmedTag}
                          </Text>
                          <Pressable
                            onPress={() => handleRemoveTag(trimmedTag)}
                            style={({ pressed }) => ({
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              backgroundColor: pressed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                              alignItems: 'center',
                              justifyContent: 'center',
                            })}
                          >
                            <Ionicons name="close" size={14} color="#fff" />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                )}

                {!editTags && (
                  <Text style={{ fontSize: 14, color: '#9ca3af', fontStyle: 'italic' }}>
                    No tags yet. Add some to organize your recipes!
                  </Text>
                )}
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* URL Input Modal (cross-platform replacement for Alert.prompt) */}
      <Modal
        visible={showUrlModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUrlModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#4A3728', marginBottom: 8 }}>
              Image URL
            </Text>
            <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
              Enter the URL of the image
            </Text>
            <TextInput
              value={imageUrlInput}
              onChangeText={setImageUrlInput}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={{
                borderWidth: 1,
                borderColor: '#E8D5C4',
                borderRadius: 10,
                padding: 12,
                fontSize: 15,
                color: '#4A3728',
                marginBottom: 16,
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <Pressable
                onPress={() => setShowUrlModal(false)}
                style={({ pressed }) => ({
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: pressed ? '#f3f4f6' : 'transparent',
                })}
              >
                <Text style={{ fontSize: 15, color: '#6b7280', fontWeight: '500' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (imageUrlInput.trim()) {
                    await saveImageUrl(imageUrlInput.trim());
                  }
                  setShowUrlModal(false);
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: pressed ? '#3d2e21' : '#4A3728',
                })}
              >
                <Text style={{ fontSize: 15, color: '#fff', fontWeight: '500' }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
