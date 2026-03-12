/**
 * Container that fetches and renders up to 3 featured category carousels.
 *
 * Shows nothing while loading or when no categories match.
 */

import { Text, View } from 'react-native';
import { FeaturedCarousel } from '@/components/recipes/FeaturedCarousel';
import { useFeaturedCategories } from '@/lib/hooks/use-featured-categories';
import type { TFunction } from '@/lib/i18n';
import { fontSize, spacing, useTheme } from '@/lib/theme';

interface FeaturedCategoriesSectionProps {
  onRecipePress: (id: string) => void;
  t: TFunction;
}

export const FeaturedCategoriesSection = ({
  onRecipePress,
  t,
}: FeaturedCategoriesSectionProps) => {
  const { data } = useFeaturedCategories();
  const { colors, fonts } = useTheme();

  if (!data?.categories.length) return null;

  return (
    <View
      style={{
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
      }}
    >
      {data.categories.map((category) => (
        <FeaturedCarousel
          key={category.key}
          categoryKey={category.key}
          recipes={category.recipes}
          onRecipePress={onRecipePress}
          t={t}
        />
      ))}
      <Text
        style={{
          fontSize: fontSize['3xl'],
          fontFamily: fonts.bodySemibold,
          fontWeight: 'bold',
          color: colors.content.heading,
          marginTop: spacing.xl,
          marginBottom: spacing.sm,
        }}
      >
        {t('recipes.allRecipes')}
      </Text>
    </View>
  );
};
