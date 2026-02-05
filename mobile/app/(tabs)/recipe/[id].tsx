/**
 * Recipe detail screen.
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Share,
  Linking,
  Modal,
  ActivityIndicator,
  TextInput,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { shadows, borderRadius, colors, spacing, fontFamily, fontSize, letterSpacing } from '@/lib/theme';
import { useRecipe, useDeleteRecipe, useUpdateRecipe, useEnhancedMode, useSetMeal, useMealPlan, useEnhancedRecipeExists, useCurrentUser } from '@/lib/hooks';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSettings } from '@/lib/settings-context';
import { BouncingLoader } from '@/components';
import { hapticLight, hapticSuccess, hapticWarning, hapticSelection } from '@/lib/haptics';
import type { DietLabel, MealLabel, MealType, StructuredInstruction, RecipeVisibility } from '@/lib/types';

// Blurhash placeholder for loading state
const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0teleV@';

// All diet label options
const DIET_OPTIONS: { value: DietLabel | null; label: string; emoji: string }[] = [
  { value: null, label: 'None', emoji: '➖' },
  { value: 'veggie', label: 'Vegetarian', emoji: '🥬' },
  { value: 'fish', label: 'Seafood', emoji: '🐟' },
  { value: 'meat', label: 'Meat', emoji: '🥩' },
];

// Visibility options
const VISIBILITY_OPTIONS: { value: RecipeVisibility; label: string; emoji: string; description: string }[] = [
  { value: 'household', label: 'Private', emoji: '🔒', description: 'Only your household' },
  { value: 'shared', label: 'Shared', emoji: '🌍', description: 'Visible to everyone' },
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
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      <Pressable
        onPress={onThumbDown}
        style={({ pressed }) => ({
          padding: spacing.sm,
          borderRadius: 20,
          backgroundColor: isThumbDown ? colors.errorBg : pressed ? colors.bgMid : 'transparent',
        })}
      >
        <Ionicons
          name={isThumbDown ? 'thumbs-down' : 'thumbs-down-outline'}
          size={size}
          color={isThumbDown ? colors.error : colors.gray[400]}
        />
      </Pressable>
      <Pressable
        onPress={onThumbUp}
        style={({ pressed }) => ({
          padding: spacing.sm,
          borderRadius: 20,
          backgroundColor: isThumbUp ? colors.successBg : pressed ? colors.bgMid : 'transparent',
        })}
      >
        <Ionicons
          name={isThumbUp ? 'thumbs-up' : 'thumbs-up-outline'}
          size={size}
          color={isThumbUp ? colors.success : colors.gray[400]}
        />
      </Pressable>
    </View>
  );
}

// Instruction item component for rendering different instruction types
interface InstructionItemProps {
  instruction: StructuredInstruction;
  index: number;
  isCompleted: boolean;
  onToggle: () => void;
}

function InstructionItem({ instruction, index, isCompleted, onToggle }: InstructionItemProps) {
  const { type, content, time, step_number } = instruction;

  // Timeline entry - special styling with clock icon
  if (type === 'timeline') {
    return (
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingVertical: spacing.md,
          backgroundColor: isCompleted ? colors.successBg : (pressed ? '#EDE9FE' : '#F3E8FF'),  // Purple tint for timeline
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.md,
          marginBottom: spacing.xs,
          borderLeftWidth: 3,
          borderLeftColor: isCompleted ? colors.success : '#7C3AED',  // Purple accent
          opacity: isCompleted ? 0.7 : 1,
        })}
      >
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: isCompleted ? colors.success : '#7C3AED',  // Purple for timeline
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
          marginTop: 2,
        }}>
          {isCompleted ? (
            <Ionicons name="checkmark" size={18} color={colors.white} />
          ) : (
            <Ionicons name="time-outline" size={18} color={colors.white} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          {time !== null && time !== undefined ? (
            <Text style={{
              fontSize: fontSize.base,
              fontFamily: fontFamily.bodySemibold,
              color: isCompleted ? '#166534' : '#7C3AED',
              marginBottom: spacing.xs,
              textDecorationLine: isCompleted ? 'line-through' : 'none',
            }}>
              ⏱️ {time} min
            </Text>
          ) : (
            <Text style={{
              fontSize: fontSize.base,
              fontFamily: fontFamily.bodySemibold,
              color: isCompleted ? '#166534' : '#7C3AED',
              marginBottom: spacing.xs,
              textDecorationLine: isCompleted ? 'line-through' : 'none',
            }}>
              📝 Översikt
            </Text>
          )}
          <Text style={{
            fontSize: fontSize.xl,
            fontFamily: fontFamily.body,
            color: isCompleted ? '#166534' : colors.text.inverse,
            lineHeight: 24,
            textDecorationLine: isCompleted ? 'line-through' : 'none',
          }}>
            {content}
          </Text>
        </View>
      </Pressable>
    );
  }

  // Inline tip - light bulb styling
  if (type === 'tip') {
    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.warningBg,  // Amber/yellow tint
        borderRadius: borderRadius.md,
        marginBottom: spacing.xs,
        borderLeftWidth: 3,
        borderLeftColor: colors.warning,  // Amber accent
      }}>
        <View style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.warning,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
          marginTop: 2,
        }}>
          <Text style={{ fontSize: fontSize.lg }}>💡</Text>
        </View>
        <Text style={{
          flex: 1,
          fontSize: fontSize.lg,
          fontFamily: fontFamily.body,
          color: '#92400E',
          lineHeight: 22,
          fontStyle: 'italic',
        }}>
          {content}
        </Text>
      </View>
    );
  }

  // Section heading
  if (type === 'heading') {
    return (
      <View style={{
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xs,
        marginTop: index > 0 ? spacing.lg : 0,
        marginBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.bgDark,
      }}>
        <Text style={{
          fontSize: fontSize['2xl'],
          fontFamily: fontFamily.displayBold,
          color: colors.text.inverse,
          letterSpacing: letterSpacing.normal,
        }}>
          {content}
        </Text>
      </View>
    );
  }

  // Regular step (default)
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: spacing.md,
        backgroundColor: isCompleted
          ? colors.successBg
          : ((step_number ?? 1) % 2 === 0 ? colors.gray[50] : (pressed ? colors.bgMid : 'transparent')),
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.xs,
        opacity: isCompleted ? 0.7 : 1,
      })}
    >
      <View style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: isCompleted ? colors.success : colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
        marginTop: 2,
      }}>
        {isCompleted ? (
          <Ionicons name="checkmark" size={18} color={colors.white} />
        ) : (
          <Text style={{ color: colors.white, fontSize: fontSize.lg, fontFamily: fontFamily.bodyBold }}>{step_number}</Text>
        )}
      </View>
      <Text style={{
        flex: 1,
        fontSize: fontSize.xl,
        fontFamily: fontFamily.body,
        color: isCompleted ? '#166534' : colors.text.inverse,
        lineHeight: 24,
        textDecorationLine: isCompleted ? 'line-through' : 'none',
      }}>
        {content}
      </Text>
    </Pressable>
  );
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isEnhanced: globalEnhanced } = useEnhancedMode();
  const { user, loading: authLoading } = useAuth();
  const isAuthReady = !authLoading && !!user;

  // Favorites
  const { isFavorite, toggleFavorite } = useSettings();
  const isRecipeFavorite = id ? isFavorite(id) : false;

  // Parallax scroll animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_HEIGHT = 280;

  // Local override for enhanced mode (null = use global, true/false = override)
  const [localEnhancedOverride, setLocalEnhancedOverride] = useState<boolean | null>(null);

  // Effective enhanced mode: local override takes precedence over global
  const isEnhanced = localEnhancedOverride !== null ? localEnhancedOverride : globalEnhanced;

  // Check if enhanced version exists (only fetch when auth is ready)
  const { data: hasEnhancedVersion } = useEnhancedRecipeExists(id, isAuthReady);

  const { data: recipe, isLoading, error } = useRecipe(id, isEnhanced);
  const { data: currentUser } = useCurrentUser({ enabled: isAuthReady });
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

  // AI changes section collapsed state (default collapsed/hidden)
  const [showAiChanges, setShowAiChanges] = useState(false);

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
  const [editVisibility, setEditVisibility] = useState<RecipeVisibility>('household');
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
      setEditVisibility(recipe.visibility || 'household');
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
          visibility: editVisibility,
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgLight }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.bgDark,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}>
          <BouncingLoader size={14} />
        </View>
        <Text style={{ color: colors.text.inverse, fontSize: fontSize['2xl'], fontFamily: fontFamily.bodyMedium }}>Loading recipe...</Text>
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgLight, padding: spacing.xl }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.bgDark,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xl,
        }}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.text.inverse} />
        </View>
        <Text style={{ color: colors.text.inverse, fontSize: fontSize['2xl'], fontFamily: fontFamily.bodySemibold }}>Recipe not found</Text>
        <Text style={{ color: colors.gray[500], fontSize: fontSize.lg, fontFamily: fontFamily.body, marginTop: spacing.sm, textAlign: 'center' }}>This recipe may have been deleted or moved</Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: spacing.xl,
            paddingHorizontal: 28,
            paddingVertical: spacing.md,
            backgroundColor: colors.primary,
            borderRadius: borderRadius.sm,
            ...shadows.md,
          }}
        >
          <Text style={{ color: colors.white, fontSize: fontSize.xl, fontFamily: fontFamily.bodySemibold }}>Go Back</Text>
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
          headerShown: true,
          headerStyle: { backgroundColor: colors.bgLight },
          headerTintColor: colors.text.inverse,
          headerBackTitle: 'Back',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.sm, marginLeft: -4 }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text.inverse} />
            </Pressable>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Pressable
                onPress={() => {
                  hapticLight();
                  if (id) toggleFavorite(id);
                }}
                style={{ padding: spacing.sm }}
              >
                <Ionicons
                  name={isRecipeFavorite ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isRecipeFavorite ? colors.coral : colors.text.inverse}
                />
              </Pressable>
              <Pressable onPress={handleDelete} style={{ padding: spacing.sm }}>
                <Ionicons name="trash-outline" size={24} color={colors.text.inverse} />
              </Pressable>
            </View>
          ),
        }}
      />

      <Animated.ScrollView
        style={{ flex: 1, backgroundColor: colors.bgLight }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero image with parallax effect */}
        <Animated.View
          style={{
            position: 'relative',
            height: HEADER_HEIGHT,
            overflow: 'hidden',
            transform: [
              {
                // Parallax: image moves slower than scroll
                translateY: scrollY.interpolate({
                  inputRange: [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
                  outputRange: [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.5],
                  extrapolate: 'clamp',
                }),
              },
              {
                // Scale up when pulling down (overscroll)
                scale: scrollY.interpolate({
                  inputRange: [-HEADER_HEIGHT, 0, 1],
                  outputRange: [2, 1, 1],
                  extrapolate: 'clamp',
                }),
              },
            ],
          }}
        >
          <Image
            source={{ uri: recipe.image_url || PLACEHOLDER_IMAGE }}
            style={{ width: '100%', height: HEADER_HEIGHT }}
            contentFit="cover"
            placeholder={PLACEHOLDER_BLURHASH}
            transition={400}
          />
          {/* Camera button floating on right side */}
          <Pressable
            onPress={handlePickImage}
            style={({ pressed }) => ({
              position: 'absolute',
              bottom: 48,
              right: spacing.lg,
              backgroundColor: pressed ? colors.primaryDark : colors.primary,
              borderRadius: borderRadius.xl,
              width: 48,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadows.lg,
            })}
          >
            {isUpdatingImage ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="camera" size={22} color={colors.white} />
            )}
          </Pressable>
        </Animated.View>

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
            <Text style={{ fontSize: fontSize['4xl'], fontFamily: fontFamily.display, color: colors.text.inverse, letterSpacing: letterSpacing.tight, flex: 1, marginRight: spacing.md }}>
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
            {/* Edit button - only enabled for recipes owned by user's household */}
            {(() => {
              const isOwned = recipe.household_id === currentUser?.household_id;
              const isLegacy = recipe.household_id === null || recipe.household_id === undefined;
              const canEdit = isOwned || isLegacy;
              return (
                <Pressable
                  onPress={canEdit ? openEditModal : () => Alert.alert('Cannot Edit', 'Copy this recipe to your household first to make changes.')}
                  style={({ pressed }) => ({
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: pressed ? colors.bgDark : colors.bgMid,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: canEdit ? 1 : 0.5,
                  })}
                >
                  <Ionicons name="create-outline" size={20} color={colors.text.inverse} />
                </Pressable>
              );
            })()}
            <Pressable
              onPress={() => setShowPlanModal(true)}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: pressed ? colors.bgDark : colors.bgMid,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.text.inverse} />
            </Pressable>
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: pressed ? colors.bgDark : colors.bgMid,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Ionicons name="share-outline" size={20} color={colors.text.inverse} />
            </Pressable>

            {/* Enhanced/Original toggle - only show if enhanced version exists */}
            {hasEnhancedVersion && (
              <Pressable
                onPress={() => setLocalEnhancedOverride(prev => prev === null ? !globalEnhanced : !prev)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginLeft: 'auto',
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: 20,
                  backgroundColor: isEnhanced
                    ? (pressed ? '#C4B5FD' : '#DDD6FE')
                    : (pressed ? colors.bgDark : colors.bgMid),
                })}
              >
                <Ionicons
                  name={isEnhanced ? 'sparkles' : 'document-text-outline'}
                  size={16}
                  color={isEnhanced ? '#7C3AED' : colors.text.inverse}
                />
                <Text style={{
                  marginLeft: spacing.xs,
                  fontSize: fontSize.base,
                  fontFamily: fontFamily.bodySemibold,
                  color: isEnhanced ? '#7C3AED' : colors.text.inverse,
                }}>
                  {isEnhanced ? 'AI Enhanced' : 'Original'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Meta info (labels) */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, gap: spacing.sm, alignItems: 'center' }}>
            {recipe.diet_label && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: DIET_LABELS[recipe.diet_label].bgColor,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.md,
              }}>
                <Text style={{ marginRight: spacing.xs, fontSize: fontSize.lg }}>{DIET_LABELS[recipe.diet_label].emoji}</Text>
                <Text style={{ fontSize: fontSize.md, fontFamily: fontFamily.bodySemibold, color: DIET_LABELS[recipe.diet_label].color }}>
                  {DIET_LABELS[recipe.diet_label].label}
                </Text>
              </View>
            )}
            {recipe.meal_label && (
              <View style={{ backgroundColor: colors.bgDark, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20 }}>
                <Text style={{ fontSize: fontSize.md, fontFamily: fontFamily.bodySemibold, color: colors.text.inverse }}>
                  {MEAL_LABELS[recipe.meal_label]}
                </Text>
              </View>
            )}
          </View>

          {/* Time and servings - compact */}
          <View style={{
            flexDirection: 'row',
            marginTop: spacing.lg,
            backgroundColor: colors.bgMid,
            borderRadius: borderRadius.lg,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.sm,
          }}>
            {recipe.prep_time && (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Ionicons name="timer-outline" size={18} color={colors.text.inverse} />
                <Text style={{ fontSize: fontSize.sm, color: colors.gray[500], marginTop: spacing.xs }}>Prep</Text>
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodyBold, color: colors.text.inverse }}>
                  {recipe.prep_time}m
                </Text>
              </View>
            )}
            {recipe.cook_time && (
              <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: recipe.prep_time ? 1 : 0, borderLeftColor: colors.bgDark }}>
                <Ionicons name="flame-outline" size={18} color={colors.text.inverse} />
                <Text style={{ fontSize: fontSize.sm, color: colors.gray[500], marginTop: spacing.xs }}>Cook</Text>
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodyBold, color: colors.text.inverse }}>
                  {recipe.cook_time}m
                </Text>
              </View>
            )}
            {totalTime && (
              <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: (recipe.prep_time || recipe.cook_time) ? 1 : 0, borderLeftColor: colors.bgDark }}>
                <Ionicons name="time-outline" size={18} color={colors.text.inverse} />
                <Text style={{ fontSize: fontSize.sm, color: colors.gray[500], marginTop: spacing.xs }}>Total</Text>
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodyBold, color: colors.text.inverse }}>
                  {totalTime}m
                </Text>
              </View>
            )}
            {recipe.servings && (
              <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: (recipe.prep_time || recipe.cook_time || totalTime) ? 1 : 0, borderLeftColor: colors.bgDark }}>
                <Ionicons name="people-outline" size={18} color={colors.text.inverse} />
                <Text style={{ fontSize: fontSize.sm, color: colors.gray[500], marginTop: spacing.xs }}>Serves</Text>
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodyBold, color: colors.text.inverse }}>
                  {recipe.servings}
                </Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.lg, gap: spacing.sm }}>
              {recipe.tags.map((tag) => (
                <View
                  key={tag}
                  style={{ backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.lg }}
                >
                  <Text style={{ fontSize: fontSize.base, fontFamily: fontFamily.bodyMedium, color: colors.white }}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Ingredients */}
          <View style={{ marginTop: spacing.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgDark, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
                <Ionicons name="list" size={18} color={colors.text.inverse} />
              </View>
              <Text style={{ fontSize: fontSize['3xl'], fontFamily: fontFamily.display, color: colors.text.inverse, letterSpacing: letterSpacing.normal }}>
                Ingredients
              </Text>
            </View>
            {recipe.ingredients.length === 0 ? (
              <Text style={{ color: colors.gray[500], fontSize: fontSize.xl, fontStyle: 'italic' }}>No ingredients listed</Text>
            ) : (
              <View style={{ backgroundColor: colors.gray[50], borderRadius: borderRadius.lg, padding: spacing.lg }}>
                {recipe.ingredients.map((ingredient, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      paddingVertical: spacing.sm,
                      borderBottomWidth: index < recipe.ingredients.length - 1 ? 1 : 0,
                      borderBottomColor: colors.bgDark,
                    }}
                  >
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 7, marginRight: spacing.md }} />
                    <Text style={{ flex: 1, fontSize: fontSize.xl, fontFamily: fontFamily.body, color: colors.text.inverse, lineHeight: 22 }}>
                      {ingredient}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Instructions */}
          <View style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgDark, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
                <Ionicons name="book" size={18} color={colors.text.inverse} />
              </View>
              <Text style={{ fontSize: fontSize['3xl'], fontFamily: fontFamily.display, color: colors.text.inverse, letterSpacing: letterSpacing.normal }}>
                Instructions
              </Text>
              {completedSteps.size > 0 && recipe.instructions.length > 0 && (
                <Text style={{ marginLeft: 'auto', fontSize: fontSize.md, color: colors.success, fontFamily: fontFamily.bodyMedium }}>
                  {completedSteps.size}/{recipe.instructions.length} done
                </Text>
              )}
            </View>
            {recipe.instructions.length === 0 ? (
              <Text style={{ color: colors.gray[500], fontSize: fontSize.xl, fontStyle: 'italic' }}>No instructions listed</Text>
            ) : recipe.structured_instructions ? (
              // Use structured instructions if available (parsed by API)
              recipe.structured_instructions.map((instruction, index) => (
                <InstructionItem
                  key={index}
                  instruction={instruction}
                  index={index}
                  isCompleted={completedSteps.has(index)}
                  onToggle={() => toggleStep(index)}
                />
              ))
            ) : (
              // Fallback: render plain string instructions
              recipe.instructions.map((instruction, index) => {
                const isCompleted = completedSteps.has(index);
                return (
                  <Pressable
                    key={index}
                    onPress={() => toggleStep(index)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      paddingVertical: spacing.md,
                      backgroundColor: isCompleted
                        ? colors.successBg
                        : (index % 2 === 0 ? colors.gray[50] : (pressed ? colors.bgMid : 'transparent')),
                      borderRadius: borderRadius.md,
                      paddingHorizontal: spacing.md,
                      marginBottom: spacing.xs,
                      opacity: isCompleted ? 0.7 : 1,
                    })}
                  >
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: isCompleted ? colors.success : colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: spacing.md,
                      marginTop: 2,
                    }}>
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={18} color={colors.white} />
                      ) : (
                        <Text style={{ color: colors.white, fontSize: fontSize.lg, fontFamily: fontFamily.bodyBold }}>{index + 1}</Text>
                      )}
                    </View>
                    <Text style={{
                      flex: 1,
                      fontSize: fontSize.xl,
                      fontFamily: fontFamily.body,
                      color: isCompleted ? '#166534' : colors.text.inverse,
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
            <View style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#DDD6FE', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
                  <Ionicons name="bulb" size={18} color="#7C3AED" />
                </View>
                <Text style={{ fontSize: fontSize['3xl'], fontFamily: fontFamily.display, color: colors.text.inverse, letterSpacing: letterSpacing.normal }}>
                  Tips
                </Text>
              </View>
              <View style={{ backgroundColor: '#F5F3FF', borderRadius: borderRadius.lg, padding: spacing.lg, borderLeftWidth: 4, borderLeftColor: '#7C3AED' }}>
                <Text style={{ fontSize: fontSize.xl, fontFamily: fontFamily.body, color: colors.text.inverse, lineHeight: 24 }}>
                  {recipe.tips}
                </Text>
              </View>
            </View>
          )}

          {/* Changes made (only for enhanced recipes, collapsible - default hidden) */}
          {isEnhanced && recipe.changes_made && recipe.changes_made.length > 0 && (
            <View style={{ marginBottom: spacing.xl }}>
              <Pressable
                onPress={() => setShowAiChanges(!showAiChanges)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: showAiChanges ? spacing.md : 0,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#DDD6FE', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
                  <Ionicons name="sparkles" size={18} color="#7C3AED" />
                </View>
                <Text style={{ fontSize: fontSize['3xl'], fontFamily: fontFamily.display, color: colors.text.inverse, letterSpacing: letterSpacing.normal, flex: 1 }}>
                  AI-förbättringar
                </Text>
                <Ionicons
                  name={showAiChanges ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#7C3AED"
                />
              </Pressable>
              {showAiChanges && (
                <View style={{ backgroundColor: '#F5F3FF', borderRadius: borderRadius.lg, padding: spacing.lg }}>
                  {recipe.changes_made.map((change, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: index < recipe.changes_made!.length - 1 ? spacing.sm : 0 }}>
                      <Ionicons name="checkmark-circle" size={18} color="#7C3AED" style={{ marginRight: spacing.sm, marginTop: 2 }} />
                      <Text style={{ flex: 1, fontSize: fontSize.lg, fontFamily: fontFamily.body, color: colors.text.inverse, lineHeight: 20 }}>
                        {change}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
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
                paddingVertical: spacing.lg,
                marginTop: spacing.sm,
                backgroundColor: colors.bgMid,
                borderRadius: borderRadius.md,
              }}
            >
              <Ionicons name="link-outline" size={18} color={colors.text.inverse} />
              <Text style={{ color: colors.text.inverse, marginLeft: spacing.sm, fontSize: fontSize.xl, fontFamily: fontFamily.bodyMedium }} numberOfLines={1}>
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
              paddingVertical: spacing.md,
              marginTop: spacing.md,
              marginBottom: spacing.xl,
              backgroundColor: pressed ? colors.primaryDark : colors.primary,
              borderRadius: borderRadius.sm,
              ...shadows.md,
            })}
          >
            <Ionicons name="calendar" size={20} color={colors.white} />
            <Text style={{ color: colors.white, marginLeft: spacing.sm, fontSize: fontSize['2xl'], fontFamily: fontFamily.bodySemibold }}>
              Add to Meal Plan
            </Text>
          </Pressable>
        </View>
      </Animated.ScrollView>

      {/* Plan Modal */}
      <Modal
        visible={showPlanModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPlanModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: colors.white,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: spacing.xl,
            paddingBottom: 40,
            maxHeight: '80%',
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
              <Text style={{ fontSize: fontSize['3xl'], fontFamily: fontFamily.display, color: colors.text.inverse }}>Add to Meal Plan</Text>
              <Pressable onPress={() => setShowPlanModal(false)} style={{ padding: spacing.sm }}>
                <Ionicons name="close" size={24} color={colors.gray[500]} />
              </Pressable>
            </View>

            {/* Week navigation */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.xl }}>
              <Pressable
                onPress={() => setWeekOffset(0)}
                disabled={weekOffset === 0}
                style={{ padding: spacing.sm, opacity: weekOffset === 0 ? 0.3 : 1 }}
              >
                <Ionicons name="chevron-back" size={24} color={colors.text.inverse} />
              </Pressable>
              <Text style={{ fontSize: fontSize.xl, fontFamily: fontFamily.bodySemibold, color: colors.text.inverse }}>
                {weekOffset === 0 ? 'This Week' : 'Next Week'}
              </Text>
              <Pressable
                onPress={() => setWeekOffset(1)}
                disabled={weekOffset === 1}
                style={{ padding: spacing.sm, opacity: weekOffset === 1 ? 0.3 : 1 }}
              >
                <Ionicons name="chevron-forward" size={24} color={colors.text.inverse} />
              </Pressable>
            </View>

            <Text style={{ fontSize: fontSize.xl, fontFamily: fontFamily.body, color: colors.gray[500], paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
              Select a day and meal for "{recipe.title}"
            </Text>

            <ScrollView style={{ paddingHorizontal: spacing.xl }}>
              {weekDates.map((date) => {
                const isToday = date.toDateString() === new Date().toDateString();
                const isPast = isPastDate(date);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                  <View key={date.toISOString()} style={{ marginBottom: spacing.lg, opacity: isPast ? 0.4 : 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                      {isToday && (
                        <View style={{ backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm, marginRight: spacing.sm }}>
                          <Text style={{ fontSize: fontSize.sm, fontFamily: fontFamily.bodyBold, color: colors.white }}>TODAY</Text>
                        </View>
                      )}
                      <Text style={{ fontSize: fontSize.xl, fontFamily: fontFamily.bodySemibold, color: isToday ? colors.text.inverse : colors.gray[500] }}>
                        {dayName} · {monthDay}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      {MEAL_TYPES.map(({ type, label }) => {
                        const existingMeal = getMealForSlot(date, type);
                        const isTaken = !!existingMeal;

                        return (
                          <View key={type} style={{ flex: 1, flexDirection: 'row', gap: spacing.xs }}>
                            <Pressable
                              onPress={() => handlePlanMeal(date, type)}
                              disabled={isPast}
                              style={({ pressed }) => ({
                                flex: 1,
                                backgroundColor: isTaken
                                  ? colors.bgDark
                                  : pressed
                                    ? colors.bgDark
                                    : colors.bgMid,
                                paddingVertical: spacing.md,
                                borderRadius: isTaken ? borderRadius.sm : borderRadius.md,
                                borderTopRightRadius: isTaken ? 0 : borderRadius.md,
                                borderBottomRightRadius: isTaken ? 0 : borderRadius.md,
                                alignItems: 'center',
                                borderWidth: isTaken ? 2 : 0,
                                borderRightWidth: isTaken ? 0 : 0,
                                borderColor: colors.primary,
                              })}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                                {isTaken && <Ionicons name="checkmark-circle" size={16} color={colors.text.inverse} />}
                                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold, color: colors.text.inverse }}>{label}</Text>
                              </View>
                            </Pressable>
                            {isTaken && !isPast && (
                              <Pressable
                                onPress={() => handleClearMeal(date, type)}
                                style={({ pressed }) => ({
                                  backgroundColor: pressed ? colors.error : colors.errorBg,
                                  paddingHorizontal: spacing.sm,
                                  borderRadius: borderRadius.sm,
                                  borderTopLeftRadius: 0,
                                  borderBottomLeftRadius: 0,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderWidth: 2,
                                  borderLeftWidth: 0,
                                  borderColor: colors.primary,
                                })}
                              >
                                {({ pressed }) => (
                                  <Ionicons name="trash-outline" size={16} color={pressed ? colors.white : colors.error} />
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
            backgroundColor: colors.white,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: spacing.xl,
            paddingBottom: 40,
            maxHeight: '90%',
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}>
              <Text style={{ fontSize: fontSize['3xl'], fontFamily: fontFamily.display, color: colors.text.inverse }}>Edit Recipe</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Pressable
                  onPress={() => setShowEditModal(false)}
                  style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}
                >
                  <Text style={{ fontSize: fontSize.xl, fontFamily: fontFamily.body, color: colors.gray[500] }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveEdit}
                  disabled={isSavingEdit}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.primaryDark : colors.primary,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.sm,
                    borderRadius: borderRadius.sm,
                    opacity: isSavingEdit ? 0.6 : 1,
                  })}
                >
                  {isSavingEdit ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={{ fontSize: fontSize.xl, fontFamily: fontFamily.bodySemibold, color: colors.white }}>Save</Text>
                  )}
                </Pressable>
              </View>
            </View>

            <ScrollView style={{ paddingHorizontal: spacing.xl }} keyboardShouldPersistTaps="handled">
              {/* Diet Type */}
              <View style={{ marginBottom: spacing.xl }}>
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold, color: colors.gray[500], marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
                  Diet Type
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {DIET_OPTIONS.map(({ value, label, emoji }) => {
                    const isSelected = editDietLabel === value;
                    return (
                      <Pressable
                        key={label}
                        onPress={() => setEditDietLabel(value)}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: isSelected ? colors.primary : pressed ? colors.bgMid : colors.gray[50],
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.primary : colors.bgDark,
                        })}
                      >
                        <Text style={{ marginRight: spacing.xs }}>{emoji}</Text>
                        <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodyMedium, color: isSelected ? colors.white : colors.text.inverse }}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Meal Type */}
              <View style={{ marginBottom: spacing.xl }}>
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold, color: colors.gray[500], marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
                  Meal Type
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {MEAL_OPTIONS.map(({ value, label }) => {
                    const isSelected = editMealLabel === value;
                    return (
                      <Pressable
                        key={label}
                        onPress={() => setEditMealLabel(value)}
                        style={({ pressed }) => ({
                          backgroundColor: isSelected ? colors.primary : pressed ? colors.bgMid : colors.gray[50],
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.primary : colors.bgDark,
                        })}
                      >
                        <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodyMedium, color: isSelected ? colors.white : colors.text.inverse }}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Visibility */}
              <View style={{ marginBottom: spacing.xl }}>
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold, color: colors.gray[500], marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
                  Visibility
                </Text>
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  {VISIBILITY_OPTIONS.map(({ value, label, emoji, description }) => {
                    const isSelected = editVisibility === value;
                    return (
                      <Pressable
                        key={value}
                        onPress={() => setEditVisibility(value)}
                        style={({ pressed }) => ({
                          flex: 1,
                          alignItems: 'center',
                          backgroundColor: isSelected ? colors.primary : pressed ? colors.bgMid : colors.gray[50],
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.md,
                          borderRadius: borderRadius.md,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.primary : colors.bgDark,
                        })}
                      >
                        <Text style={{ fontSize: fontSize['3xl'], marginBottom: spacing.xs }}>{emoji}</Text>
                        <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold, color: isSelected ? colors.white : colors.text.inverse }}>
                          {label}
                        </Text>
                        <Text style={{ fontSize: fontSize.sm, fontFamily: fontFamily.body, color: isSelected ? colors.bgDark : colors.gray[400], marginTop: 2 }}>
                          {description}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Time & Servings */}
              <View style={{ marginBottom: spacing.xl }}>
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold, color: colors.gray[500], marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
                  Time & Servings
                </Text>
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.base, fontFamily: fontFamily.body, color: colors.gray[400], marginBottom: spacing.xs }}>Prep (min)</Text>
                    <TextInput
                      value={editPrepTime}
                      onChangeText={setEditPrepTime}
                      placeholder="—"
                      placeholderTextColor={colors.gray[300]}
                      keyboardType="number-pad"
                      style={{
                        backgroundColor: colors.gray[50],
                        borderRadius: borderRadius.md,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.md,
                        fontSize: fontSize['2xl'],
                        fontFamily: fontFamily.body,
                        color: colors.text.inverse,
                        textAlign: 'center',
                        borderWidth: 1,
                        borderColor: colors.bgDark,
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.base, fontFamily: fontFamily.body, color: colors.gray[400], marginBottom: spacing.xs }}>Cook (min)</Text>
                    <TextInput
                      value={editCookTime}
                      onChangeText={setEditCookTime}
                      placeholder="—"
                      placeholderTextColor={colors.gray[300]}
                      keyboardType="number-pad"
                      style={{
                        backgroundColor: colors.gray[50],
                        borderRadius: borderRadius.md,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.md,
                        fontSize: fontSize['2xl'],
                        fontFamily: fontFamily.body,
                        color: colors.text.inverse,
                        textAlign: 'center',
                        borderWidth: 1,
                        borderColor: colors.bgDark,
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.base, fontFamily: fontFamily.body, color: colors.gray[400], marginBottom: spacing.xs }}>Servings</Text>
                    <TextInput
                      value={editServings}
                      onChangeText={setEditServings}
                      placeholder="—"
                      placeholderTextColor={colors.gray[300]}
                      keyboardType="number-pad"
                      style={{
                        backgroundColor: colors.gray[50],
                        borderRadius: borderRadius.md,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.md,
                        fontSize: fontSize['2xl'],
                        fontFamily: fontFamily.body,
                        color: colors.text.inverse,
                        textAlign: 'center',
                        borderWidth: 1,
                        borderColor: colors.bgDark,
                      }}
                    />
                  </View>
                </View>
              </View>

              {/* Tags */}
              <View style={{ marginBottom: spacing.xl }}>
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold, color: colors.gray[500], marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
                  Tags
                </Text>

                {/* Add new tag input */}
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
                  <TextInput
                    value={newTag}
                    onChangeText={setNewTag}
                    placeholder="Add a tag..."
                    placeholderTextColor={colors.gray[400]}
                    autoCapitalize="none"
                    onSubmitEditing={handleAddTag}
                    returnKeyType="done"
                    style={{
                      flex: 1,
                      backgroundColor: colors.gray[50],
                      borderRadius: borderRadius.md,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.md,
                      fontSize: fontSize.xl,
                      fontFamily: fontFamily.body,
                      color: colors.text.inverse,
                      borderWidth: 1,
                      borderColor: colors.bgDark,
                    }}
                  />
                  <Pressable
                    onPress={handleAddTag}
                    disabled={!newTag.trim()}
                    style={({ pressed }) => ({
                      backgroundColor: newTag.trim() ? (pressed ? colors.primaryDark : colors.primary) : colors.gray[200],
                      paddingHorizontal: spacing.lg,
                      borderRadius: borderRadius.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                    })}
                  >
                    <Ionicons name="add" size={24} color={newTag.trim() ? colors.white : colors.gray[400]} />
                  </Pressable>
                </View>

                {/* Current tags */}
                {editTags && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {editTags.split(',').map((tag) => {
                      const trimmedTag = tag.trim();
                      if (!trimmedTag) return null;
                      return (
                        <View
                          key={trimmedTag}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: colors.primary,
                            paddingLeft: spacing.md,
                            paddingRight: spacing.xs,
                            paddingVertical: spacing.xs,
                            borderRadius: borderRadius.lg,
                          }}
                        >
                          <Text style={{ fontSize: fontSize.md, fontFamily: fontFamily.bodyMedium, color: colors.white, marginRight: spacing.xs }}>
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
                            <Ionicons name="close" size={14} color={colors.white} />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                )}

                {!editTags && (
                  <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.body, color: colors.gray[400], fontStyle: 'italic' }}>
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <View style={{ backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.xl, width: '100%', maxWidth: 400 }}>
            <Text style={{ fontSize: fontSize['2xl'], fontFamily: fontFamily.bodySemibold, color: colors.text.inverse, marginBottom: spacing.sm }}>
              Image URL
            </Text>
            <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.body, color: colors.gray[500], marginBottom: spacing.lg }}>
              Enter the URL of the image
            </Text>
            <TextInput
              value={imageUrlInput}
              onChangeText={setImageUrlInput}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor={colors.gray[400]}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={{
                borderWidth: 1,
                borderColor: colors.bgDark,
                borderRadius: borderRadius.sm,
                padding: spacing.md,
                fontSize: fontSize.xl,
                fontFamily: fontFamily.body,
                color: colors.text.inverse,
                marginBottom: spacing.lg,
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md }}>
              <Pressable
                onPress={() => setShowUrlModal(false)}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.xl,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.sm,
                  backgroundColor: pressed ? colors.gray[100] : 'transparent',
                })}
              >
                <Text style={{ fontSize: fontSize.xl, fontFamily: fontFamily.bodyMedium, color: colors.gray[500] }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (imageUrlInput.trim()) {
                    await saveImageUrl(imageUrlInput.trim());
                  }
                  setShowUrlModal(false);
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.xl,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.sm,
                  backgroundColor: pressed ? colors.primaryDark : colors.primary,
                })}
              >
                <Text style={{ fontSize: fontSize.xl, fontFamily: fontFamily.bodyMedium, color: colors.white }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
