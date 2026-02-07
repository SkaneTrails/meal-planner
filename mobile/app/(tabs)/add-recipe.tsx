/**
 * Add Recipe modal - Import recipe from URL.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useScrapeRecipe } from '@/lib/hooks';
import { showAlert, showNotification } from '@/lib/alert';
import { useTranslation } from '@/lib/i18n';
import { shadows, borderRadius, colors, spacing, fontSize, letterSpacing, iconContainer } from '@/lib/theme';
import { GradientBackground } from '@/components';
import type { Recipe } from '@/lib/types';

export default function AddRecipeScreen() {
  const router = useRouter();
  const { url: urlParam } = useLocalSearchParams<{ url?: string }>();
  const [url, setUrl] = useState(urlParam || '');
  const [enhanceWithAI, setEnhanceWithAI] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [importedRecipe, setImportedRecipe] = useState<Recipe | null>(null);
  const scrapeRecipe = useScrapeRecipe();
  const { t } = useTranslation();

  const isValidUrl = (text: string) => {
    try {
      new URL(text);
      return true;
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

      // Show summary modal if enhanced, otherwise show simple alert
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
      const message = err instanceof Error ? err.message : t('addRecipe.importFailedDefault');
      showNotification(t('addRecipe.importFailed'), message);
    }
  };

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

  const isPending = scrapeRecipe.isPending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <GradientBackground style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Instructions */}
          <View style={{
            backgroundColor: colors.primary,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            marginBottom: spacing['2xl'],
            ...shadows.md,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <Ionicons name="information-circle" size={22} color={colors.white} />
              <Text style={{ marginLeft: spacing.sm, fontSize: fontSize['2xl'], fontWeight: '600', color: colors.white, letterSpacing: letterSpacing.normal }}>
                {t('addRecipe.title')}
              </Text>
            </View>
            <Text style={{ color: colors.text.secondary, fontSize: fontSize.lg, lineHeight: 22 }}>
              {t('addRecipe.description')}
            </Text>
          </View>

          {/* URL input */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text.inverse, marginBottom: spacing.sm, letterSpacing: letterSpacing.normal }}>
              {t('addRecipe.urlLabel')}
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.glass.card,
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.lg,
              ...shadows.sm,
            }}>
              <Ionicons name="link" size={20} color={colors.text.inverse} />
              <TextInput
                style={{ flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.md, fontSize: fontSize.lg, color: colors.text.inverse }}
                placeholder="https://example.com/recipe..."
                placeholderTextColor={colors.gray[500]}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
                editable={!isPending}
              />
              {url !== '' && (
                <Pressable onPress={() => setUrl('')} disabled={isPending}>
                  <Ionicons name="close-circle" size={20} color={colors.gray[500]} />
                </Pressable>
              )}
            </View>
          </View>

          {/* AI Enhancement toggle */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.glass.card,
            borderRadius: borderRadius.md,
            padding: spacing.lg,
            marginBottom: spacing['2xl'],
            ...shadows.sm,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{
                width: iconContainer.md,
                height: iconContainer.md,
                borderRadius: iconContainer.md / 2,
                backgroundColor: enhanceWithAI ? colors.accentLight : colors.glass.light,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.md
              }}>
                <Ionicons name="sparkles" size={18} color={enhanceWithAI ? colors.accent : colors.gray[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text.inverse, letterSpacing: letterSpacing.normal }}>
                  {t('addRecipe.enhanceWithAI')}
                </Text>
                <Text style={{ fontSize: fontSize.md, color: colors.gray[600], marginTop: spacing.xs }}>
                  {t('addRecipe.enhanceDescription')}
                </Text>
              </View>
            </View>
            <Switch
              value={enhanceWithAI}
              onValueChange={setEnhanceWithAI}
              trackColor={{ false: colors.gray[300], true: colors.accentLight }}
              thumbColor={enhanceWithAI ? colors.accent : colors.gray[400]}
              disabled={isPending}
            />
          </View>

          {/* Import button */}
          <Pressable
            onPress={handleImport}
            disabled={!url || isPending}
            style={({ pressed }) => ({
              paddingVertical: spacing.md,
              borderRadius: borderRadius.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: url && !isPending ? colors.primary : colors.gray[300],
              opacity: pressed ? 0.9 : 1,
              ...shadows.md,
            })}
          >
            {isPending ? (
              <>
                <Ionicons name="hourglass-outline" size={20} color={colors.white} />
                <Text style={{ marginLeft: spacing.sm, color: colors.white, fontSize: fontSize.lg, fontWeight: '600' }}>
                  {enhanceWithAI ? t('addRecipe.importingEnhancing') : t('addRecipe.importing')}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color={colors.white} />
                <Text style={{ marginLeft: spacing.sm, color: colors.white, fontSize: fontSize.lg, fontWeight: '600' }}>
                  {t('addRecipe.importButton')}
                </Text>
              </>
            )}
          </Pressable>

          {/* Supported sites */}
          <View style={{ marginTop: spacing['3xl'] }}>
            <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.gray[600], marginBottom: spacing.md, letterSpacing: letterSpacing.wide, textTransform: 'uppercase' }}>
              {t('addRecipe.supportedSites')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {[
                'AllRecipes',
                'BBC Good Food',
                'Bon Appétit',
                'Epicurious',
                'Food Network',
                'Serious Eats',
                'NYT Cooking',
                'Tasty',
                t('addRecipe.andMore'),
              ].map((site) => (
                <View
                  key={site}
                  style={{ backgroundColor: colors.glass.card, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.sm }}
                >
                  <Text style={{ fontSize: fontSize.md, color: colors.text.inverse }}>{site}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Enhancement Summary Modal */}
        <Modal
          visible={showSummaryModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSummaryModal(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing['2xl'],
          }}>
            <View style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.lg,
              padding: spacing['2xl'],
              width: '100%',
              maxWidth: 400,
              maxHeight: '80%',
              ...shadows.xl,
            }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
                <View style={{
                  width: iconContainer.lg,
                  height: iconContainer.lg,
                  borderRadius: iconContainer.lg / 2,
                  backgroundColor: colors.accentLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.md
                }}>
                  <Ionicons name="sparkles" size={22} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSize['3xl'], fontWeight: '700', color: colors.text.inverse, letterSpacing: letterSpacing.normal }}>
                    {t('addRecipe.enhanced.title')}
                  </Text>
                  <Text style={{ fontSize: fontSize.lg, color: colors.gray[600], marginTop: spacing.xs }} numberOfLines={1}>
                    {importedRecipe?.title}
                  </Text>
                </View>
              </View>

              {/* Changes list */}
              <ScrollView style={{ maxHeight: 300, marginBottom: spacing.xl }}>
                <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text.inverse, marginBottom: spacing.md }}>
                  {t('addRecipe.enhanced.changesLabel')}
                </Text>
                {importedRecipe?.changes_made?.map((change, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      marginBottom: spacing.sm,
                      backgroundColor: colors.successBg,
                      padding: spacing.md,
                      borderRadius: borderRadius.sm,
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginRight: spacing.sm, marginTop: 1 }} />
                    <Text style={{ flex: 1, fontSize: fontSize.lg, color: colors.text.inverse, lineHeight: 22 }}>
                      {change}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              {/* Buttons */}
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Pressable
                  onPress={handleAddAnother}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: spacing.md,
                    borderRadius: borderRadius.md,
                    backgroundColor: colors.glass.light,
                    alignItems: 'center',
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text.inverse }}>
                    {t('addRecipe.enhanced.addMore')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleViewRecipe}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: spacing.md,
                    borderRadius: borderRadius.md,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    opacity: pressed ? 0.9 : 1,
                    ...shadows.sm,
                  })}
                >
                  <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.white }}>
                    {t('addRecipe.enhanced.viewRecipe')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </GradientBackground>
    </KeyboardAvoidingView>
  );
}
