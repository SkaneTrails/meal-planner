import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { AnimatedPressable } from '@/components';
import type { useHomeScreenData } from '@/lib/hooks/useHomeScreenData';
import { WEEKLY_TRACKABLE_MEALS } from '@/lib/hooks/useHomeScreenData';
import {
  borderRadius,
  fontFamily,
  fontSize,
  letterSpacing,
  shadows,
} from '@/lib/theme';

type Data = ReturnType<typeof useHomeScreenData>;

interface StatsCardsProps {
  recipesCount: Data['recipes']['length'];
  plannedMealsCount: Data['plannedMealsCount'];
  plannedMealsPercentage: Data['plannedMealsPercentage'];
  groceryItemsCount: Data['groceryItemsCount'];
  t: Data['t'];
}

export const StatsCards = ({
  recipesCount,
  plannedMealsCount,
  plannedMealsPercentage,
  groceryItemsCount,
  t,
}: StatsCardsProps) => {
  const router = useRouter();

  return (
    <View
      style={{
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 16,
      }}
    >
      <StatCard
        icon="book-outline"
        value={recipesCount}
        label={t('home.stats.recipes')}
        iconColor="#8B7355"
        onPress={() => router.push('/recipes')}
      />
      <StatCard
        icon="calendar-outline"
        value={`${plannedMealsPercentage}%`}
        subtitle={`${plannedMealsCount}/${WEEKLY_TRACKABLE_MEALS}`}
        label={t('home.stats.planned')}
        iconColor="#8B7355"
        onPress={() => router.push('/meal-plan')}
      />
      <StatCard
        icon="cart-outline"
        value={groceryItemsCount}
        label={t('home.stats.toBuy')}
        iconColor="#8B7355"
        onPress={() => router.push('/grocery')}
      />
    </View>
  );
};

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: number | string;
  subtitle?: string;
  label: string;
  iconColor: string;
  onPress: () => void;
}

const StatCard = ({
  icon,
  value,
  subtitle,
  label,
  iconColor,
  onPress,
}: StatCardProps) => (
  <AnimatedPressable
    onPress={onPress}
    hoverScale={1.03}
    pressScale={0.97}
    style={{
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.92)',
      borderRadius: borderRadius.md,
      padding: 12,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.04)',
      ...shadows.sm,
    }}
  >
    <Ionicons
      name={icon}
      size={18}
      color={iconColor}
      style={{ marginBottom: 8 }}
    />
    <Text
      style={{
        fontSize: fontSize['3xl'],
        fontFamily: fontFamily.bodySemibold,
        color: '#5D4E40',
        letterSpacing: letterSpacing.tight,
      }}
    >
      {value}
    </Text>
    <Text
      style={{
        fontSize: fontSize.xs,
        fontFamily: fontFamily.body,
        color: '#8B7355',
        marginBottom: 2,
        minHeight: fontSize.xs * 1.4,
      }}
    >
      {subtitle ?? ''}
    </Text>
    <Text
      style={{
        fontSize: fontSize.xs,
        color: '#8B7355',
        letterSpacing: letterSpacing.wide,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Text>
  </AnimatedPressable>
);
