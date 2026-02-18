import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { TerminalFrame } from '@/components';
import type { FrameSegment } from '@/components/TerminalFrame';
import type { TFunction } from '@/lib/i18n';
import { fontSize, letterSpacing, spacing, useTheme } from '@/lib/theme';

interface TimeStatProps {
  icon: 'timer' | 'flame' | 'time' | 'people';
  label: string;
  value: string;
  showBorder: boolean;
}

const TimeStat = ({ icon, label, value, showBorder }: TimeStatProps) => {
  const { colors, fonts } = useTheme();
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
          fontFamily: fonts.bodyBold,
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
  tags?: string[];
  /** Action segments rendered in the top border (CRT only). */
  actionSegments?: FrameSegment[];
  /** Visibility label rendered in the top border right (CRT only). */
  visibilityLabel?: string;
  t: TFunction;
}

export const RecipeTimeServings = ({
  prepTime,
  cookTime,
  totalTime,
  servings,
  tags,
  actionSegments,
  visibilityLabel,
  t,
}: RecipeTimeServingsProps) => {
  const { colors, fonts, borderRadius, shadows, crt } = useTheme();
  const hasAnyTime = prepTime || cookTime || totalTime;
  if (!hasAnyTime && !servings) return null;

  const stats: { label: string; value: string }[] = [];
  if (prepTime)
    stats.push({ label: t('labels.time.prep'), value: `${prepTime}m` });
  if (cookTime)
    stats.push({ label: t('labels.time.cook'), value: `${cookTime}m` });
  if (totalTime)
    stats.push({ label: t('labels.time.total'), value: `${totalTime}m` });
  if (servings)
    stats.push({ label: t('labels.time.serves'), value: String(servings) });

  if (crt) {
    const bottomLabel =
      tags && tags.length > 0 ? tags.map((t) => `#${t}`).join(' ') : undefined;
    return (
      <View style={{ marginTop: spacing.lg }}>
        <TerminalFrame
          variant="single"
          bottomLabel={bottomLabel}
          rightSegments={actionSegments}
          rightLabel={visibilityLabel}
        >
          <View style={{ flexDirection: 'row' }}>
            {stats.map((stat, i) => (
              <View key={stat.label} style={{ flex: 1, flexDirection: 'row' }}>
                <View style={{ flex: 1, alignItems: 'center', padding: 12 }}>
                  <Text
                    style={{
                      fontSize: fontSize['3xl'],
                      fontFamily: fonts.bodySemibold,
                      color: colors.content.body,
                      letterSpacing: letterSpacing.tight,
                    }}
                  >
                    {stat.value}
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
                    {stat.label}
                  </Text>
                </View>
                {i < stats.length - 1 && (
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
