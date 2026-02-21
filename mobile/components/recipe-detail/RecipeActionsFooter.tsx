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
  const { visibility } = useTheme();

  const openUrl = () => {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        showNotification(t('common.error'), t('recipe.couldNotOpenUrl'));
        return;
      }
      Linking.openURL(url).catch(() => {
        showNotification(t('common.error'), t('recipe.couldNotOpenUrl'));
      });
    } catch {
      showNotification(t('common.error'), t('recipe.couldNotOpenUrl'));
    }
  };

  return (
    <>
      {url && (
        <Button
          variant="text"
          tone="alt"
          onPress={openUrl}
          icon="link"
          iconSize={18}
          label={t('recipe.viewSource')}
          style={{
            justifyContent: 'center',
            paddingVertical: spacing.lg,
            marginTop: spacing.sm,
          }}
        />
      )}

      {visibility.showRecipeActionButtons && (
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
          />
        </View>
      )}
    </>
  );
};
