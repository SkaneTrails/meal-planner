import { useState } from 'react';
import { EmptyState, InlineAddInput, ItemChipList } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { spacing, useTheme } from '@/lib/theme';
import type { GroceryStore } from '@/lib/types';

interface GroceryStoresSectionProps {
  stores: GroceryStore[];
  canEdit: boolean;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}

export const GroceryStoresSection = ({
  stores,
  canEdit,
  onAdd,
  onRemove,
}: GroceryStoresSectionProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [newStoreName, setNewStoreName] = useState('');

  const handleAdd = () => {
    const trimmed = newStoreName.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewStoreName('');
  };

  const chipItems = stores.map((store) => ({
    key: store.id,
    label: store.name,
  }));

  return (
    <>
      <ItemChipList
        heading={t('householdSettings.groceryStores.yourStores', {
          count: stores.length,
        })}
        items={chipItems}
        onRemove={onRemove}
        disabled={!canEdit}
        dotColors={colors.tagDot}
      />

      {canEdit && (
        <InlineAddInput
          value={newStoreName}
          onChangeText={setNewStoreName}
          onSubmit={handleAdd}
          placeholder={t('householdSettings.groceryStores.addPlaceholder')}
        />
      )}

      {stores.length === 0 && (
        <EmptyState
          variant="compact"
          icon="storefront-outline"
          title={t('householdSettings.groceryStores.noStoresYet')}
          subtitle={t('householdSettings.groceryStores.addStoresHint')}
          style={{ marginTop: spacing.sm }}
        />
      )}
    </>
  );
};
