import { Ionicons } from '@expo/vector-icons';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  EnhancingOverlay,
  FormField,
  GradientBackground,
  PrimaryButton,
} from '@/components';
import { EnhancementSummaryModal } from '@/components/add-recipe/EnhancementSummaryModal';
import { ManualRecipeForm } from '@/components/add-recipe/ManualRecipeForm';
import { showNotification } from '@/lib/alert';
import { useAddRecipeActions } from '@/lib/hooks/useAddRecipeActions';
import { useSettings } from '@/lib/settings-context';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  iconContainer,
  layout,
  letterSpacing,
  shadows,
  spacing,
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
      <GradientBackground style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: layout.tabBar.contentBottomPadding,
            maxWidth: layout.contentMaxWidth,
            alignSelf: 'center',
            width: '100%',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Instructions */}
          <View
            style={{
              backgroundColor: colors.primary,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              marginBottom: spacing['2xl'],
              ...shadows.md,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: spacing.sm,
              }}
            >
              <Ionicons
                name="information-circle"
                size={22}
                color={colors.white}
              />
              <Text
                style={{
                  marginLeft: spacing.sm,
                  fontSize: fontSize['2xl'],
                  fontWeight: fontWeight.semibold,
                  color: colors.white,
                  letterSpacing: letterSpacing.normal,
                }}
              >
                {t('addRecipe.title')}
              </Text>
            </View>
            <Text
              style={{
                color: colors.text.secondary,
                fontSize: fontSize.lg,
                lineHeight: 22,
              }}
            >
              {t('addRecipe.description')}
            </Text>
          </View>

          {/* URL input */}
          <FormField label={t('addRecipe.urlLabel')}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.glass.card,
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.lg,
                ...shadows.sm,
              }}
            >
              <Ionicons name="link" size={20} color={colors.text.inverse} />
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
                <Pressable onPress={() => setUrl('')} disabled={isPending}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={colors.gray[500]}
                  />
                </Pressable>
              )}
            </View>
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
            disabled={aiEnabled}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.glass.card,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
                marginBottom: spacing['2xl'],
                opacity: aiEnabled ? 1 : 0.5,
                ...shadows.sm,
              }}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
              >
                <View
                  style={{
                    width: iconContainer.md,
                    height: iconContainer.md,
                    borderRadius: iconContainer.md / 2,
                    backgroundColor:
                      aiEnabled && enhanceWithAI
                        ? colors.ai.light
                        : colors.glass.light,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: spacing.md,
                  }}
                >
                  <Ionicons
                    name="sparkles"
                    size={18}
                    color={
                      aiEnabled && enhanceWithAI
                        ? colors.ai.primary
                        : colors.gray[500]
                    }
                  />
                </View>
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
              <Switch
                value={aiEnabled && enhanceWithAI}
                onValueChange={setEnhanceWithAI}
                trackColor={{ false: colors.gray[300], true: colors.ai.light }}
                thumbColor={
                  aiEnabled && enhanceWithAI
                    ? colors.ai.primary
                    : colors.gray[400]
                }
                disabled={isPending || !aiEnabled}
              />
            </View>
          </Pressable>

          {/* Import button */}
          <PrimaryButton
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
                fontWeight: '500',
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

          <Pressable
            onPress={() =>
              actions.router.push({
                pathname: '/add-recipe',
                params: { manual: 'true' },
              })
            }
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.lg,
              borderRadius: borderRadius.md,
              backgroundColor: pressed
                ? colors.surface.pressed
                : colors.surface.hover,
              borderWidth: 2,
              borderColor: colors.surface.border,
            })}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={colors.content.body}
            />
            <Text
              style={{
                marginLeft: spacing.sm,
                color: colors.content.body,
                fontSize: fontSize.lg,
                fontWeight: fontWeight.semibold,
              }}
            >
              {t('home.addRecipe.manualEntry')}
            </Text>
          </Pressable>

          {/* Supported sites */}
          <View style={{ marginTop: spacing['3xl'] }}>
            <Text
              style={{
                fontSize: fontSize.md,
                fontWeight: fontWeight.semibold,
                color: colors.gray[600],
                marginBottom: spacing.md,
                letterSpacing: letterSpacing.wide,
                textTransform: 'uppercase',
              }}
            >
              {t('addRecipe.supportedSites')}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.sm,
              }}
            >
              {[...SUPPORTED_SITES, t('addRecipe.andMore')].map((site) => (
                <View
                  key={site}
                  style={{
                    backgroundColor: colors.glass.card,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: borderRadius.sm,
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSize.md,
                      color: colors.text.inverse,
                    }}
                  >
                    {site}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <EnhancementSummaryModal actions={actions} />
        <EnhancingOverlay
          visible={isPending && enhanceWithAI}
          message={t('addRecipe.importingEnhancing')}
        />
      </GradientBackground>
    </KeyboardAvoidingView>
  );
}
