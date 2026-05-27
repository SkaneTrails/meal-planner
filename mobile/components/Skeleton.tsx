/**
 * Skeleton loading component for placeholder UI.
 * Provides animated shimmer effect for loading states.
 */

import { useEffect, useRef } from 'react';
import {
  Animated,
  type DimensionValue,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { spacing, useTheme } from '@/lib/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton = ({
  width = '100%',
  height = 16,
  borderRadius: radius,
  style,
}: SkeletonProps) => {
  const { colors, borderRadius: themeRadius } = useTheme();
  const resolvedRadius = radius ?? themeRadius.sm;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: resolvedRadius,
          backgroundColor: colors.bgDark,
          opacity,
        },
        style,
      ]}
    />
  );
};

interface RecipeCardSkeletonProps {
  cardSize?: number;
}

export const RecipeCardSkeleton = ({
  cardSize = 170,
}: RecipeCardSkeletonProps) => {
  const { colors, borderRadius } = useTheme();
  const imageHeight = cardSize * 0.72;

  return (
    <View
      style={[
        styles.cardContainer,
        {
          width: cardSize,
          height: cardSize,
          backgroundColor: colors.white,
          borderRadius: borderRadius.md,
        },
      ]}
    >
      <Skeleton width="100%" height={imageHeight} borderRadius={0} />
      <View style={styles.cardContent}>
        <Skeleton width="80%" height={14} />
        <View style={styles.cardRow}>
          <Skeleton width={50} height={20} />
        </View>
      </View>
    </View>
  );
};

interface RecipeListSkeletonProps {
  count?: number;
  cardSize?: number;
}

export const RecipeListSkeleton = ({
  count = 6,
  cardSize = 170,
}: RecipeListSkeletonProps) => {
  return (
    <View style={styles.gridContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ padding: spacing.xs }}>
          <RecipeCardSkeleton cardSize={cardSize} />
        </View>
      ))}
    </View>
  );
};

export const StatCardSkeleton = () => {
  const { colors, borderRadius } = useTheme();

  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.white, borderRadius: borderRadius.md },
      ]}
    >
      <Skeleton width={32} height={32} borderRadius={10} />
      <Skeleton width={40} height={10} style={{ marginTop: 8 }} />
      <Skeleton width={30} height={24} style={{ marginTop: 4 }} />
      <Skeleton width="100%" height={32} style={{ marginTop: 8 }} />
    </View>
  );
};

export const HomeScreenSkeleton = () => {
  const { borderRadius } = useTheme();
  return (
    <View style={styles.homeContainer}>
      {/* Top bar icons */}
      <View style={styles.topBar}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>

      {/* Hero next-meal card */}
      <View style={styles.heroWrap}>
        <Skeleton width="100%" height={320} borderRadius={borderRadius.lg} />
      </View>

      {/* Week strip header */}
      <View style={styles.weekHeader}>
        <Skeleton width={120} height={14} />
        <Skeleton width={140} height={14} />
      </View>
      <View style={styles.weekStrip}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={i} style={styles.weekCell}>
            <Skeleton width={10} height={10} />
            <Skeleton width={18} height={20} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>

      {/* Inspiration heading + card */}
      <View style={styles.inspirationHeader}>
        <Skeleton width={120} height={20} />
        <Skeleton width={72} height={28} borderRadius={14} />
      </View>
      <View style={styles.heroWrap}>
        <Skeleton width="100%" height={220} borderRadius={borderRadius.lg} />
      </View>
    </View>
  );
};

export const GroceryItemSkeleton = () => {
  const { colors, borderRadius } = useTheme();

  return (
    <View
      style={[
        styles.groceryItem,
        { backgroundColor: colors.white, borderRadius: borderRadius.md },
      ]}
    >
      <Skeleton width={24} height={24} borderRadius={6} />
      <View style={styles.groceryItemContent}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={12} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
};

interface GroceryListSkeletonProps {
  count?: number;
}

export const GroceryListSkeleton = ({
  count = 8,
}: GroceryListSkeletonProps) => {
  const { colors, borderRadius } = useTheme();
  return (
    <View style={styles.groceryContainer}>
      {/* Stats card skeleton */}
      <View
        style={[
          styles.groceryStats,
          { backgroundColor: colors.white, borderRadius: borderRadius.md },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Skeleton width={120} height={13} />
          <Skeleton width={150} height={20} style={{ marginTop: 4 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={44} height={38} />
          <Skeleton width={44} height={38} />
        </View>
      </View>
      <Skeleton
        width="100%"
        height={6}
        borderRadius={3}
        style={{ marginTop: spacing.lg }}
      />

      {/* List items */}
      <View style={{ marginTop: spacing.xl }}>
        {Array.from({ length: count }).map((_, i) => (
          <GroceryItemSkeleton key={i} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    padding: spacing['sm-md'],
    justifyContent: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing['xs-sm'],
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
  },
  homeContainer: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  heroWrap: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  weekCell: {
    alignItems: 'center',
    flex: 1,
  },
  inspirationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginTop: -spacing.sm,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  groceryContainer: {
    paddingHorizontal: spacing.xl,
  },
  groceryStats: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groceryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing['md-lg'],
    marginBottom: spacing.sm,
  },
  groceryItemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
});
