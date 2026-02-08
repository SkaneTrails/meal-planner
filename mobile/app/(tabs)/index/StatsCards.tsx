import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { shadows, borderRadius, fontSize, fontFamily, letterSpacing } from '@/lib/theme';
import { AnimatedPressable } from '@/components';
import type { useHomeScreenData } from './useHomeScreenData';

type Data = ReturnType<typeof useHomeScreenData>;

interface StatsCardsProps {
  recipesCount: Data['recipes']['length'];
  plannedMealsCount: Data['plannedMealsCount'];
  groceryItemsCount: Data['groceryItemsCount'];
  t: Data['t'];
}

export const StatsCards = ({ recipesCount, plannedMealsCount, groceryItemsCount, t }: StatsCardsProps) => {
  const router = useRouter();

  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 }}>
      <StatCard icon="book-outline" value={recipesCount} label={t('home.stats.recipes')} onPress={() => router.push('/recipes')} />
      <StatCard icon="calendar-outline" value={plannedMealsCount} label={t('home.stats.planned')} onPress={() => router.push('/meal-plan')} />
      <StatCard icon="cart-outline" value={groceryItemsCount} label={t('home.stats.toBuy')} onPress={() => router.push('/grocery')} />
    </View>
  );
};

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  onPress: () => void;
}

const StatCard = ({ icon, value, label, onPress }: StatCardProps) => (
  <AnimatedPressable
    onPress={onPress}
    hoverScale={1.03}
    pressScale={0.97}
    style={{
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.35)',
      borderRadius: borderRadius.md,
      padding: 12,
      ...shadows.sm,
    }}
  >
    <Ionicons name={icon} size={18} color="#8B7355" style={{ marginBottom: 8 }} />
    <Text style={{
      fontSize: fontSize['3xl'],
      fontFamily: fontFamily.bodySemibold,
      color: '#5D4E40',
      letterSpacing: letterSpacing.tight,
      marginBottom: 2,
    }}>
      {value}
    </Text>
    <Text style={{
      fontSize: fontSize.xs,
      color: '#8B7355',
      letterSpacing: letterSpacing.wide,
      textTransform: 'uppercase',
    }}>
      {label}
    </Text>
  </AnimatedPressable>
);
