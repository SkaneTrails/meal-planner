import { Text, View } from 'react-native';
import { useTranslation } from '@/lib/i18n';
import { colors, fontFamily, fontSize, letterSpacing } from '@/lib/theme';

export const GroceryHeader = () => {
  const { t } = useTranslation();

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
      <Text
        style={{
          fontSize: fontSize['3xl'],
          fontFamily: fontFamily.displayBold,
          fontWeight: '700',
          color: colors.content.heading,
          letterSpacing: letterSpacing.tight,
          textAlign: 'center',
        }}
      >
        {t('grocery.title')}
      </Text>
      <Text
        style={{
          fontSize: fontSize.md,
          fontFamily: fontFamily.body,
          color: colors.content.subtitle,
          marginTop: 2,
          textAlign: 'center',
        }}
      >
        {t('grocery.thisWeeksShopping')}
      </Text>
    </View>
  );
};
