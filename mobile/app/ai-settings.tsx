/**
 * AI Improvements settings screen.
 * Flat list of dietary/AI preference subsections:
 * Dairy, Meat dishes, Ingredient replacements, Equipment, Seafood.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { FullScreenLoading, GradientBackground } from '@/components';
import {
  AiSection,
  ReadOnlyBanner,
  ScreenHeader,
} from '@/components/household-settings';
import { useHouseholdSettingsForm } from '@/lib/hooks/useHouseholdSettingsForm';
import { useTranslation } from '@/lib/i18n';
import { layout, spacing, useTheme } from '@/lib/theme';

export default function AiSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id: paramId } = useLocalSearchParams<{
    id: string;
  }>();
  const { t } = useTranslation();
  const form = useHouseholdSettingsForm(paramId);

  if (!form.householdId) {
    if (form.userLoading) {
      return <FullScreenLoading />;
    }
    return (
      <FullScreenLoading title={t('householdSettings.invalidHouseholdId')} />
    );
  }

  return (
    <GradientBackground>
      {form.isLoading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <View style={[{ flex: 1 }, layout.contentContainer]}>
          <ScreenHeader
            canEdit={form.canEdit}
            hasChanges={form.hasChanges}
            isFormValid={form.isFormValid}
            isSaving={form.isSaving}
            onSave={form.handleSave}
            onBack={() =>
              router.canGoBack()
                ? router.back()
                : router.replace('/(tabs)/settings')
            }
            title={t('settings.aiSettings')}
            subtitle={t('settings.aiSettingsDesc')}
          />

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              padding: spacing.lg,
              paddingTop: 0,
              paddingBottom: layout.tabBar.contentBottomPadding,
            }}
          >
            {!form.canEdit && <ReadOnlyBanner />}

            {/* Diet type, dairy, meat dishes, ingredient replacements, equipment */}
            <AiSection
              dietary={form.settings.dietary}
              defaultServings={form.settings.default_servings}
              equipment={form.settings.equipment}
              canEdit={form.canEdit}
              onUpdateDietary={form.updateDietary}
              onToggleEquipment={form.toggleEquipment}
            />
          </ScrollView>
        </View>
      )}
    </GradientBackground>
  );
}
