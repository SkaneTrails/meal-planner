import { View } from 'react-native';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useTranslation } from '@/lib/i18n';
import { spacing } from '@/lib/theme';

export const GroceryHeader = () => {
  const { t } = useTranslation();

  return (
    <View
      style={{
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
      }}
    >
      <ScreenTitle
        title={t('grocery.title')}
        subtitle={t('grocery.thisWeeksShopping')}
      />
    </View>
  );
};
