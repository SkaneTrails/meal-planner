import { Linking, View } from 'react-native';
import { Button } from '@/components';
import { showNotification } from '@/lib/alert';
import type { TFunction } from '@/lib/i18n';
import { layout, spacing, useTheme } from '@/lib/theme';

interface RecipeActionsFooterProps {
  url: string;
  t: TFunction;
  onShowPlanModal: () => void;
}

export const RecipeActionsFooter = ({
  url,
  t,
  onShowPlanModal,
}: RecipeActionsFooterProps) => {
  const { colors, borderRadius } = useTheme();
  return (
    <>
      {url && (
        <Button
          variant="text"
          onPress={() => {
            try {
              const parsed = new URL(url);
              if (!['http:', 'https:'].includes(parsed.protocol)) {
                showNotification(
                  t('common.error'),
                  t('recipe.couldNotOpenUrl'),
                );
                return;
              }
              Linking.openURL(url).catch(() => {
                showNotification(
                  t('common.error'),
                  t('recipe.couldNotOpenUrl'),
                );
              });
            } catch {
              showNotification(t('common.error'), t('recipe.couldNotOpenUrl'));
            }
          }}
          icon="link"
          iconSize={18}
          label={t('recipe.viewSource')}
          color={'rgba(180, 175, 168, 0.4)'}
          style={{
            justifyContent: 'center',
            paddingVertical: spacing.lg,
            marginTop: spacing.sm,
            borderRadius: borderRadius.md,
          }}
        />
      )}

      <View
        style={{
          marginTop: spacing.md,
          marginBottom: layout.tabBar.contentBottomPadding,
        }}
      >
        <Button
          variant="primary"
          onPress={onShowPlanModal}
          icon="calendar"
          label={t('recipe.addToMealPlan')}
          color={colors.ai.primary}
        />
      </View>
    </>
  );
};
