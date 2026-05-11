import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ActionButton,
  Button,
  ContentCard,
  EnhancingOverlay,
  FormField,
  IconCircle,
  ScreenHeader,
  ScreenLayout,
  Toggle,
} from '@/components';
import { ManualRecipeForm } from '@/components/add-recipe/ManualRecipeForm';
import { ChipPicker } from '@/components/ChipPicker';
import { EnhancementReviewModal } from '@/components/EnhancementReviewModal';
import {
  getDietOptions,
  MEAL_OPTIONS,
} from '@/components/recipe-detail/recipe-detail-constants';
import { ThemeIcon } from '@/components/ThemeIcon';
import { showNotification } from '@/lib/alert';
import { useAddRecipeActions } from '@/lib/hooks/useAddRecipeActions';
import { useSettings } from '@/lib/settings-context';
import {
  fontSize,
  fontWeight,
  layout,
  letterSpacing,
  spacing,
  useTheme,
} from '@/lib/theme';

const SUPPORTED_SITES = [
  'AllRecipes',
  'BBC Good Food',
  'Bon Appétit',
  'Epicurious',
  'Food Network',
  'Serious Eats',
  'NYT Cooking',
  'Tasty',
];

export default function AddRecipeScreen() {
  const { colors, borderRadius } = useTheme();
  const actions = useAddRecipeActions();
  const { settings } = useSettings();
  const aiEnabled = settings.aiEnabled;
  const {
    t,
    isManualMode,
    url,
    setUrl,
    enhanceWithAI,
    setEnhanceWithAI,
    dietLabel,
    setDietLabel,
    mealLabel,
    setMealLabel,
    handleImport,
    isPending,
  } = actions;

  if (isManualMode) {
    return <ManualRecipeForm actions={actions} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScreenLayout constrained={false}>
        <ScreenHeader
          title={t('addRecipe.title')}
          subtitle={t('addRecipe.description')}
          variant="large"
          onBack={() => actions.router.back()}
        />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            {
              padding: spacing.lg,
              paddingBottom: layout.tabBar.contentBottomPadding,
            },
            layout.contentContainer,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* URL input */}
          <FormField label={t('addRecipe.urlLabel')}>
            <ContentCard
              padding={0}
              cardStyle={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: spacing.lg,
              }}
            >
              <ThemeIcon name="link" size={20} color={colors.text.inverse} />
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.md,
                  fontSize: fontSize.lg,
                  color: colors.text.inverse,
                }}
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
                <ActionButton.ClearInput
                  onPress={() => setUrl('')}
                  disabled={isPending}
                />
              )}
            </ContentCard>
          </FormField>

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
            {...(!aiEnabled && {
              accessibilityRole: 'button' as const,
              accessibilityLabel: t('addRecipe.enhanceWithAI'),
            })}
          >
            <ContentCard
              cardStyle={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: spacing['2xl'],
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
                  <ThemeIcon
                    name="sparkles"
                    size={18}
                    color={
                      aiEnabled && enhanceWithAI
                        ? colors.ai.primary
                        : colors.gray[500]
                    }
                  />
                </IconCircle>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: fontSize.lg,
                      fontWeight: fontWeight.semibold,
                      color: aiEnabled ? colors.text.inverse : colors.gray[500],
                      letterSpacing: letterSpacing.normal,
                    }}
                  >
                    {t('addRecipe.enhanceWithAI')}
                  </Text>
                  <Text
                    style={{
                      fontSize: fontSize.md,
                      color: colors.gray[600],
                      marginTop: spacing.xs,
                    }}
                  >
                    {aiEnabled
                      ? t('addRecipe.enhanceDescription')
                      : t('common.aiDisabledHint')}
                  </Text>
                </View>
              </View>
              <Toggle
                value={aiEnabled && enhanceWithAI}
                onValueChange={setEnhanceWithAI}
                disabled={isPending || !aiEnabled}
                variant="ai"
              />
            </ContentCard>
          </Pressable>

          {/* Diet & Meal type pickers */}
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

          {/* Import button */}
          <View style={{ marginTop: spacing.lg }}>
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
            />
          </View>

          {/* Or add manually link */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginVertical: spacing['2xl'],
            }}
          >
            <View
              style={{
                flex: 1,
                height: 2,
                backgroundColor: colors.surface.borderLight,
              }}
            />
            <Text
              style={{
                color: colors.content.body,
                fontSize: fontSize.md,
                fontWeight: fontWeight.medium,
                marginHorizontal: spacing.lg,
              }}
            >
              {t('common.or')}
            </Text>
            <View
              style={{
                flex: 1,
                height: 2,
                backgroundColor: colors.surface.borderLight,
              }}
            />
          </View>

          <Button
            variant="text"
            tone="alt"
            onPress={() =>
              actions.router.push({
                pathname: '/add-recipe',
                params: { manual: 'true' },
              })
            }
            icon="create-outline"
            iconSize={20}
            label={t('home.addRecipe.manualEntry')}
            style={{
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.lg,
              borderRadius: borderRadius.md,
              borderWidth: 2,
              borderColor: colors.surface.border,
            }}
          />

          {/* Supported sites */}
          <View style={{ marginTop: spacing.xl }}>
            <Text
              style={{
                fontSize: fontSize.xs,
                fontWeight: fontWeight.semibold,
                color: colors.content.subtitle,
                marginBottom: spacing.sm,
                letterSpacing: letterSpacing.wider,
                textTransform: 'uppercase',
              }}
            >
              {t('addRecipe.supportedSites')}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.xs,
              }}
            >
              {[...SUPPORTED_SITES, t('addRecipe.andMore')].map((site) => (
                <View
                  key={site}
                  style={{
                    backgroundColor: colors.surface.subtle,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: borderRadius.sm,
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSize.sm,
                      color: colors.content.body,
                    }}
                  >
                    {site}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <EnhancementReviewModal
          visible={actions.showSummaryModal}
          title={actions.importedRecipe?.title ?? ''}
          headerLabel={t('addRecipe.enhanced.title')}
          changesMade={actions.importedRecipe?.changes_made ?? []}
          changesLabel={t('addRecipe.enhanced.changesLabel')}
          noChangesLabel={t('addRecipe.enhanced.noChangesListed')}
          rejectLabel={t('addRecipe.enhanced.useOriginal')}
          approveLabel={t('addRecipe.enhanced.keepAI')}
          isReviewPending={actions.isReviewPending}
          onReview={(action) =>
            action === 'approve'
              ? actions.handleAcceptEnhancement()
              : actions.handleRejectEnhancement()
          }
          onRequestClose={() => actions.setShowSummaryModal(false)}
        />
        <EnhancingOverlay
          visible={isPending && enhanceWithAI}
          message={t('addRecipe.importingEnhancing')}
        />
      </ScreenLayout>
    </KeyboardAvoidingView>
  );
}
