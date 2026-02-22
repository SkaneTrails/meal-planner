import { Text } from 'react-native';
import { Chip, ChipGroup, SurfaceCard } from '@/components';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';

export type ChipItem = string | { key: string; label: string };

const getKey = (item: ChipItem): string =>
  typeof item === 'string' ? item : item.key;
const getLabel = (item: ChipItem): string =>
  typeof item === 'string' ? item : item.label;

interface ItemChipListProps {
  heading: string;
  items: ChipItem[];
  onRemove: (key: string) => void;
  disabled?: boolean;
  capitalize?: boolean;
  gap?: number;
  dotColors?: readonly string[];
}

export const ItemChipList = ({
  heading,
  items,
  onRemove,
  disabled = false,
  capitalize = false,
  gap,
  dotColors,
}: ItemChipListProps) => {
  const { colors } = useTheme();

  if (items.length === 0) return null;

  return (
    <SurfaceCard padding={spacing.md} style={{ marginBottom: spacing.md }}>
      <Text
        style={{
          fontSize: fontSize.xs,
          fontWeight: fontWeight.semibold,
          color: colors.content.strong,
          marginBottom: spacing.sm,
        }}
      >
        {heading}
      </Text>
      <ChipGroup gap={gap}>
        {items.map((item, index) => (
          <Chip
            key={getKey(item)}
            label={getLabel(item)}
            variant="filled"
            capitalize={capitalize}
            disabled={disabled}
            dot={dotColors?.[index % dotColors.length]}
            onPress={() => onRemove(getKey(item))}
          />
        ))}
      </ChipGroup>
    </SurfaceCard>
  );
};
