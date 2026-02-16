import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { BouncingLoader, GradientBackground } from '@/components';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  spacing,
} from '@/lib/theme';

interface RecipeLoadingProps {
  structured?: boolean;
}

export const RecipeLoading = ({ structured = true }: RecipeLoadingProps) => (
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
        boxShadow: '2px 4px 12px 0px rgba(0, 0, 0, 0.08)',
      }}
    >
      <BouncingLoader size={12} />
    </View>
  </GradientBackground>
);

interface RecipeNotFoundProps {
  t: TFunction;
  onGoBack: () => void;
}

export const RecipeNotFound = ({ t, onGoBack }: RecipeNotFoundProps) => (
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
        boxShadow: '2px 4px 12px 0px rgba(0, 0, 0, 0.08)',
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
        fontFamily: fontFamily.displayBold,
        textAlign: 'center',
      }}
    >
      {t('recipe.notFound')}
    </Text>
    <Text
      style={{
        color: colors.content.tertiary,
        fontSize: fontSize.md,
        fontFamily: fontFamily.body,
        marginTop: spacing.sm,
        textAlign: 'center',
      }}
    >
      {t('recipe.notFoundMessage')}
    </Text>
    <Pressable
      onPress={onGoBack}
      style={({ pressed }) => ({
        marginTop: spacing.xl,
        paddingHorizontal: 24,
        paddingVertical: spacing.md,
        backgroundColor: pressed
          ? colors.button.primaryDivider
          : colors.button.primaryActive,
        borderRadius: borderRadius.sm,
      })}
    >
      <Text
        style={{
          color: colors.content.body,
          fontSize: fontSize.lg,
          fontFamily: fontFamily.bodySemibold,
        }}
      >
        {t('common.goBack')}
      </Text>
    </Pressable>
  </GradientBackground>
);
