/**
 * Skeleton loading component for placeholder UI.
 * Provides animated shimmer effect for loading states.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius } from '@/lib/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius: radius = borderRadius.sm,
  style,
}: SkeletonProps) {
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
      ])
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
          borderRadius: radius,
          backgroundColor: colors.bgDark,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface RecipeCardSkeletonProps {
  cardSize?: number;
}

export function RecipeCardSkeleton({ cardSize = 170 }: RecipeCardSkeletonProps) {
  const imageHeight = cardSize * 0.72;

  return (
    <View style={[styles.cardContainer, { width: cardSize, height: cardSize }]}>
      <Skeleton width="100%" height={imageHeight} borderRadius={0} />
      <View style={styles.cardContent}>
        <Skeleton width="80%" height={14} />
        <View style={styles.cardRow}>
          <Skeleton width={50} height={20} />
        </View>
      </View>
    </View>
  );
}

export function RecipeListSkeleton({ count = 6, cardSize = 170 }: { count?: number; cardSize?: number }) {
  return (
    <View style={styles.gridContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ padding: 4 }}>
          <RecipeCardSkeleton cardSize={cardSize} />
        </View>
      ))}
    </View>
  );
}

export function StatCardSkeleton() {
  return (
    <View style={styles.statCard}>
      <Skeleton width={32} height={32} borderRadius={10} />
      <Skeleton width={40} height={10} style={{ marginTop: 8 }} />
      <Skeleton width={30} height={24} style={{ marginTop: 4 }} />
      <Skeleton width="100%" height={32} style={{ marginTop: 8 }} borderRadius={borderRadius.sm} />
    </View>
  );
}

export function HomeScreenSkeleton() {
  return (
    <View style={styles.homeContainer}>
      {/* Hero skeleton */}
      <Skeleton width="100%" height={200} borderRadius={0} />

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </View>

      {/* Add recipe section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Skeleton width={28} height={28} borderRadius={8} />
          <Skeleton width={100} height={16} style={{ marginLeft: 8 }} />
        </View>
        <Skeleton width="100%" height={52} borderRadius={borderRadius.md} />
      </View>

      {/* Next up section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Skeleton width={28} height={28} borderRadius={8} />
          <Skeleton width={60} height={16} style={{ marginLeft: 8 }} />
        </View>
        <Skeleton width="100%" height={64} borderRadius={borderRadius.md} />
      </View>
    </View>
  );
}

export function GroceryItemSkeleton() {
  return (
    <View style={styles.groceryItem}>
      <Skeleton width={24} height={24} borderRadius={6} />
      <View style={styles.groceryItemContent}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={12} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

export function GroceryListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <View style={styles.groceryContainer}>
      {/* Stats card skeleton */}
      <View style={styles.groceryStats}>
        <View style={{ flex: 1 }}>
          <Skeleton width={120} height={13} />
          <Skeleton width={150} height={20} style={{ marginTop: 4 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={44} height={38} borderRadius={borderRadius.sm} />
          <Skeleton width={44} height={38} borderRadius={borderRadius.sm} />
        </View>
      </View>
      <Skeleton width="100%" height={6} borderRadius={3} style={{ marginTop: 16 }} />

      {/* List items */}
      <View style={{ marginTop: 20 }}>
        {Array.from({ length: count }).map((_, i) => (
          <GroceryItemSkeleton key={i} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: 12,
  },
  homeContainer: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: -8,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  groceryContainer: {
    paddingHorizontal: 20,
  },
  groceryStats: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groceryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: 8,
  },
  groceryItemContent: {
    flex: 1,
    marginLeft: 12,
  },
});
