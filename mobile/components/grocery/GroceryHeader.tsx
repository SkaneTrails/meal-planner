import { View } from 'react-native';
import { ScreenHeaderBar } from '@/components/ScreenHeaderBar';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useTranslation } from '@/lib/i18n';
import { spacing } from '@/lib/theme';

export const GroceryHeader = () => {
  const { t } = useTranslation();

  return (
    <ScreenHeaderBar>
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing.xs,
        }}
      >
        <ScreenTitle title={t('grocery.thisWeeksShopping')} />
      </View>
    </ScreenHeaderBar>
  );
};
