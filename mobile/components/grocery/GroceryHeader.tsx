import { View } from 'react-native';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useTranslation } from '@/lib/i18n';

export const GroceryHeader = () => {
  const { t } = useTranslation();

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
      <ScreenTitle
        title={t('grocery.title')}
        subtitle={t('grocery.thisWeeksShopping')}
      />
    </View>
  );
};
