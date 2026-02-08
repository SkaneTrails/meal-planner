import { Share } from 'react-native';
import { useRouter } from 'expo-router';
import { showAlert, showNotification } from '@/lib/alert';
import { useDeleteRecipe, useUpdateRecipe, useSetMeal, useCurrentUser, useImagePicker } from '@/lib/hooks';
import { useHouseholds, useTransferRecipe } from '@/lib/hooks/use-admin';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTranslation } from '@/lib/i18n';
import { formatDateLocal } from '@/lib/utils/dateFormatter';
import { hapticLight, hapticSuccess, hapticWarning } from '@/lib/haptics';
import type { MealType, Recipe, DietLabel, MealLabel, RecipeVisibility } from '@/lib/types';
import { useState } from 'react';

interface EditUpdates {
  dietLabel: DietLabel | null;
  mealLabel: MealLabel | null;
  prepTime: string;
  cookTime: string;
  servings: string;
  tags: string;
  visibility: RecipeVisibility;
}

export const useRecipeActions = (id: string | undefined, recipe: Recipe | undefined) => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const isAuthReady = !authLoading && !!user;
  const { t } = useTranslation();

  const { data: currentUser } = useCurrentUser({ enabled: isAuthReady });
  const deleteRecipe = useDeleteRecipe();
  const updateRecipe = useUpdateRecipe();
  const setMeal = useSetMeal();

  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const isSuperuser = currentUser?.role === 'superuser';
  const { data: households } = useHouseholds({ enabled: isSuperuser });
  const transferRecipe = useTransferRecipe();

  const isOwned = currentUser ? recipe?.household_id === currentUser.household_id : undefined;
  const canEdit = isOwned === true;

  const saveImage = async (localUri: string) => {
    setIsUpdatingImage(true);
    try {
      const { api } = await import('@/lib/api');
      await api.uploadRecipeImage(id!, localUri);
      await updateRecipe.mutateAsync({ id: id!, updates: {} });
      showNotification(t('common.success'), t('recipe.photoUploaded'));
    } catch (err) {
      console.warn('Upload failed, saving local URI:', err);
      try {
        await updateRecipe.mutateAsync({ id: id!, updates: { image_url: localUri } });
        showNotification(t('recipe.savedLocally'), t('recipe.savedLocallyMessage'));
      } catch {
        showNotification(t('common.error'), t('recipe.failedToUpdatePhoto'));
      }
    } finally {
      setIsUpdatingImage(false);
    }
  };

  const { pickImage: handlePickImage } = useImagePicker(
    (uri) => saveImage(uri),
    {
      aspect: [16, 9],
      showUrlOption: true,
      onUrlOptionSelected: () => setShowUrlModal(true),
    },
  );

  const saveImageUrl = async (url: string) => {
    setIsUpdatingImage(true);
    try {
      await updateRecipe.mutateAsync({ id: id!, updates: { image_url: url } });
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
      await setMeal.mutateAsync({ date: formatDateLocal(date), mealType, recipeId: id });
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
      await setMeal.mutateAsync({ date: formatDateLocal(date), mealType, recipeId: undefined });
    } catch {
      showNotification(t('common.error'), t('recipe.failedToClearMeal'));
    }
  };

  const handleThumbUp = async () => {
    if (!id || !recipe) return;
    if (!currentUser) {
      showNotification(t('recipe.pleaseWait'), t('recipe.loadingAccount'));
      return;
    }
    if (recipe.household_id !== currentUser.household_id) {
      showNotification(t('recipe.cannotRate'), t('recipe.cannotRateMessage'));
      return;
    }
    hapticSuccess();
    try {
      const newRating = recipe.rating === 5 ? null : 5;
      await updateRecipe.mutateAsync({ id, updates: { rating: newRating } });
    } catch {
      showNotification(t('common.error'), t('recipe.failedToUpdateRating'));
    }
  };

  const handleThumbDown = () => {
    if (!id || !recipe) return;
    if (!currentUser) {
      showNotification(t('recipe.pleaseWait'), t('recipe.loadingAccount'));
      return;
    }
    if (recipe.household_id !== currentUser.household_id) {
      showNotification(t('recipe.cannotRate'), t('recipe.cannotRateMessage'));
      return;
    }
    hapticWarning();
    if (recipe.rating === 1) {
      showAlert(t('recipe.deleteRecipe'), t('recipe.deleteConfirm', { title: recipe.title }), [
        { text: t('recipe.keepIt'), style: 'cancel' },
        {
          text: t('recipe.yesDelete'),
          style: 'destructive',
          onPress: async () => {
            try { await deleteRecipe.mutateAsync(id!); router.back(); } catch { showNotification(t('common.error'), t('recipe.failedToDelete')); }
          },
        },
      ]);
    } else {
      showAlert(t('recipe.notFavorite'), t('recipe.notFavoriteMessage'), [
        {
          text: t('recipe.justMarkNotFavorite'),
          style: 'cancel',
          onPress: async () => {
            try { await updateRecipe.mutateAsync({ id, updates: { rating: 1 } }); } catch { showNotification(t('common.error'), t('recipe.failedToUpdateRating')); }
          },
        },
        {
          text: t('recipe.yesDelete'),
          style: 'destructive',
          onPress: async () => {
            try { await deleteRecipe.mutateAsync(id!); router.back(); } catch { showNotification(t('common.error'), t('recipe.failedToDelete')); }
          },
        },
      ]);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    showAlert(t('recipe.deleteRecipe'), t('recipe.deleteConfirm', { title: recipe?.title ?? '' }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try { await deleteRecipe.mutateAsync(id); router.back(); } catch { showNotification(t('common.error'), t('recipe.failedToDelete')); }
        },
      },
    ]);
  };

  const handleShare = async () => {
    if (!recipe) return;
    try {
      await Share.share({
        title: recipe.title,
        message: t('recipe.shareMessage', { title: recipe.title, url: recipe.url || '' }),
        url: recipe.url,
      });
    } catch {
      // User cancelled
    }
  };

  const handleSaveEdit = async (updates: EditUpdates) => {
    if (!id) return;
    try {
      const tagsArray = updates.tags
        .split(',')
        .map(tag => tag.trim().toLowerCase().replace(/^#/, ''))
        .filter(tag => tag.length > 0);
      await updateRecipe.mutateAsync({
        id,
        updates: {
          diet_label: updates.dietLabel,
          meal_label: updates.mealLabel,
          prep_time: updates.prepTime ? parseInt(updates.prepTime, 10) : null,
          cook_time: updates.cookTime ? parseInt(updates.cookTime, 10) : null,
          servings: updates.servings ? parseInt(updates.servings, 10) : null,
          tags: tagsArray,
          visibility: updates.visibility,
        },
      });
      setShowEditModal(false);
      showNotification(t('recipe.saved'), t('recipe.recipeUpdated'));
    } catch {
      showNotification(t('common.error'), t('recipe.failedToSave'));
    }
  };

  const handleTransferRecipe = async (targetHouseholdId: string) => {
    if (!id || !recipe) return;
    const targetHousehold = households?.find(h => h.id === targetHouseholdId);
    if (!targetHousehold) return;
    showAlert(t('recipe.transferRecipe'), t('recipe.transferConfirm', { title: recipe.title, household: targetHousehold.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('recipe.transfer'),
        onPress: async () => {
          try {
            await transferRecipe.mutateAsync({ recipeId: id, targetHouseholdId });
            setShowEditModal(false);
            hapticSuccess();
            showNotification(t('recipe.transferred'), t('recipe.transferredTo', { household: targetHousehold.name }));
          } catch {
            hapticWarning();
            showNotification(t('common.error'), t('recipe.failedToTransfer'));
          }
        },
      },
    ]);
  };

  return {
    // Auth state
    currentUser,
    isSuperuser,
    households,
    canEdit,
    isUpdatingImage,
    t,
    // Modal visibility
    showPlanModal,
    setShowPlanModal,
    showEditModal,
    setShowEditModal,
    showUrlModal,
    setShowUrlModal,
    // Handlers
    handlePickImage,
    saveImageUrl,
    handlePlanMeal,
    handleClearMeal,
    handleThumbUp,
    handleThumbDown,
    handleDelete,
    handleShare,
    handleSaveEdit,
    handleTransferRecipe,
  };
};
