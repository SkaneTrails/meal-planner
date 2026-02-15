import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import type { TFunction } from '@/lib/i18n';
import { colors, fontFamily, fontSize, spacing } from '@/lib/theme';

interface TimeStatProps {
  icon: 'timer' | 'flame' | 'time' | 'people';
  label: string;
  value: string;
  showBorder: boolean;
}

const TimeStat = ({ icon, label, value, showBorder }: TimeStatProps) => (
  <View
    style={{
      flex: 1,
      alignItems: 'center',
      borderLeftWidth: showBorder ? 1 : 0,
      borderLeftColor: 'rgba(139, 115, 85, 0.15)',
    }}
  >
    <Ionicons name={icon} size={18} color="#5D4037" />
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
        color: '#5D4037',
      }}
    >
      {value}
    </Text>
  </View>
);

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
  const hasAnyTime = prepTime || cookTime || totalTime;
  if (!hasAnyTime && !servings) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        marginTop: spacing.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        borderRadius: 16,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
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
