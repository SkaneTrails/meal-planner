/**
 * Container that fetches and renders up to 3 featured category carousels.
 *
 * Shows nothing while loading or when no categories match.
 */

import { Text, View } from 'react-native';
import { FeaturedCarousel } from '@/components/recipes/FeaturedCarousel';
import { useFeaturedCategories } from '@/lib/hooks/use-featured-categories';
import type { TFunction } from '@/lib/i18n';
import { fontSize, letterSpacing, spacing, useTheme } from '@/lib/theme';

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
      {/* Eyebrow-style divider into the main grid below — same typographic
          treatment as the editorial eyebrows on the home tab so the two
          surfaces share a section-label language. */}
      <Text
        style={{
          fontSize: fontSize.xs,
          fontFamily: fonts.bodySemibold,
          color: colors.content.subtitle,
          letterSpacing: letterSpacing.wider,
          textTransform: 'uppercase',
          marginTop: spacing.xl,
          marginBottom: spacing.sm,
        }}
      >
        {t('recipes.allRecipes')}
      </Text>
    </View>
  );
};
