import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  fontFamily,
  fontSize,
  shadows,
  spacing,
  useTheme,
} from '@/lib/theme';

interface TimeStatProps {
  icon: 'timer' | 'flame' | 'time' | 'people';
  label: string;
  value: string;
  showBorder: boolean;
}

const TimeStat = ({ icon, label, value, showBorder }: TimeStatProps) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        borderLeftWidth: showBorder ? 1 : 0,
        borderLeftColor: colors.chip.divider,
      }}
    >
      <Ionicons name={icon} size={18} color={colors.content.body} />
      <Text
        style={{
          fontSize: fontSize.sm,
          color: colors.content.secondary,
          marginTop: spacing.xs,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: fontSize.lg,
          fontFamily: fontFamily.bodyBold,
          color: colors.content.body,
        }}
      >
        {value}
      </Text>
    </View>
  );
};

interface RecipeTimeServingsProps {
  prepTime: number | null | undefined;
  cookTime: number | null | undefined;
  totalTime: number | null;
  servings: number | string | null | undefined;
  t: TFunction;
}

export const RecipeTimeServings = ({
  prepTime,
  cookTime,
  totalTime,
  servings,
  t,
}: RecipeTimeServingsProps) => {
  const { colors } = useTheme();
  const hasAnyTime = prepTime || cookTime || totalTime;
  if (!hasAnyTime && !servings) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        marginTop: spacing.lg,
        backgroundColor: colors.glass.solid,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        ...shadows.card,
      }}
    >
      {prepTime ? (
        <TimeStat
          icon="timer"
          label={t('labels.time.prep')}
          value={`${prepTime}m`}
          showBorder={false}
        />
      ) : null}
      {cookTime ? (
        <TimeStat
          icon="flame"
          label={t('labels.time.cook')}
          value={`${cookTime}m`}
          showBorder={Boolean(prepTime)}
        />
      ) : null}
      {totalTime ? (
        <TimeStat
          icon="time"
          label={t('labels.time.total')}
          value={`${totalTime}m`}
          showBorder={Boolean(prepTime || cookTime)}
        />
      ) : null}
      {servings ? (
        <TimeStat
          icon="people"
          label={t('labels.time.serves')}
          value={String(servings)}
          showBorder={Boolean(hasAnyTime)}
        />
      ) : null}
    </View>
  );
};
