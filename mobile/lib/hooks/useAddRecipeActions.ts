import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useScrapeRecipe, useCreateRecipe, useImagePicker } from '@/lib/hooks';
import { api, ApiClientError } from '@/lib/api';
import { showAlert, showNotification } from '@/lib/alert';
import { useTranslation } from '@/lib/i18n';
import type { Recipe, DietLabel, MealLabel } from '@/lib/types';

const extractHostname = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

export const useAddRecipeActions = () => {
  const router = useRouter();
  const { url: urlParam, manual: manualParam } = useLocalSearchParams<{ url?: string; manual?: string }>();
  const isManualMode = manualParam === 'true';
  const { t } = useTranslation();

  // URL import state
  const [url, setUrl] = useState(urlParam || '');
  const [enhanceWithAI, setEnhanceWithAI] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [importedRecipe, setImportedRecipe] = useState<Recipe | null>(null);

  // Manual form state
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [servings, setServings] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [dietLabel, setDietLabel] = useState<DietLabel | null>(null);
  const [mealLabel, setMealLabel] = useState<MealLabel | null>(null);

  const scrapeRecipe = useScrapeRecipe();
  const createRecipe = useCreateRecipe();

  const isValidUrl = (text: string) => {
    try {
      const parsed = new URL(text);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  const handleImport = async () => {
    if (!isValidUrl(url)) {
      showNotification(t('addRecipe.invalidUrl'), t('addRecipe.invalidUrlMessage'));
      return;
    }

    try {
      const recipe = await scrapeRecipe.mutateAsync({ url, enhance: enhanceWithAI });
      setImportedRecipe(recipe);

      if (recipe.enhanced && recipe.changes_made && recipe.changes_made.length > 0) {
        setShowSummaryModal(true);
      } else {
        showAlert(t('addRecipe.done'), t('addRecipe.recipeImported', { title: recipe.title }), [
          {
            text: t('addRecipe.viewRecipe'),
            style: 'cancel',
            onPress: () => {
              router.back();
              router.push(`/recipe/${recipe.id}`);
            },
          },
          {
            text: t('addRecipe.addMore'),
            onPress: () => setUrl(''),
          },
        ]);
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.reason === 'blocked') {
        const host = extractHostname(url);
        showNotification(
          t('addRecipe.importFailed'),
          t('addRecipe.siteBlocked', { host }),
        );
      } else {
        const message = err instanceof Error ? err.message : t('addRecipe.importFailedDefault');
        showNotification(t('addRecipe.importFailed'), message);
      }
    }
  };

  const resetManualForm = () => {
    setTitle('');
    setIngredients('');
    setInstructions('');
    setImageUrl('');
    setSelectedImage(null);
    setServings('');
    setPrepTime('');
    setCookTime('');
    setDietLabel(null);
    setMealLabel(null);
  };

  const handleCreateManual = async () => {
    if (!title.trim()) {
      showNotification(t('common.error'), t('addRecipe.titleRequired'));
      return;
    }

    const parsedServings = servings ? parseInt(servings, 10) : null;
    if (parsedServings !== null && (isNaN(parsedServings) || parsedServings < 1)) {
      showNotification(t('common.error'), t('addRecipe.servingsInvalid'));
      return;
    }

    try {
      const recipe = await createRecipe.mutateAsync({
        title: title.trim(),
        url: '',
        ingredients: ingredients.split('\n').map(i => i.trim()).filter(Boolean),
        instructions: instructions.split('\n').map(i => i.trim()).filter(Boolean),
        image_url: imageUrl.trim() || null,
        servings: parsedServings,
        prep_time: prepTime ? parseInt(prepTime, 10) : null,
        cook_time: cookTime ? parseInt(cookTime, 10) : null,
        diet_label: dietLabel,
        meal_label: mealLabel,
      });

      if (selectedImage) {
        try {
          await api.uploadRecipeImage(recipe.id, selectedImage);
        } catch {
          showNotification(t('common.error'), t('recipeDetail.imageUploadFailed'));
        }
      }

      showAlert(t('addRecipe.done'), t('addRecipe.recipeCreated', { title: recipe.title }), [
        {
          text: t('addRecipe.viewRecipe'),
          style: 'cancel',
          onPress: () => {
            router.back();
            router.push(`/recipe/${recipe.id}`);
          },
        },
        {
          text: t('addRecipe.addMore'),
          onPress: resetManualForm,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('addRecipe.createFailedDefault');
      showNotification(t('addRecipe.createFailed'), message);
    }
  };

  const { pickImage: handlePickImage } = useImagePicker((uri) => {
    setSelectedImage(uri);
    setImageUrl('');
  });

  const handleViewRecipe = () => {
    setShowSummaryModal(false);
    if (importedRecipe) {
      router.back();
      router.push(`/recipe/${importedRecipe.id}`);
    }
  };

  const handleAddAnother = () => {
    setShowSummaryModal(false);
    setImportedRecipe(null);
    setUrl('');
  };

  const isPending = scrapeRecipe.isPending || createRecipe.isPending;

  return {
    t,
    isManualMode,
    url,
    setUrl,
    enhanceWithAI,
    setEnhanceWithAI,
    handleImport,
    title,
    setTitle,
    ingredients,
    setIngredients,
    instructions,
    setInstructions,
    imageUrl,
    setImageUrl,
    selectedImage,
    setSelectedImage,
    servings,
    setServings,
    prepTime,
    setPrepTime,
    cookTime,
    setCookTime,
    dietLabel,
    setDietLabel,
    mealLabel,
    setMealLabel,
    handleCreateManual,
    handlePickImage,
    showSummaryModal,
    setShowSummaryModal,
    importedRecipe,
    handleViewRecipe,
    handleAddAnother,
    isPending,
  };
};
