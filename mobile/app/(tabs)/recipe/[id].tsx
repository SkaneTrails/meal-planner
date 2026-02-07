/**
 * Recipe detail screen.
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  Linking,
  Modal,
  ActivityIndicator,
  TextInput,
  Animated,
} from 'react-native';
import { showAlert, showNotification } from '@/lib/alert';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { shadows, borderRadius, colors, spacing, fontFamily, fontSize, letterSpacing } from '@/lib/theme';
import { MirroredBackground } from '@/components/MirroredBackground';
import { useRecipe, useDeleteRecipe, useUpdateRecipe, useSetMeal, useMealPlan, useCurrentUser } from '@/lib/hooks';
import { useHouseholds, useTransferRecipe } from '@/lib/hooks/use-admin';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSettings } from '@/lib/settings-context';
import { useTranslation } from '@/lib/i18n';
import { BouncingLoader, GradientBackground } from '@/components';
import { hapticLight, hapticSuccess, hapticWarning, hapticSelection } from '@/lib/haptics';
import type { DietLabel, MealLabel, MealType, StructuredInstruction, RecipeVisibility } from '@/lib/types';

// Blurhash placeholder for loading state
const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0teleV@';

// All diet label options (labels resolved via t() at render time)
const DIET_OPTIONS: { value: DietLabel | null; labelKey: string; emoji: string }[] = [
  { value: null, labelKey: 'labels.diet.none', emoji: '➖' },
  { value: 'veggie', labelKey: 'labels.diet.vegetarian', emoji: '🥬' },
  { value: 'fish', labelKey: 'labels.diet.seafood', emoji: '🐟' },
  { value: 'meat', labelKey: 'labels.diet.meat', emoji: '🥩' },
];

// Visibility options (labels resolved via t() at render time)
const VISIBILITY_OPTIONS: { value: RecipeVisibility; labelKey: string; emoji: string; descKey: string }[] = [
  { value: 'household', labelKey: 'labels.visibility.private', emoji: '🔒', descKey: 'labels.visibility.privateDesc' },
  { value: 'shared', labelKey: 'labels.visibility.shared', emoji: '🌍', descKey: 'labels.visibility.sharedDesc' },
];

// All meal label options (labels resolved via t() at render time)
const MEAL_OPTIONS: { value: MealLabel | null; labelKey: string }[] = [
  { value: null, labelKey: 'labels.meal.none' },
  { value: 'breakfast', labelKey: 'labels.meal.breakfast' },
  { value: 'starter', labelKey: 'labels.meal.starter' },
  { value: 'salad', labelKey: 'labels.meal.salad' },
  { value: 'meal', labelKey: 'labels.meal.mainCourse' },
  { value: 'dessert', labelKey: 'labels.meal.dessert' },
  { value: 'drink', labelKey: 'labels.meal.drink' },
  { value: 'sauce', labelKey: 'labels.meal.sauce' },
  { value: 'pickle', labelKey: 'labels.meal.pickle' },
  { value: 'grill', labelKey: 'labels.meal.grill' },
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

const MEAL_TYPES: { type: MealType; labelKey: string }[] = [
  { type: 'lunch', labelKey: 'labels.mealTime.lunch' },
  { type: 'dinner', labelKey: 'labels.mealTime.dinner' },
];

const DIET_LABELS: Record<DietLabel, { emoji: string; labelKey: string; color: string; bgColor: string }> = {
  veggie: { emoji: '🥬', labelKey: 'labels.diet.vegetarian', color: '#166534', bgColor: '#DCFCE7' },
  fish: { emoji: '🐟', labelKey: 'labels.diet.seafood', color: '#1E40AF', bgColor: '#DBEAFE' },
  meat: { emoji: '🥩', labelKey: 'labels.diet.meat', color: '#991B1B', bgColor: '#FEE2E2' },
};

const MEAL_LABEL_KEYS: Record<MealLabel, string> = {
  breakfast: 'labels.meal.breakfast',
  starter: 'labels.meal.starter',
  salad: 'labels.meal.salad',
  meal: 'labels.meal.mainCourse',
  dessert: 'labels.meal.dessert',
  drink: 'labels.meal.drink',
  sauce: 'labels.meal.sauce',
  pickle: 'labels.meal.pickle',
  grill: 'labels.meal.grill',
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
          backgroundColor: isThumbDown ? 'rgba(239, 83, 80, 0.3)' : pressed ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
        })}
      >
        <Ionicons
          name={isThumbDown ? 'thumbs-down' : 'thumbs-down-outline'}
          size={size}
          color={colors.white}
        />
      </Pressable>
      <Pressable
        onPress={onThumbUp}
        style={({ pressed }) => ({
          padding: spacing.sm,
          borderRadius: 20,
          backgroundColor: isThumbUp ? 'rgba(76, 175, 80, 0.3)' : pressed ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
        })}
      >
        <Ionicons
          name={isThumbUp ? 'thumbs-up' : 'thumbs-up-outline'}
          size={size}
          color={colors.white}
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
  stepNumber?: number; // Computed sequential number for timeline+step items
}

function InstructionItem({ instruction, index, isCompleted, onToggle, stepNumber }: InstructionItemProps) {
  const { type, content, time } = instruction;

  // Inline tip - compact indented terracotta callout (not numbered)
  if (type === 'tip') {
    return (
      <View style={{
        marginLeft: 44,
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.55)',
        borderRadius: borderRadius.sm,
        marginBottom: spacing.sm,
        borderLeftWidth: 2,
        borderLeftColor: '#C4704B',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}>
        <Ionicons name="bulb-outline" size={15} color="#C4704B" style={{ marginRight: spacing.sm, marginTop: 2 }} />
        <Text style={{
          flex: 1,
          fontSize: fontSize.md,
          fontFamily: fontFamily.body,
          color: '#5D4037',
          lineHeight: 20,
          fontStyle: 'italic',
        }}>
          {content}
        </Text>
      </View>
    );
  }

  // Section heading - visual divider (not numbered)
  if (type === 'heading') {
    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: index > 0 ? spacing.xl : spacing.sm,
        marginBottom: spacing.md,
        paddingVertical: spacing.sm,
      }}>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(139, 115, 85, 0.2)' }} />
        <Text style={{
          fontSize: fontSize['2xl'],
          fontFamily: fontFamily.displayBold,
          color: '#5D4037',
          letterSpacing: letterSpacing.normal,
          paddingHorizontal: spacing.md,
        }}>
          {content}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(139, 115, 85, 0.2)' }} />
      </View>
    );
  }

  // Unified step (both 'timeline' and 'step' types)
  // Timeline entries have a time value, regular steps don't
  const hasTime = type === 'timeline' && time !== null && time !== undefined;
  const displayNumber = stepNumber ?? 1;

  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        backgroundColor: isCompleted
          ? colors.successBg
          : (pressed ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.5)'),
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        opacity: isCompleted ? 0.7 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      })}
    >
      <View style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: isCompleted ? colors.success : '#5D4037',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
        marginTop: 2,
      }}>
        {isCompleted ? (
          <Ionicons name="checkmark" size={18} color={colors.white} />
        ) : (
          <Text style={{ color: colors.white, fontSize: fontSize.lg, fontFamily: fontFamily.bodyBold }}>{displayNumber}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        {/* Time pill - only for timeline entries with time */}
        {hasTime && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#2D6A5A',
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 10,
            alignSelf: 'flex-start',
            marginBottom: spacing.xs,
          }}>
            <Ionicons name="time-outline" size={11} color={colors.white} />
            <Text style={{
              fontSize: fontSize.sm,
              fontFamily: fontFamily.bodySemibold,
              color: colors.white,
              marginLeft: 4,
            }}>
              {time} min
            </Text>
          </View>
        )}
        <Text style={{
          fontSize: fontSize.xl,
          fontFamily: fontFamily.body,
          color: isCompleted ? '#166534' : '#5D4037',
          lineHeight: 22,
          textDecorationLine: isCompleted ? 'line-through' : 'none',
        }}>
          {content}
        </Text>
      </View>
    </Pressable>
  );
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const isAuthReady = !authLoading && !!user;
  const { t } = useTranslation();

  // Favorites
  const { isFavorite, toggleFavorite } = useSettings();
  const isRecipeFavorite = id ? isFavorite(id) : false;

  // Parallax scroll animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_HEIGHT = 350;

  const { data: enhancedRecipe, isLoading, error } = useRecipe(id);
  const recipe = enhancedRecipe;

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
  const [editHouseholdId, setEditHouseholdId] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [newTag, setNewTag] = useState('');
  // URL input modal state (for cross-platform support)
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Household data for superuser transfer feature
  const isSuperuser = currentUser?.role === 'superuser';
  const { data: households } = useHouseholds({ enabled: isSuperuser });
  const transferRecipe = useTransferRecipe();

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
      setEditHouseholdId(recipe.household_id || null);
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
      });
      setShowEditModal(false);
      showNotification(t('recipe.saved'), t('recipe.recipeUpdated'));
    } catch {
      showNotification(t('common.error'), t('recipe.failedToSave'));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleTransferRecipe = async (targetHouseholdId: string) => {
    if (!id || !recipe) return;

    const targetHousehold = households?.find(h => h.id === targetHouseholdId);
    if (!targetHousehold) return;

    showAlert(
      t('recipe.transferRecipe'),
      t('recipe.transferConfirm', { title: recipe.title, household: targetHousehold.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('recipe.transfer'),
          onPress: async () => {
            setIsTransferring(true);
            try {
              await transferRecipe.mutateAsync({
                recipeId: id,
                targetHouseholdId,
              });
              setEditHouseholdId(targetHouseholdId);
              setShowEditModal(false);
              hapticSuccess();
              showNotification(t('recipe.transferred'), t('recipe.transferredTo', { household: targetHousehold.name }));
            } catch {
              hapticWarning();
              showNotification(t('common.error'), t('recipe.failedToTransfer'));
            } finally {
              setIsTransferring(false);
            }
          },
        },
      ]
    );
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
    showAlert(
      t('recipe.changePhoto'),
      t('recipe.chooseOption'),
      [
        {
          text: t('recipe.takePhoto'),
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              showNotification(t('recipe.permissionNeeded'), t('recipe.cameraPermission'));
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
          text: t('recipe.chooseFromLibrary'),
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              showNotification(t('recipe.permissionNeeded'), t('recipe.libraryPermission'));
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
          text: t('recipe.enterUrl'),
          onPress: () => {
            // Use cross-platform modal instead of iOS-only Alert.prompt
            setImageUrlInput(recipe?.image_url || '');
            setShowUrlModal(true);
          },
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const saveImage = async (localUri: string) => {
    // Upload to cloud storage via API
    setIsUpdatingImage(true);
    try {
      const { api } = await import('@/lib/api');
      await api.uploadRecipeImage(id!, localUri);
      // Refetch the recipe to get updated image URL
      // The mutation will invalidate the cache
      await updateRecipe.mutateAsync({
        id: id!,
        updates: {}, // Empty update just to trigger cache refresh
      });
      showNotification(t('common.success'), t('recipe.photoUploaded'));
    } catch (err) {
      // Fallback: save local URI if upload fails
      console.warn('Upload failed, saving local URI:', err);
      try {
        await updateRecipe.mutateAsync({
          id: id!,
          updates: { image_url: localUri },
        });
        showNotification(t('recipe.savedLocally'), t('recipe.savedLocallyMessage'));
      } catch {
        showNotification(t('common.error'), t('recipe.failedToUpdatePhoto'));
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
      });
      showNotification(t('common.success'), t('recipe.photoUpdated'));
    } catch {
      showNotification(t('common.error'), t('recipe.failedToUpdatePhoto'));
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
      const localizedMealType = t(`selectRecipe.mealTypeLabels.${mealType}`);
      showNotification(t('recipe.addedToMealPlan'), t('recipe.addedToMealPlanMessage', { title: recipe?.title ?? '', mealType: localizedMealType, date: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) }));
    } catch {
      showNotification(t('common.error'), t('recipe.failedToAddToMealPlan'));
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
      showNotification(t('common.error'), t('recipe.failedToClearMeal'));
    }
  };

  const handleThumbUp = async () => {
    if (!id || !recipe) return;

    // Ensure current user is loaded before checking ownership
    if (!currentUser) {
      showNotification(t('recipe.pleaseWait'), t('recipe.loadingAccount'));
      return;
    }

    // Check ownership - only allow rating own recipes
    const isOwned = recipe.household_id === currentUser.household_id;
    if (!isOwned) {
      showNotification(t('recipe.cannotRate'), t('recipe.cannotRateMessage'));
      return;
    }

    hapticSuccess();
    try {
      // Toggle: if already thumbs up, clear rating; otherwise set to 5
      const newRating = recipe.rating === 5 ? null : 5;
      await updateRecipe.mutateAsync({
        id,
        updates: { rating: newRating },
      });
    } catch (err) {
      showNotification(t('common.error'), t('recipe.failedToUpdateRating'));
    }
  };

  const handleThumbDown = () => {
    if (!id || !recipe) return;

    // Ensure current user is loaded before checking ownership
    if (!currentUser) {
      showNotification(t('recipe.pleaseWait'), t('recipe.loadingAccount'));
      return;
    }

    // Check ownership - only allow rating own recipes
    const isOwned = recipe.household_id === currentUser.household_id;
    if (!isOwned) {
      showNotification(t('recipe.cannotRate'), t('recipe.cannotRateMessage'));
      return;
    }

    hapticWarning();
    // If already thumbs down, ask to delete
    if (recipe.rating === 1) {
      showAlert(
        t('recipe.deleteRecipe'),
        t('recipe.deleteConfirm', { title: recipe.title }),
        [
          { text: t('recipe.keepIt'), style: 'cancel' },
          {
            text: t('recipe.yesDelete'),
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteRecipe.mutateAsync(id);
                router.back();
              } catch (err) {
                showNotification(t('common.error'), t('recipe.failedToDelete'));
              }
            },
          },
        ]
      );
    } else {
      // First thumb down - just mark it
      showAlert(
        t('recipe.notFavorite'),
        t('recipe.notFavoriteMessage'),
        [
          {
            text: t('recipe.justMarkNotFavorite'),
            style: 'cancel',
            onPress: async () => {
              try {
                await updateRecipe.mutateAsync({
                  id,
                  updates: { rating: 1 },
                });
              } catch (err) {
                showNotification(t('common.error'), t('recipe.failedToUpdateRating'));
              }
            }
          },
          {
            text: t('recipe.yesDelete'),
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteRecipe.mutateAsync(id);
                router.back();
              } catch (err) {
                showNotification(t('common.error'), t('recipe.failedToDelete'));
              }
            },
          },
        ]
      );
    }
  };

  const handleDelete = () => {
    showAlert(
      t('recipe.deleteRecipe'),
      t('recipe.deleteConfirm', { title: recipe?.title ?? '' }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe.mutateAsync(id);
              router.back();
            } catch (err) {
              showNotification(t('common.error'), t('recipe.failedToDelete'));
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
        message: t('recipe.shareMessage', { title: recipe.title, url: recipe.url || '' }),
        url: recipe.url,
      });
    } catch (err) {
      // User cancelled
    }
  };

  if (isLoading) {
    return (
      <GradientBackground style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          width: 96,
          height: 96,
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}>
          <BouncingLoader size={14} />
        </View>
        <Text style={{ color: colors.text.primary, fontSize: fontSize['2xl'], fontFamily: fontFamily.displayBold }}>{t('recipe.loading')}</Text>
      </GradientBackground>
    );
  }

  if (error || !recipe) {
    return (
      <GradientBackground style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <View style={{
          width: 96,
          height: 96,
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xl,
        }}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.text.primary} />
        </View>
        <Text style={{ color: colors.text.primary, fontSize: 32, fontFamily: fontFamily.displayBold, marginBottom: spacing.sm }}>{t('recipe.notFound')}</Text>
        <Text style={{ color: colors.text.secondary, fontSize: fontSize.lg, fontFamily: fontFamily.body, marginTop: spacing.sm, textAlign: 'center' }}>{t('recipe.notFoundMessage')}</Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            marginTop: spacing.xl,
            paddingHorizontal: 28,
            paddingVertical: spacing.lg,
            backgroundColor: pressed ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.5)',
            borderRadius: borderRadius.lg,
          })}
        >
          <Text style={{ color: colors.text.primary, fontSize: fontSize.xl, fontFamily: fontFamily.bodySemibold }}>{t('common.goBack')}</Text>
        </Pressable>
      </GradientBackground>
    );
  }

  const totalTime = recipe.total_time ||
    (recipe.prep_time && recipe.cook_time ? recipe.prep_time + recipe.cook_time : null) ||
    recipe.prep_time ||
    recipe.cook_time;

  return (
    <GradientBackground style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: '',
          headerShown: true,
          headerStyle: { backgroundColor: 'transparent' },
          headerTransparent: true,
          headerTintColor: colors.white,
          headerBackTitle: '',
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace('/(tabs)/recipes')}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: spacing.sm,
              }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </Pressable>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Pressable
                onPress={() => {
                  hapticLight();
                  if (id) toggleFavorite(id);
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={isRecipeFavorite ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isRecipeFavorite ? colors.coral : colors.white}
                />
              </Pressable>
              <Pressable
                onPress={handleDelete}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="trash-outline" size={22} color={colors.white} />
              </Pressable>
            </View>
          ),
        }}
      />

      <Animated.ScrollView
        style={{ flex: 1 }}
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
              backgroundColor: pressed ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.3)',
              borderRadius: borderRadius.xl,
              width: 48,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            {isUpdatingImage ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="camera" size={22} color={colors.white} />
            )}
          </Pressable>
        </Animated.View>

        {/* Content with background image */}
        <MirroredBackground
          source={require('@/assets/images/background2.png')}
          tileCount={4}
          style={{
            marginTop: -48,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            flex: 1,
            width: '100%',
            minWidth: '100%',
          }}
          borderTopLeftRadius={32}
          borderTopRightRadius={32}
        >
          <View style={{
            padding: spacing.xl,
            paddingBottom: 120,
            maxWidth: 720,
            alignSelf: 'center',
            width: '100%',
          }}>
          {/* Title and rating */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={{ fontSize: fontSize['4xl'], fontFamily: fontFamily.display, color: colors.white, letterSpacing: letterSpacing.tight, flex: 1, marginRight: spacing.md }}>
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
              const isOwned = currentUser ? recipe.household_id === currentUser.household_id : undefined;
              // While currentUser is loading, disable the button without showing 'not owned' state
              const canEdit = isOwned === true;
              return (
                <Pressable
                  onPress={canEdit ? openEditModal : () => showNotification(t('recipe.cannotEdit'), t('recipe.cannotEditMessage'))}
                  style={({ pressed }) => ({
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: pressed ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.7)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: canEdit ? 1 : 0.5,
                  })}
                >
                  <Ionicons name="create" size={20} color={colors.text.inverse} />
                </Pressable>
              );
            })()}
            <Pressable
              onPress={() => setShowPlanModal(true)}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: pressed ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.7)',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Ionicons name="calendar" size={20} color={colors.text.inverse} />
            </Pressable>
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: pressed ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.7)',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Ionicons name="share" size={20} color={colors.text.inverse} />
            </Pressable>
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
                  {t(`labels.diet.${recipe.diet_label}` as 'labels.diet.veggie')}
                </Text>
              </View>
            )}
            {recipe.meal_label && (
              <View style={{ backgroundColor: colors.bgDark, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20 }}>
                <Text style={{ fontSize: fontSize.md, fontFamily: fontFamily.bodySemibold, color: colors.text.inverse }}>
                  {t(`labels.meal.${recipe.meal_label}` as 'labels.meal.meal')}
                </Text>
              </View>
            )}
          </View>

          {/* Time and servings - compact */}
          <View style={{
            flexDirection: 'row',
            marginTop: spacing.lg,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            borderRadius: borderRadius.lg,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.sm,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          }}>
            {recipe.prep_time && (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Ionicons name="timer" size={18} color="#5D4037" />
                <Text style={{ fontSize: fontSize.sm, color: '#8B7355', marginTop: spacing.xs }}>{t('labels.time.prep')}</Text>
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodyBold, color: '#5D4037' }}>
                  {recipe.prep_time}m
                </Text>
              </View>
            )}
            {recipe.cook_time && (
              <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: recipe.prep_time ? 1 : 0, borderLeftColor: 'rgba(139, 115, 85, 0.15)' }}>
                <Ionicons name="flame" size={18} color="#5D4037" />
                <Text style={{ fontSize: fontSize.sm, color: '#8B7355', marginTop: spacing.xs }}>{t('labels.time.cook')}</Text>
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodyBold, color: '#5D4037' }}>
                  {recipe.cook_time}m
                </Text>
              </View>
            )}
            {totalTime && (
              <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: (recipe.prep_time || recipe.cook_time) ? 1 : 0, borderLeftColor: 'rgba(139, 115, 85, 0.15)' }}>
                <Ionicons name="time" size={18} color="#5D4037" />
                <Text style={{ fontSize: fontSize.sm, color: '#8B7355', marginTop: spacing.xs }}>{t('labels.time.total')}</Text>
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodyBold, color: '#5D4037' }}>
                  {totalTime}m
                </Text>
              </View>
            )}
            {recipe.servings && (
              <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: (recipe.prep_time || recipe.cook_time || totalTime) ? 1 : 0, borderLeftColor: 'rgba(139, 115, 85, 0.15)' }}>
                <Ionicons name="people" size={18} color="#5D4037" />
                <Text style={{ fontSize: fontSize.sm, color: '#8B7355', marginTop: spacing.xs }}>{t('labels.time.serves')}</Text>
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodyBold, color: '#5D4037' }}>
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
                  style={{ backgroundColor: 'rgba(93, 64, 55, 0.65)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.lg }}
                >
                  <Text style={{ fontSize: fontSize.base, fontFamily: fontFamily.bodySemibold, color: colors.white }}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Ingredients */}
          <View style={{ marginTop: spacing.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.35)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 }}>
                <Ionicons name="list" size={18} color="#5D4037" />
              </View>
              <Text style={{ fontSize: fontSize['3xl'], fontFamily: fontFamily.display, color: colors.white, letterSpacing: letterSpacing.normal }}>
                {t('recipe.ingredients')}
              </Text>
            </View>
            {recipe.ingredients.length === 0 ? (
              <Text style={{ color: colors.gray[500], fontSize: fontSize.xl, fontStyle: 'italic' }}>{t('recipe.noIngredients')}</Text>
            ) : (
              <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: borderRadius.lg, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
                {recipe.ingredients.map((ingredient, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      paddingVertical: spacing.sm,
                      borderBottomWidth: index < recipe.ingredients.length - 1 ? 1 : 0,
                      borderBottomColor: 'rgba(139, 115, 85, 0.15)',
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
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.35)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 }}>
                <Ionicons name="book" size={18} color="#5D4037" />
              </View>
              <Text style={{ fontSize: fontSize['3xl'], fontFamily: fontFamily.display, color: colors.white, letterSpacing: letterSpacing.normal }}>
                {t('recipe.instructions')}
              </Text>
              {completedSteps.size > 0 && recipe.instructions.length > 0 && (
                <Text style={{ marginLeft: 'auto', fontSize: fontSize.md, color: colors.success, fontFamily: fontFamily.bodyMedium }}>
                  {t('recipe.stepsDone', { completed: completedSteps.size, total: recipe.instructions.length })}
                </Text>
              )}
            </View>
            {recipe.instructions.length === 0 ? (
              <Text style={{ color: colors.gray[500], fontSize: fontSize.xl, fontStyle: 'italic' }}>{t('recipe.noInstructions')}</Text>
            ) : recipe.structured_instructions ? (
              // Structured instructions with visual timeline
              <View style={{ position: 'relative' }}>
                {/* Vertical timeline line */}
                <View style={{
                  position: 'absolute',
                  left: 27,
                  top: 24,
                  bottom: 24,
                  width: 2,
                  backgroundColor: 'rgba(45, 106, 90, 0.15)',
                  borderRadius: 1,
                }} />
                {(() => {
                  let stepCounter = 0;
                  return recipe.structured_instructions.map((instruction, index) => {
                    // Only count timeline and step types as numbered steps
                    const isNumbered = instruction.type === 'timeline' || instruction.type === 'step';
                    if (isNumbered) stepCounter++;
                    return (
                      <InstructionItem
                        key={index}
                        instruction={instruction}
                        index={index}
                        isCompleted={completedSteps.has(index)}
                        onToggle={() => toggleStep(index)}
                        stepNumber={isNumbered ? stepCounter : undefined}
                      />
                    );
                  });
                })()}
              </View>
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
          {recipe.enhanced && recipe.tips && (
            <View style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.35)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 }}>
                  <Ionicons name="bulb-outline" size={18} color="#5D4037" />
                </View>
                <Text style={{ fontSize: fontSize['3xl'], fontFamily: fontFamily.display, color: colors.white, letterSpacing: letterSpacing.normal }}>
                  {t('recipe.tips')}
                </Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: borderRadius.lg, padding: spacing.lg, borderLeftWidth: 4, borderLeftColor: '#C4704B', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
                <Text style={{ fontSize: fontSize.xl, fontFamily: fontFamily.body, color: colors.text.inverse, lineHeight: 24 }}>
                  {recipe.tips}
                </Text>
              </View>
            </View>
          )}

          {/* Changes made (only for enhanced recipes, collapsible - closed glass section) */}
          {recipe.enhanced && recipe.changes_made && recipe.changes_made.length > 0 && (
            <View style={{ marginBottom: spacing.xl, backgroundColor: 'rgba(255, 255, 255, 0.5)', borderRadius: borderRadius.lg, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
              <Pressable
                onPress={() => setShowAiChanges(!showAiChanges)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: spacing.lg,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.35)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 }}>
                  <Ionicons name="sparkles" size={18} color="#2D6A5A" />
                </View>
                <Text style={{ fontSize: fontSize['3xl'], fontFamily: fontFamily.display, color: '#5D4037', letterSpacing: letterSpacing.normal, flex: 1 }}>
                  {t('recipe.aiImprovements')}
                </Text>
                <Ionicons
                  name={showAiChanges ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#5D4037"
                />
              </Pressable>
              {showAiChanges && (
                <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, borderTopWidth: 1, borderTopColor: 'rgba(139, 115, 85, 0.15)', paddingTop: spacing.md }}>
                  {recipe.changes_made.map((change, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: index < recipe.changes_made!.length - 1 ? spacing.sm : 0 }}>
                      <Ionicons name="checkmark-circle" size={18} color="#2D6A5A" style={{ marginRight: spacing.sm, marginTop: 2 }} />
                      <Text style={{ flex: 1, fontSize: fontSize.lg, fontFamily: fontFamily.body, color: '#5D4037', lineHeight: 20 }}>
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
                showNotification(t('common.error'), t('recipe.couldNotOpenUrl'));
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
              <Ionicons name="link" size={18} color={colors.text.inverse} />
              <Text style={{ color: colors.text.inverse, marginLeft: spacing.sm, fontSize: fontSize.xl, fontFamily: fontFamily.bodyMedium }} numberOfLines={1}>
                {t('recipe.viewOriginal')}
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
              marginBottom: 100, // Extra padding for bottom tab bar
              backgroundColor: pressed ? colors.primaryDark : colors.primary,
              borderRadius: borderRadius.sm,
              ...shadows.md,
            })}
          >
            <Ionicons name="calendar" size={20} color={colors.white} />
            <Text style={{ color: colors.white, marginLeft: spacing.sm, fontSize: fontSize['2xl'], fontFamily: fontFamily.bodySemibold }}>
              {t('recipe.addToMealPlan')}
            </Text>
          </Pressable>
          </View>
        </MirroredBackground>
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
              <Text style={{ fontSize: fontSize['3xl'], fontFamily: fontFamily.display, color: colors.text.inverse }}>{t('recipe.addToMealPlan')}</Text>
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
                {weekOffset === 0 ? t('recipe.thisWeek') : t('recipe.nextWeek')}
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
              {t('recipe.selectDayPrompt', { title: recipe.title })}
            </Text>

            <ScrollView style={{ paddingHorizontal: spacing.xl }}>
              {weekDates.map((date) => {
                const isToday = date.toDateString() === new Date().toDateString();
                const isPast = isPastDate(date);
                const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
                const monthDay = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                return (
                  <View key={date.toISOString()} style={{ marginBottom: spacing.lg, opacity: isPast ? 0.4 : 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                      {isToday && (
                        <View style={{ backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm, marginRight: spacing.sm }}>
                          <Text style={{ fontSize: fontSize.sm, fontFamily: fontFamily.bodyBold, color: colors.white }}>{t('recipe.today')}</Text>
                        </View>
                      )}
                      <Text style={{ fontSize: fontSize.xl, fontFamily: fontFamily.bodySemibold, color: isToday ? colors.text.inverse : colors.gray[500] }}>
                        {dayName} · {monthDay}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      {MEAL_TYPES.map(({ type, labelKey }) => {
                        const existingMeal = getMealForSlot(date, type);
                        const isTaken = !!existingMeal;
                        const translatedLabel = t(labelKey);

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
                                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold, color: colors.text.inverse }}>{translatedLabel}</Text>
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
              <Text style={{ fontSize: fontSize['3xl'], fontFamily: fontFamily.display, color: colors.text.inverse }}>{t('recipe.editRecipe')}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Pressable
                  onPress={() => setShowEditModal(false)}
                  style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}
                >
                  <Text style={{ fontSize: fontSize.xl, fontFamily: fontFamily.body, color: colors.gray[500] }}>{t('common.cancel')}</Text>
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
                    <Text style={{ fontSize: fontSize.xl, fontFamily: fontFamily.bodySemibold, color: colors.white }}>{t('common.save')}</Text>
                  )}
                </Pressable>
              </View>
            </View>

            <ScrollView style={{ paddingHorizontal: spacing.xl }} keyboardShouldPersistTaps="handled">
              {/* Diet Type */}
              <View style={{ marginBottom: spacing.xl }}>
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold, color: colors.gray[500], marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
                  {t('recipe.dietType')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {DIET_OPTIONS.map(({ value, labelKey, emoji }) => {
                    const isSelected = editDietLabel === value;
                    const translatedLabel = t(labelKey);
                    return (
                      <Pressable
                        key={labelKey}
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
                          {translatedLabel}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Meal Type */}
              <View style={{ marginBottom: spacing.xl }}>
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold, color: colors.gray[500], marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
                  {t('recipe.mealTypeLabel')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {MEAL_OPTIONS.map(({ value, labelKey }) => {
                    const isSelected = editMealLabel === value;
                    const translatedLabel = t(labelKey);
                    return (
                      <Pressable
                        key={labelKey}
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
                          {translatedLabel}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Visibility */}
              <View style={{ marginBottom: spacing.xl }}>
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold, color: colors.gray[500], marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
                  {t('recipe.visibilityLabel')}
                </Text>
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  {VISIBILITY_OPTIONS.map(({ value, labelKey, emoji, descKey }) => {
                    const isSelected = editVisibility === value;
                    const translatedLabel = t(labelKey);
                    const translatedDesc = t(descKey);
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
                          {translatedLabel}
                        </Text>
                        <Text style={{ fontSize: fontSize.sm, fontFamily: fontFamily.body, color: isSelected ? colors.bgDark : colors.gray[400], marginTop: 2 }}>
                          {translatedDesc}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Household Transfer (Superuser only) */}
              {isSuperuser && households && households.length > 0 && (
                <View style={{ marginBottom: spacing.xl }}>
                  <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold, color: colors.gray[500], marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
                    {t('recipe.household')}
                  </Text>
                  <Text style={{ fontSize: fontSize.sm, fontFamily: fontFamily.body, color: colors.gray[400], marginBottom: spacing.md }}>
                    {t('recipe.transferDescription')}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {households.map((household) => {
                      const isCurrentHousehold = editHouseholdId === household.id;
                      return (
                        <Pressable
                          key={household.id}
                          onPress={() => !isCurrentHousehold && handleTransferRecipe(household.id)}
                          disabled={isCurrentHousehold || isTransferring}
                          style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: isCurrentHousehold ? colors.primary : pressed ? colors.bgMid : colors.gray[50],
                            paddingHorizontal: spacing.md,
                            paddingVertical: spacing.sm,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: isCurrentHousehold ? colors.primary : colors.bgDark,
                            opacity: isTransferring && !isCurrentHousehold ? 0.5 : 1,
                          })}
                        >
                          {isCurrentHousehold && (
                            <Ionicons name="checkmark-circle" size={16} color={colors.white} style={{ marginRight: spacing.xs }} />
                          )}
                          <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodyMedium, color: isCurrentHousehold ? colors.white : colors.text.inverse }}>
                            {household.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                    {/* Show "Unassigned" option for legacy recipes */}
                    {!editHouseholdId && (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.gray[200],
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: colors.gray[300],
                      }}>
                        <Ionicons name="help-circle-outline" size={16} color={colors.gray[500]} style={{ marginRight: spacing.xs }} />
                        <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodyMedium, color: colors.gray[500] }}>
                          {t('recipe.unassigned')}
                        </Text>
                      </View>
                    )}
                  </View>
                  {isTransferring && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={{ fontSize: fontSize.sm, fontFamily: fontFamily.body, color: colors.gray[400], marginLeft: spacing.xs }}>
                        {t('recipe.transferring')}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Time & Servings */}
              <View style={{ marginBottom: spacing.xl }}>
                <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.bodySemibold, color: colors.gray[500], marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: letterSpacing.wide }}>
                  {t('recipe.timeAndServings')}
                </Text>
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.base, fontFamily: fontFamily.body, color: colors.gray[400], marginBottom: spacing.xs }}>{t('labels.time.prepMin')}</Text>
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
                    <Text style={{ fontSize: fontSize.base, fontFamily: fontFamily.body, color: colors.gray[400], marginBottom: spacing.xs }}>{t('labels.time.cookMin')}</Text>
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
                    <Text style={{ fontSize: fontSize.base, fontFamily: fontFamily.body, color: colors.gray[400], marginBottom: spacing.xs }}>{t('labels.time.servings')}</Text>
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
                  {t('recipe.tags')}
                </Text>

                {/* Add new tag input */}
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
                  <TextInput
                    value={newTag}
                    onChangeText={setNewTag}
                    placeholder={t('recipe.addTag')}
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
                    {t('recipe.noTags')}
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
              {t('recipe.imageUrl')}
            </Text>
            <Text style={{ fontSize: fontSize.lg, fontFamily: fontFamily.body, color: colors.gray[500], marginBottom: spacing.lg }}>
              {t('recipe.imageUrlPrompt')}
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
                <Text style={{ fontSize: fontSize.xl, fontFamily: fontFamily.bodyMedium, color: colors.gray[500] }}>{t('common.cancel')}</Text>
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
                <Text style={{ fontSize: fontSize.xl, fontFamily: fontFamily.bodyMedium, color: colors.white }}>{t('common.save')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </GradientBackground>
  );
}
