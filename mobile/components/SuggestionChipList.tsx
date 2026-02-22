import { Text, View } from 'react-native';
import { Chip, ChipGroup, SurfaceCard } from '@/components';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';
import type { ChipItem } from './ItemChipList';

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
}

export const SuggestionChipList = ({
  heading,
  items,
  groups,
  onAdd,
  disabled = false,
  gap,
  dotColor,
}: SuggestionChipListProps) => {
  const { colors } = useTheme();

  if (groups) {
    const hasItems = groups.some((g) => g.items.length > 0);
    if (!hasItems) return null;

    return (
      <SurfaceCard radius="lg">
        {groups.map(({ heading: groupHeading, items: groupItems }) => {
          if (groupItems.length === 0) return null;
          return (
            <View key={groupHeading} style={{ marginBottom: spacing.lg }}>
              <Text
                style={{
                  fontSize: fontSize.xs,
                  fontWeight: fontWeight.semibold,
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
      </SurfaceCard>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <SurfaceCard padding={spacing.md}>
      {heading && (
        <Text
          style={{
            fontSize: fontSize.xs,
            fontWeight: fontWeight.semibold,
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
    </SurfaceCard>
  );
};
