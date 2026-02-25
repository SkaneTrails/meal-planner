import { Text, View } from 'react-native';
import { fontSize, spacing, useTheme } from '@/lib/theme';
import { Chip } from './Chip';
import { ChipGroup } from './ChipGroup';
import type { ChipItem } from './ItemChipList';
import { SurfaceCard } from './SurfaceCard';

const getKey = (item: ChipItem): string =>
  typeof item === 'string' ? item : item.key;
const getLabel = (item: ChipItem): string =>
  typeof item === 'string' ? item : item.label;

export interface SuggestionGroup {
  heading: string;
  items: ChipItem[];
}

interface SuggestionChipListProps {
  heading?: string;
  items?: ChipItem[];
  groups?: SuggestionGroup[];
  onAdd: (key: string) => void;
  disabled?: boolean;
  gap?: number;
  dotColor?: string;
  /** Use subtle surface tint instead of SurfaceCard (for nesting inside ContentCard). */
  embedded?: boolean;
}

export const SuggestionChipList = ({
  heading,
  items,
  groups,
  onAdd,
  disabled = false,
  gap,
  dotColor,
  embedded = false,
}: SuggestionChipListProps) => {
  const { colors, fonts, borderRadius } = useTheme();

  const Wrapper = embedded ? EmbeddedCard : SurfaceCardWrapper;

  if (groups) {
    const hasItems = groups.some((g) => g.items.length > 0);
    if (!hasItems) return null;

    return (
      <Wrapper colors={colors} borderRadius={borderRadius} radius="lg">
        {groups.map(({ heading: groupHeading, items: groupItems }) => {
          if (groupItems.length === 0) return null;
          return (
            <View key={groupHeading} style={{ marginBottom: spacing.lg }}>
              <Text
                style={{
                  fontSize: fontSize.xs,
                  fontFamily: fonts.bodySemibold,
                  color: colors.content.strong,
                  marginBottom: spacing.sm,
                  textTransform: 'uppercase',
                }}
              >
                {groupHeading}
              </Text>
              <ChipGroup gap={gap}>
                {groupItems.map((item) => (
                  <Chip
                    key={getKey(item)}
                    label={getLabel(item)}
                    variant="outline"
                    disabled={disabled}
                    dot={dotColor}
                    onPress={() => onAdd(getKey(item))}
                  />
                ))}
              </ChipGroup>
            </View>
          );
        })}
      </Wrapper>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <Wrapper colors={colors} borderRadius={borderRadius}>
      {heading && (
        <Text
          style={{
            fontSize: fontSize.xs,
            fontFamily: fonts.bodySemibold,
            color: colors.content.icon,
            marginBottom: spacing.sm,
          }}
        >
          {heading}
        </Text>
      )}
      <ChipGroup gap={gap}>
        {items.map((item) => (
          <Chip
            key={getKey(item)}
            label={getLabel(item)}
            variant="outline"
            disabled={disabled}
            dot={dotColor}
            onPress={() => onAdd(getKey(item))}
          />
        ))}
      </ChipGroup>
    </Wrapper>
  );
};

/* ── Wrapper variants ──────────────────────────────────────── */

interface WrapperProps {
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>['colors'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
  radius?: 'sm' | 'md' | 'lg';
}

const SurfaceCardWrapper = ({ children, radius = 'md' }: WrapperProps) => (
  <SurfaceCard padding={spacing.md} radius={radius}>
    {children}
  </SurfaceCard>
);

const EmbeddedCard = ({
  children,
  colors,
  borderRadius,
  radius = 'md',
}: WrapperProps) => (
  <View
    style={{
      backgroundColor: colors.surface.subtle,
      borderRadius: borderRadius[radius],
      padding: spacing.md,
    }}
  >
    {children}
  </View>
);
