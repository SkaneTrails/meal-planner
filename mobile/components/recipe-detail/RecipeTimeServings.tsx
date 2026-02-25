import { Pressable, Text, View } from 'react-native';
import { ContentCard, IconButton, TerminalFrame } from '@/components';
import type { FrameSegment } from '@/components/TerminalFrame';
import { type IoniconName, ThemeIcon } from '@/components/ThemeIcon';
import type { TFunction } from '@/lib/i18n';
import { fontSize, letterSpacing, spacing, useTheme } from '@/lib/theme';

interface TimeStatCardProps {
  icon: IoniconName;
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
        <ThemeIcon
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

interface ServingsInteractiveProps {
  value: string;
  isScaled: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onReset: () => void;
  decrementDisabled: boolean;
}

const ServingsInteractive = ({
  value,
  isScaled,
  onIncrement,
  onDecrement,
  onReset,
  decrementDisabled,
}: ServingsInteractiveProps) => {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        }}
      >
        <IconButton
          icon="remove"
          onPress={onDecrement}
          disabled={decrementDisabled}
          tone="alt"
          size="sm"
        />
        <Pressable onPress={isScaled ? onReset : undefined}>
          <Text
            style={{
              fontSize: fontSize['3xl'],
              fontFamily: fonts.bodySemibold,
              color: isScaled ? colors.primary : colors.content.body,
              letterSpacing: letterSpacing.tight,
              minWidth: 28,
              textAlign: 'center',
            }}
          >
            {value}
          </Text>
        </Pressable>
        <IconButton icon="add" onPress={onIncrement} tone="alt" size="sm" />
      </View>
    </View>
  );
};

const InteractiveStatCard = ({
  icon,
  label,
  value,
  isScaled,
  onIncrement,
  onDecrement,
  onReset,
  decrementDisabled,
}: TimeStatCardProps & ServingsInteractiveProps) => {
  const { colors, fonts, borderRadius, shadows, visibility } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.statsCard.bg,
        borderRadius: borderRadius.md,
        padding: 12,
        borderWidth: 1,
        borderColor: isScaled ? colors.primary : colors.statsCard.borderColor,
        alignItems: 'center',
        ...shadows.sm,
      }}
    >
      {visibility.showStatIcons && (
        <ThemeIcon
          name={icon}
          size={18}
          color={colors.content.secondary}
          style={{ marginBottom: spacing.sm }}
        />
      )}
      <ServingsInteractive
        value={value}
        isScaled={isScaled}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onReset={onReset}
        decrementDisabled={decrementDisabled}
      />
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
  portionScaling?: {
    currentPortions: number;
    originalPortions: number;
    isScaled: boolean;
    increment: () => void;
    decrement: () => void;
    reset: () => void;
  };
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
  portionScaling,
}: RecipeTimeServingsProps) => {
  const { colors, fonts, visibility, chrome } = useTheme();
  const hasAnyTime = prepTime || cookTime || totalTime;
  if (!hasAnyTime && !servings) return null;

  const stats: {
    icon: IoniconName;
    label: string;
    value: string;
    interactive?: boolean;
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
      value: portionScaling
        ? String(portionScaling.currentPortions)
        : String(servings),
      interactive: Boolean(
        portionScaling && portionScaling.originalPortions > 0,
      ),
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
                  {stat.interactive && portionScaling ? (
                    <ServingsInteractive
                      value={stat.value}
                      isScaled={portionScaling.isScaled}
                      onIncrement={portionScaling.increment}
                      onDecrement={portionScaling.decrement}
                      onReset={portionScaling.reset}
                      decrementDisabled={portionScaling.currentPortions <= 1}
                    />
                  ) : (
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
                  )}
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
            {stat.interactive && portionScaling ? (
              <InteractiveStatCard
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
                isScaled={portionScaling.isScaled}
                onIncrement={portionScaling.increment}
                onDecrement={portionScaling.decrement}
                onReset={portionScaling.reset}
                decrementDisabled={portionScaling.currentPortions <= 1}
              />
            ) : (
              <TimeStatCard
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
              />
            )}
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
