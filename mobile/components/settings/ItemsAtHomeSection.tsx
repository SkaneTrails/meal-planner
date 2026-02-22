import { useMemo, useState } from 'react';
import {
  EmptyState,
  InlineAddInput,
  ItemChipList,
  SuggestionChipList,
} from '@/components';
import { showNotification } from '@/lib/alert';
import { useTranslation } from '@/lib/i18n';
import { spacing, useTheme } from '@/lib/theme';

const SUGGESTED_ITEM_KEYS = [
  'salt',
  'pepper',
  'oliveOil',
  'vegetableOil',
  'butter',
  'sugar',
  'flour',
  'garlic',
  'onion',
  'soySauce',
  'vinegar',
  'honey',
  'rice',
  'pasta',
  'eggs',
] as const;

interface ItemsAtHomeSectionProps {
  itemsAtHome: string[];
  onAddItem: (item: string) => Promise<void>;
  onRemoveItem: (item: string) => Promise<void>;
}

export const ItemsAtHomeSection = ({
  itemsAtHome,
  onAddItem,
  onRemoveItem,
}: ItemsAtHomeSectionProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [newItem, setNewItem] = useState('');

  const suggestedItems = useMemo(
    () => SUGGESTED_ITEM_KEYS.map((key) => t(`settings.suggestedItems.${key}`)),
    [t],
  );

  const handleAddItem = async () => {
    const item = newItem.trim();
    if (!item) return;
    try {
      await onAddItem(item);
      setNewItem('');
    } catch {
      showNotification(t('common.error'), t('settings.failedToAddItem'));
    }
  };

  const handleRemoveItem = async (item: string) => {
    try {
      await onRemoveItem(item);
    } catch {
      showNotification(t('common.error'), t('settings.failedToRemoveItem'));
    }
  };

  const handleAddSuggested = async (item: string) => {
    if (itemsAtHome.includes(item.toLowerCase())) return;
    try {
      await onAddItem(item);
    } catch {
      showNotification(t('common.error'), t('settings.failedToAddItem'));
    }
  };

  const suggestedNotAdded = suggestedItems.filter(
    (item) => !itemsAtHome.includes(item.toLowerCase()),
  );

  return (
    <>
      <ItemChipList
        heading={t('settings.yourItems', { count: itemsAtHome.length })}
        items={itemsAtHome}
        onRemove={handleRemoveItem}
        capitalize
        gap={spacing['xs-sm']}
      />

      <InlineAddInput
        value={newItem}
        onChangeText={setNewItem}
        onSubmit={handleAddItem}
        placeholder={t('settings.addItemPlaceholder')}
        placeholderTextColor={colors.content.subtitle}
      />

      {suggestedNotAdded.length > 0 && (
        <SuggestionChipList
          heading={t('settings.suggestions')}
          items={suggestedNotAdded}
          onAdd={handleAddSuggested}
          gap={spacing['xs-sm']}
        />
      )}

      {itemsAtHome.length === 0 && (
        <EmptyState
          variant="compact"
          icon="basket-outline"
          title={t('settings.noItemsYet')}
          subtitle={t('settings.addItemsHint')}
          style={{ marginTop: spacing.sm }}
        />
      )}
    </>
  );
};
