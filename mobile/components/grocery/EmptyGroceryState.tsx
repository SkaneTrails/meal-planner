import { Text, View } from 'react-native';
import { useTranslation } from '@/lib/i18n';
import {
  fontFamily,
  fontSize,
  lineHeight,
  spacing,
  useTheme,
} from '@/lib/theme';

export const EmptyGroceryState = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing['3xl'],
      }}
    >
      <Text
        style={{
          color: colors.content.body,
          fontSize: fontSize['xl-2xl'],
          fontFamily: fontFamily.bodySemibold,
          textAlign: 'center',
        }}
      >
        {t('grocery.emptyList')}
      </Text>
      <Text
        style={{
          color: colors.content.tertiary,
          fontSize: fontSize.xl,
          marginTop: spacing.sm,
          textAlign: 'center',
          lineHeight: lineHeight.lg,
          maxWidth: 280,
        }}
      >
        {t('grocery.goToMealPlan')}
      </Text>
    </View>
  );
};
