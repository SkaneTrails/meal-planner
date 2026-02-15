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
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
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
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
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
          ? 'rgba(122, 104, 88, 0.2)'
          : 'rgba(122, 104, 88, 0.12)',
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
