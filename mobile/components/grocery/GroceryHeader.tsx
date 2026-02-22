import { ScreenHeader } from '@/components/ScreenHeader';
import { useTranslation } from '@/lib/i18n';

export const GroceryHeader = () => {
  const { t } = useTranslation();

  return <ScreenHeader title={t('grocery.thisWeeksShopping')} />;
};
