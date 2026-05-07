import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { AnimatedPressable, ContentCard } from '@/components';
import { type IoniconName, ThemeIcon } from '@/components/ThemeIcon';
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
  const { colors, visibility } = useTheme();
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

  return (
    <View
      style={{
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
      }}
    >
      <ContentCard card={false}>
        <View
          style={{
            flexDirection: 'row',
            gap: visibility.showStatDividers ? 0 : spacing.sm,
          }}
        >
          {statCards.map((card, i) => (
            <View key={i} style={{ flex: 1, flexDirection: 'row' }}>
              {card}
              {visibility.showStatDividers && i < statCards.length - 1 && (
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
      </ContentCard>
    </View>
  );
};

interface StatCardProps {
  icon: IoniconName;
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
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flex: 1,
        backgroundColor: colors.statsCard.bg,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderWidth: 1,
        borderColor: colors.statsCard.borderColor,
        alignItems: 'center',
        ...shadows.sm,
      }}
    >
      {visibility.showStatIcons && (
        <ThemeIcon
          name={icon}
          size={16}
          color={iconColor}
          style={{ marginBottom: spacing['2xs'] }}
        />
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          gap: spacing['2xs'],
        }}
      >
        <Text
          style={{
            fontSize: fontSize['2xl'],
            fontFamily: fonts.bodySemibold,
            color: colors.content.body,
            letterSpacing: letterSpacing.tight,
          }}
          numberOfLines={1}
        >
          {value}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: fontSize.xs,
              fontFamily: fonts.body,
              color: colors.content.secondary,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
      <Text
        style={{
          fontSize: fontSize.xs,
          fontFamily: fonts.body,
          color: colors.content.secondary,
          letterSpacing: letterSpacing.wide,
          textTransform: 'uppercase',
          marginTop: 2,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
};
