/**
 * Horizontally scrollable recipe carousel for a single featured category.
 *
 * Renders a bold title (with arrow buttons on web) above a horizontal
 * row of recipe cards that can be scrolled sideways.
 */

import { useCallback, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  type ScrollView as RNScrollView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { RecipeCard } from '@/components';
import { ContentCard } from '@/components/ContentCard';
import { ThemeIcon } from '@/components/ThemeIcon';
import type { TFunction } from '@/lib/i18n';
import {
  fontSize,
  iconContainer,
  iconSize,
  opacity,
  spacing,
  useTheme,
} from '@/lib/theme';
import type { Recipe } from '@/lib/types';

const CARD_WIDTH = 170;
const SCROLL_AMOUNT = CARD_WIDTH * 2;

interface FeaturedCarouselProps {
  categoryKey: string;
  recipes: Recipe[];
  onRecipePress: (id: string) => void;
  t: TFunction;
}

const ArrowButton = ({
  direction,
  onPress,
  disabled,
  t,
}: {
  direction: 'back' | 'forward';
  onPress: () => void;
  disabled: boolean;
  t: TFunction;
}) => {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={
        direction === 'back'
          ? t('featured.scrollBack')
          : t('featured.scrollForward')
      }
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        width: iconContainer.sm,
        height: iconContainer.sm,
        opacity: disabled ? opacity.disabled : 1,
      }}
    >
      <ThemeIcon
        name={direction === 'back' ? 'chevron-back' : 'chevron-forward'}
        size={iconSize.xl}
        color={colors.content.secondary}
      />
    </Pressable>
  );
};

export const FeaturedCarousel = ({
  categoryKey,
  recipes,
  onRecipePress,
  t,
}: FeaturedCarouselProps) => {
  const { fonts, colors, borderRadius } = useTheme();
  const scrollRef = useRef<RNScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const isWeb = Platform.OS === 'web';
  const canScrollBack = scrollOffset > 0;
  const canScrollForward =
    contentWidth > containerWidth &&
    scrollOffset < contentWidth - containerWidth - 1;

  const scroll = useCallback(
    (direction: 'back' | 'forward') => {
      const offset =
        direction === 'forward'
          ? Math.min(
              scrollOffset + SCROLL_AMOUNT,
              contentWidth - containerWidth,
            )
          : Math.max(scrollOffset - SCROLL_AMOUNT, 0);
      scrollRef.current?.scrollTo({ x: offset, animated: true });
    },
    [scrollOffset, contentWidth, containerWidth],
  );

  const categoryTitle = t(`featured.${categoryKey}`);

  return (
    <ContentCard
      padding={0}
      cardStyle={{
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        backgroundColor: colors.surface.active,
        borderWidth: 0,
      }}
      style={{ marginBottom: spacing.lg }}
    >
      {/* Title row — arrows sit beside the title on web */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          marginBottom: spacing.md,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: fontSize.xl,
            fontFamily: fonts.bodySemibold,
            fontWeight: 'bold',
            color: colors.content.heading,
          }}
        >
          {categoryTitle}
        </Text>

        {isWeb && (
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <ArrowButton
              direction="back"
              onPress={() => scroll('back')}
              disabled={!canScrollBack}
              t={t}
            />
            <ArrowButton
              direction="forward"
              onPress={() => scroll('forward')}
              disabled={!canScrollForward}
              t={t}
            />
          </View>
        )}
      </View>

      {/* Scroll area */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => setScrollOffset(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
        onContentSizeChange={(w) => setContentWidth(w)}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
          gap: spacing.md,
        }}
      >
        {recipes.map((recipe) => (
          <View key={recipe.id} style={{ width: CARD_WIDTH }}>
            <RecipeCard
              recipe={recipe}
              onPress={() => onRecipePress(recipe.id)}
              cardSize={CARD_WIDTH}
              showFavorite={false}
            />
          </View>
        ))}
      </ScrollView>
    </ContentCard>
  );
};
