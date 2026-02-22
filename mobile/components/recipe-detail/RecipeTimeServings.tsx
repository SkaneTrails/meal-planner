import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { ContentCard, TerminalFrame } from '@/components';
import type { FrameSegment } from '@/components/TerminalFrame';
import type { TFunction } from '@/lib/i18n';
import { fontSize, letterSpacing, spacing, useTheme } from '@/lib/theme';

interface TimeStatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

const TimeStatCard = ({ icon, label, value }: TimeStatCardProps) => {
  const { colors, fonts, borderRadius, shadows, visibility } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.statsCard.bg,
        borderRadius: borderRadius.md,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.statsCard.borderColor,
        alignItems: 'center',
        ...shadows.sm,
      }}
    >
      {visibility.showStatIcons && (
        <Ionicons
          name={icon}
          size={18}
          color={colors.content.secondary}
          style={{ marginBottom: spacing.sm }}
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
          color: colors.content.secondary,
          letterSpacing: letterSpacing.wide,
          textTransform: 'uppercase',
        }}
      >
        {label}
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
  const { colors, fonts, visibility, chrome } = useTheme();
  const hasAnyTime = prepTime || cookTime || totalTime;
  if (!hasAnyTime && !servings) return null;

  const stats: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
  }[] = [];
  if (prepTime)
    stats.push({
      icon: 'timer',
      label: t('labels.time.prep'),
      value: `${prepTime}m`,
    });
  if (cookTime)
    stats.push({
      icon: 'flame',
      label: t('labels.time.cook'),
      value: `${cookTime}m`,
    });
  if (totalTime)
    stats.push({
      icon: 'time',
      label: t('labels.time.total'),
      value: `${totalTime}m`,
    });
  if (servings)
    stats.push({
      icon: 'people',
      label: t('labels.time.serves'),
      value: String(servings),
    });

  if (chrome === 'flat') {
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
    <ContentCard card={false} style={{ marginTop: spacing.lg }}>
      <View
        style={{
          flexDirection: 'row',
          gap: visibility.showStatDividers ? 0 : spacing.sm,
        }}
      >
        {stats.map((stat, i) => (
          <View key={stat.label} style={{ flex: 1, flexDirection: 'row' }}>
            <TimeStatCard
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
            />
            {visibility.showStatDividers && i < stats.length - 1 && (
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
  );
};
