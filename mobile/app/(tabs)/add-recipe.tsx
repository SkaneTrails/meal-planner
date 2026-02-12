import { Ionicons } from '@expo/vector-icons';
import React from 'react';
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
import { GradientBackground } from '@/components';
import { EnhancementSummaryModal } from '@/components/add-recipe/EnhancementSummaryModal';
import { ManualRecipeForm } from '@/components/add-recipe/ManualRecipeForm';
import { useAddRecipeActions } from '@/lib/hooks/useAddRecipeActions';
import {
  borderRadius,
  colors,
  fontSize,
  iconContainer,
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
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}
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
                  fontWeight: '600',
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
          <View style={{ marginBottom: spacing.lg }}>
            <Text
              style={{
                fontSize: fontSize.lg,
                fontWeight: '600',
                color: colors.text.inverse,
                marginBottom: spacing.sm,
                letterSpacing: letterSpacing.normal,
              }}
            >
              {t('addRecipe.urlLabel')}
            </Text>
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
          </View>

          {/* AI Enhancement toggle */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: colors.glass.card,
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              marginBottom: spacing['2xl'],
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
                  backgroundColor: enhanceWithAI
                    ? colors.accentLight
                    : colors.glass.light,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.md,
                }}
              >
                <Ionicons
                  name="sparkles"
                  size={18}
                  color={enhanceWithAI ? colors.accent : colors.gray[500]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: fontSize.lg,
                    fontWeight: '600',
                    color: colors.text.inverse,
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
              backgroundColor:
                url && !isPending ? colors.primary : colors.gray[300],
              opacity: pressed ? 0.9 : 1,
              ...shadows.md,
            })}
          >
            {isPending ? (
              <>
                <Ionicons
                  name="hourglass-outline"
                  size={20}
                  color={colors.white}
                />
                <Text
                  style={{
                    marginLeft: spacing.sm,
                    color: colors.white,
                    fontSize: fontSize.lg,
                    fontWeight: '600',
                  }}
                >
                  {enhanceWithAI
                    ? t('addRecipe.importingEnhancing')
                    : t('addRecipe.importing')}
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="download-outline"
                  size={20}
                  color={colors.white}
                />
                <Text
                  style={{
                    marginLeft: spacing.sm,
                    color: colors.white,
                    fontSize: fontSize.lg,
                    fontWeight: '600',
                  }}
                >
                  {t('addRecipe.importButton')}
                </Text>
              </>
            )}
          </Pressable>

          {/* Supported sites */}
          <View style={{ marginTop: spacing['3xl'] }}>
            <Text
              style={{
                fontSize: fontSize.md,
                fontWeight: '600',
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
      </GradientBackground>
    </KeyboardAvoidingView>
  );
}
