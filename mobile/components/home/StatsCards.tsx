import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { AnimatedPressable, TerminalFrame } from '@/components';
import type { useHomeScreenData } from '@/lib/hooks/useHomeScreenData';
import { WEEKLY_TRACKABLE_MEALS } from '@/lib/hooks/useHomeScreenData';
import { fontSize, letterSpacing, spacing, useTheme } from '@/lib/theme';

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
  const { colors, crt } = useTheme();
  const router = useRouter();

  const statCards = [
    <StatCard
      key="recipes"
      icon="book-outline"
      value={recipesCount}
      label={t('home.stats.recipes')}
      iconColor={colors.content.secondary}
      onPress={() => router.push('/recipes')}
    />,
    <StatCard
      key="planned"
      icon="calendar-outline"
      value={`${plannedMealsPercentage}%`}
      subtitle={`${plannedMealsCount}/${WEEKLY_TRACKABLE_MEALS}`}
      label={t('home.stats.planned')}
      iconColor={colors.content.secondary}
      onPress={() => router.push('/meal-plan')}
    />,
    <StatCard
      key="grocery"
      icon="cart-outline"
      value={groceryItemsCount}
      label={t('home.stats.toBuy')}
      iconColor={colors.content.secondary}
      onPress={() => router.push('/grocery')}
    />,
  ];

  if (crt) {
    return (
      <View
        style={{
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.lg,
        }}
      >
        <TerminalFrame variant="single">
          <View style={{ flexDirection: 'row' }}>
            {statCards.map((card, i) => (
              <View key={i} style={{ flex: 1, flexDirection: 'row' }}>
                {card}
                {i < statCards.length - 1 && (
                  <View
                    style={{
                      width: 1,
                      backgroundColor: colors.primary,
                      opacity: 0.3,
                    }}
                  />
                )}
              </View>
            ))}
          </View>
        </TerminalFrame>
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        marginBottom: spacing.lg,
      }}
    >
      {statCards}
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
}: StatCardProps) => {
  const { colors, fonts, borderRadius, shadows, visibility } = useTheme();

  return (
    <AnimatedPressable
      onPress={onPress}
      hoverScale={1.03}
      pressScale={0.97}
      style={{
        flex: 1,
        backgroundColor: colors.statsCard.bg,
        borderRadius: borderRadius.md,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.statsCard.borderColor,
        ...shadows.sm,
      }}
    >
      {visibility.showStatIcons && (
        <Ionicons
          name={icon}
          size={18}
          color={iconColor}
          style={{ marginBottom: 8 }}
        />
      )}
      <Text
        style={{
          fontSize: fontSize['3xl'],
          fontFamily: fonts.bodySemibold,
          color: colors.content.body,
          letterSpacing: letterSpacing.tight,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: fontSize.xs,
          fontFamily: fonts.body,
          color: subtitle ? colors.content.secondary : 'transparent',
          marginBottom: 2,
        }}
      >
        {subtitle || ' '}
      </Text>
      <Text
        style={{
          fontSize: fontSize.xs,
          fontFamily: fonts.body,
          color: colors.content.secondary,
          letterSpacing: letterSpacing.wide,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
};
