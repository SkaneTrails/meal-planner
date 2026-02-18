import type React from 'react';
import { ScrollView, View } from 'react-native';
import { spacing } from '@/lib/theme';

interface ChipGroupProps {
  children: React.ReactNode;
  /** `wrap` — flexWrap grid (settings screens). `horizontal` — horizontal ScrollView (note editor). */
  layout?: 'wrap' | 'horizontal';
  /** Gap between chips. Default: `spacing.sm` (8) for wrap, `spacing.sm` for horizontal. */
  gap?: number;
}

/**
 * Container for Chip elements. Provides two layout modes:
 * - `wrap` (default) — flex-wrap row for settings chip grids
 * - `horizontal` — horizontal ScrollView for note tag editors
 */
export const ChipGroup = ({
  children,
  layout = 'wrap',
  gap = spacing.sm,
}: ChipGroupProps) => {
  if (layout === 'horizontal') {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap }}>{children}</View>
      </ScrollView>
    );
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
      {children}
    </View>
  );
};
