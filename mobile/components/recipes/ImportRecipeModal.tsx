/**
 * Bottom-sheet modal for importing a recipe from URL.
 *
 * Includes URL input, AI enhancement toggle, diet/meal chip pickers,
 * import button, and "or add manually" link. Lives on the recipes screen;
 * after a successful import it closes and navigates to the new recipe's
 * detail page.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { BottomSheetModal, Button, IconCircle } from '@/components';
import { ChipPicker } from '@/components/ChipPicker';
import { EnhancementReviewModal } from '@/components/EnhancementReviewModal';
import { EnhancingOverlay } from '@/components/EnhancingOverlay';
import {
  getDietOptions,
  MEAL_OPTIONS,
} from '@/components/recipe-detail/recipe-detail-constants';
import { showAlert, showNotification } from '@/lib/alert';
import { ApiClientError } from '@/lib/api';
import { useReviewEnhancement, useScrapeRecipe } from '@/lib/hooks';
import { useTranslation } from '@/lib/i18n';
import { useSettings } from '@/lib/settings-context';
import { fontSize, letterSpacing, spacing, useTheme } from '@/lib/theme';
import type { DietLabel, MealLabel, Recipe } from '@/lib/types';

interface ImportRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onManualMode?: () => void;
}

const extractHostname = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

export const ImportRecipeModal = ({
  visible,
  onClose,
  onManualMode,
}: ImportRecipeModalProps) => {
  const { colors, fonts, borderRadius } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const aiEnabled = settings.aiEnabled;

  const [url, setUrl] = useState('');
  const [enhanceWithAI, setEnhanceWithAI] = useState(false);
  const [dietLabel, setDietLabel] = useState<DietLabel | null>(null);
  const [mealLabel, setMealLabel] = useState<MealLabel | null>(null);
  const [importedRecipe, setImportedRecipe] = useState<Recipe | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const scrapeRecipe = useScrapeRecipe();
  const reviewEnhancement = useReviewEnhancement();
  const isPending = scrapeRecipe.isPending || reviewEnhancement.isPending;

  const resetAndClose = () => {
    setUrl('');
    setEnhanceWithAI(false);
    setDietLabel(null);
    setMealLabel(null);
    setImportedRecipe(null);
    setShowSummaryModal(false);
    onClose();
  };

  const navigateToRecipe = (recipeId: string) => {
    resetAndClose();
    router.push(`/recipe/${recipeId}`);
  };

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
      showNotification(
        t('addRecipe.invalidUrl'),
        t('addRecipe.invalidUrlMessage'),
      );
      return;
    }

    try {
      const recipe = await scrapeRecipe.mutateAsync({
        url,
        enhance: enhanceWithAI,
        dietLabel,
        mealLabel,
      });
      setImportedRecipe(recipe);

      if (recipe.enhanced) {
        setShowSummaryModal(true);
      } else {
        showAlert(
          t('addRecipe.done'),
          t('addRecipe.recipeImported', { title: recipe.title }),
          [
            {
              text: t('addRecipe.viewRecipe'),
              style: 'cancel',
              onPress: () => navigateToRecipe(recipe.id),
            },
            {
              text: t('addRecipe.addMore'),
              onPress: () => {
                setUrl('');
                setImportedRecipe(null);
              },
            },
          ],
        );
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.reason === 'blocked') {
        const host = extractHostname(url);
        showNotification(
          t('addRecipe.importFailed'),
          t('addRecipe.siteBlocked', { host }),
        );
      } else if (
        err instanceof ApiClientError &&
        err.reason === 'not_supported'
      ) {
        const host = extractHostname(url);
        showNotification(
          t('addRecipe.importFailed'),
          t('addRecipe.siteNotSupported', { host }),
        );
      } else if (err instanceof ApiClientError && err.status === 409) {
        showNotification(
          t('addRecipe.importFailed'),
          t('addRecipe.recipeExists'),
        );
      } else {
        const message =
          err instanceof Error
            ? err.message
            : t('addRecipe.importFailedDefault');
        showNotification(t('addRecipe.importFailed'), message);
      }
    }
  };

  const handleAcceptEnhancement = async () => {
    if (!importedRecipe) return;
    try {
      await reviewEnhancement.mutateAsync({
        id: importedRecipe.id,
        action: 'approve',
      });
      navigateToRecipe(importedRecipe.id);
    } catch {
      showNotification(t('common.error'), t('addRecipe.enhanced.reviewFailed'));
    }
  };

  const handleRejectEnhancement = async () => {
    if (!importedRecipe) return;
    try {
      await reviewEnhancement.mutateAsync({
        id: importedRecipe.id,
        action: 'reject',
      });
      navigateToRecipe(importedRecipe.id);
    } catch {
      showNotification(t('common.error'), t('addRecipe.enhanced.reviewFailed'));
    }
  };

  return (
    <>
      <BottomSheetModal
        visible={visible}
        onClose={resetAndClose}
        title={t('home.addRecipe.title')}
        animationType="fade"
        dismissOnBackdropPress={!isPending}
        showDragHandle
        showCloseButton={false}
        backgroundColor={colors.surface.modal}
      >
        {/* URL input */}
        <View
          style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}
        >
          <View
            style={{
              backgroundColor: colors.glass.subtle,
              borderRadius: borderRadius.md,
              padding: spacing.xs,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons
              name="link-outline"
              size={18}
              color={colors.content.secondary}
              style={{ marginLeft: spacing.md }}
            />
            <TextInput
              style={{
                flex: 1,
                paddingHorizontal: spacing['sm-md'],
                paddingVertical: spacing.md,
                fontSize: fontSize.md,
                fontFamily: fonts.body,
                color: colors.content.body,
              }}
              placeholder={t('home.addRecipe.placeholder')}
              placeholderTextColor={colors.content.placeholder}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onSubmitEditing={handleImport}
              returnKeyType="go"
              editable={!isPending}
            />
            {url !== '' && !isPending && (
              <Pressable onPress={() => setUrl('')}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.content.secondary}
                  style={{ marginRight: spacing.sm }}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* AI Enhancement toggle */}
        <Pressable
          onPress={
            !aiEnabled
              ? () =>
                  showNotification(
                    t('addRecipe.enhanceWithAI'),
                    t('common.aiDisabledHint'),
                  )
              : undefined
          }
          disabled={aiEnabled}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
              marginBottom: spacing.md,
              opacity: aiEnabled ? 1 : 0.5,
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            >
              <IconCircle
                size="md"
                bg={
                  aiEnabled && enhanceWithAI
                    ? colors.ai.light
                    : colors.glass.light
                }
                style={{ marginRight: spacing.md }}
              >
                <Ionicons
                  name="sparkles"
                  size={18}
                  color={
                    aiEnabled && enhanceWithAI
                      ? colors.ai.primary
                      : colors.content.secondary
                  }
                />
              </IconCircle>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: fontSize.md,
                    fontFamily: fonts.bodySemibold,
                    color: aiEnabled
                      ? colors.content.body
                      : colors.content.secondary,
                    letterSpacing: letterSpacing.normal,
                  }}
                >
                  {t('addRecipe.enhanceWithAI')}
                </Text>
                <Text
                  style={{
                    fontSize: fontSize.sm,
                    fontFamily: fonts.body,
                    color: colors.content.secondary,
                    marginTop: spacing['2xs'],
                  }}
                >
                  {aiEnabled
                    ? t('addRecipe.enhanceDescription')
                    : t('common.aiDisabledHint')}
                </Text>
              </View>
            </View>
            <Switch
              value={aiEnabled && enhanceWithAI}
              onValueChange={setEnhanceWithAI}
              trackColor={{ false: colors.glass.light, true: colors.ai.light }}
              thumbColor={
                aiEnabled && enhanceWithAI
                  ? colors.ai.primary
                  : colors.content.secondary
              }
              disabled={isPending || !aiEnabled}
            />
          </View>
        </Pressable>

        {/* Diet & Meal type pickers */}
        <View
          style={{
            marginHorizontal: spacing.xl,
            backgroundColor: colors.card.bg,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.card.borderColor,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.xs,
          }}
        >
          <ChipPicker
            label={t('recipe.dietType')}
            options={getDietOptions(colors)}
            selected={dietLabel}
            onSelect={setDietLabel}
            t={t}
            variant="solid"
          />
          <ChipPicker
            label={t('recipe.mealTypeLabel')}
            options={MEAL_OPTIONS}
            selected={mealLabel}
            onSelect={setMealLabel}
            t={t}
            variant="solid"
          />
        </View>

        {/* Import button */}
        <View
          style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}
        >
          <Button
            variant="primary"
            onPress={handleImport}
            disabled={!url}
            isPending={isPending}
            icon="download-outline"
            label={t('addRecipe.importButton')}
            loadingLabel={
              enhanceWithAI
                ? t('addRecipe.importingEnhancing')
                : t('addRecipe.importing')
            }
            color={colors.content.body}
          />
        </View>

        {/* Divider */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.xl,
            marginBottom: spacing.sm,
          }}
        >
          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: colors.surface.dividerSolid,
            }}
          />
          <Text
            style={{
              color: colors.content.secondary,
              fontSize: fontSize.sm,
              fontFamily: fonts.body,
              marginHorizontal: spacing.md,
            }}
          >
            {t('common.or')}
          </Text>
          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: colors.surface.dividerSolid,
            }}
          />
        </View>

        {/* Manual entry button */}
        <View
          style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}
        >
          <Button
            variant="primary"
            onPress={() => {
              resetAndClose();
              onManualMode?.();
            }}
            icon="create-outline"
            label={t('home.addRecipe.manualEntry')}
          />
        </View>
      </BottomSheetModal>

      {/* Enhancement review — rendered outside BottomSheetModal so it layers on top */}
      <EnhancementReviewModal
        visible={showSummaryModal}
        title={importedRecipe?.title ?? ''}
        headerLabel={t('addRecipe.enhanced.title')}
        changesMade={importedRecipe?.changes_made ?? []}
        changesLabel={t('addRecipe.enhanced.changesLabel')}
        noChangesLabel={t('addRecipe.enhanced.noChangesListed')}
        rejectLabel={t('addRecipe.enhanced.useOriginal')}
        approveLabel={t('addRecipe.enhanced.keepAI')}
        isReviewPending={reviewEnhancement.isPending}
        onReview={(action) =>
          action === 'approve'
            ? handleAcceptEnhancement()
            : handleRejectEnhancement()
        }
        onRequestClose={() => setShowSummaryModal(false)}
      />
      <EnhancingOverlay
        visible={isPending && enhanceWithAI}
        message={t('addRecipe.importingEnhancing')}
      />
    </>
  );
};
