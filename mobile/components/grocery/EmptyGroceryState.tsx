import { Text, View } from 'react-native';
import { useTranslation } from '@/lib/i18n';
import { fontFamily } from '@/lib/theme';

export const EmptyGroceryState = () => {
  const { t } = useTranslation();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <Text
        style={{
          color: '#5D4E40',
          fontSize: 18,
          fontFamily: fontFamily.bodySemibold,
          textAlign: 'center',
        }}
      >
        {t('grocery.emptyList')}
      </Text>
      <Text
        style={{
          color: 'rgba(93, 78, 64, 0.7)',
          fontSize: 15,
          marginTop: 8,
          textAlign: 'center',
          lineHeight: 22,
          maxWidth: 280,
        }}
      >
        {t('grocery.goToMealPlan')}
      </Text>
    </View>
  );
};
