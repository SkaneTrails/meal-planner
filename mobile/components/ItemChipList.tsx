import { Text, View } from 'react-native';
import { fontSize, spacing, useTheme } from '@/lib/theme';
import { Chip } from './Chip';
import { ChipGroup } from './ChipGroup';
import { SurfaceCard } from './SurfaceCard';

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
  /** Use subtle surface tint instead of SurfaceCard (for nesting inside ContentCard). */
  embedded?: boolean;
}

export const ItemChipList = ({
  heading,
  items,
  onRemove,
  disabled = false,
  capitalize = false,
  gap,
  dotColors,
  embedded = false,
}: ItemChipListProps) => {
  const { colors, fonts, borderRadius } = useTheme();

  if (items.length === 0) return null;

  const content = (
    <>
      <Text
        style={{
          fontSize: fontSize.xs,
          fontFamily: fonts.bodySemibold,
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
    </>
  );

  if (embedded) {
    return (
      <View
        style={{
          backgroundColor: colors.surface.subtle,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          marginBottom: spacing.md,
        }}
      >
        {content}
      </View>
    );
  }

  return (
    <SurfaceCard padding={spacing.md} style={{ marginBottom: spacing.md }}>
      {content}
    </SurfaceCard>
  );
};
