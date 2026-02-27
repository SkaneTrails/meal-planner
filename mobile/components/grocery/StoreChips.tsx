import { ScrollView } from 'react-native';
import { FilterChip } from '@/components/FilterChip';
import { useTranslation } from '@/lib/i18n';
import { spacing, useTheme } from '@/lib/theme';
import type { GroceryStore } from '@/lib/types';

interface StoreChipsProps {
  stores: GroceryStore[];
  activeStoreId: string | null;
  onSelect: (storeId: string | null) => void;
}

export const StoreChips = ({
  stores,
  activeStoreId,
  onSelect,
}: StoreChipsProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (stores.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.xs, paddingVertical: spacing.xs }}
    >
      <FilterChip
        label={t('grocery.allStores')}
        selected={activeStoreId === null}
        onPress={() => onSelect(null)}
        activeColor={colors.accent}
      />
      {stores.map((store) => (
        <FilterChip
          key={store.id}
          label={store.name}
          selected={activeStoreId === store.id}
          onPress={() => onSelect(store.id)}
          activeColor={colors.accent}
        />
      ))}
    </ScrollView>
  );
};
