import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { BouncingLoader, Button, GradientBackground } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { fontSize, spacing, useTheme } from '@/lib/theme';

interface RecipeLoadingProps {
  structured?: boolean;
}

export const RecipeLoading = ({ structured = true }: RecipeLoadingProps) => {
  const { colors, borderRadius, shadows } = useTheme();
  return (
    <GradientBackground
      structured={structured}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          backgroundColor: colors.glass.card,
          borderRadius: borderRadius.md,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.lg,
        }}
      >
        <BouncingLoader size={12} />
      </View>
    </GradientBackground>
  );
};

interface RecipeNotFoundProps {
  t: TFunction;
  onGoBack: () => void;
}

export const RecipeNotFound = ({ t, onGoBack }: RecipeNotFoundProps) => {
  const { colors, fonts, borderRadius, shadows } = useTheme();
  return (
    <GradientBackground
      structured
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          backgroundColor: colors.glass.bright,
          borderRadius: borderRadius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
          ...shadows.lg,
        }}
      >
        <Ionicons
          name="alert-circle-outline"
          size={40}
          color={colors.content.subtitle}
        />
      </View>
      <Text
        style={{
          color: colors.content.heading,
          fontSize: fontSize['2xl'],
          fontFamily: fonts.displayBold,
          textAlign: 'center',
        }}
      >
        {t('recipe.notFound')}
      </Text>
      <Text
        style={{
          color: colors.content.tertiary,
          fontSize: fontSize.md,
          fontFamily: fonts.body,
          marginTop: spacing.sm,
          textAlign: 'center',
        }}
      >
        {t('recipe.notFoundMessage')}
      </Text>
      <Button
        variant="primary"
        onPress={onGoBack}
        label={t('common.goBack')}
        color={colors.button.primaryActive}
        style={{
          marginTop: spacing.xl,
        }}
      />
    </GradientBackground>
  );
};
