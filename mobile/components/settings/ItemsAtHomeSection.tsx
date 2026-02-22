import { useMemo, useState } from 'react';
import { Text } from 'react-native';
import {
  Chip,
  ChipGroup,
  EmptyState,
  InlineAddInput,
  SurfaceCard,
} from '@/components';
import { showNotification } from '@/lib/alert';
import { useTranslation } from '@/lib/i18n';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';

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
      {/* Current items */}
      {itemsAtHome.length > 0 && (
        <CurrentItems items={itemsAtHome} onRemove={handleRemoveItem} />
      )}

      {/* Add new item input */}
      <InlineAddInput
        value={newItem}
        onChangeText={setNewItem}
        onSubmit={handleAddItem}
        placeholder={t('settings.addItemPlaceholder')}
        placeholderTextColor={colors.content.subtitle}
      />

      {/* Suggested items */}
      {suggestedNotAdded.length > 0 && (
        <SuggestedItems items={suggestedNotAdded} onAdd={handleAddSuggested} />
      )}

      {/* Empty state */}
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

const CurrentItems = ({
  items,
  onRemove,
}: {
  items: string[];
  onRemove: (item: string) => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

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
        {t('settings.yourItems', { count: items.length })}
      </Text>
      <ChipGroup gap={spacing['xs-sm']}>
        {items.map((item) => (
          <Chip
            key={item}
            label={item}
            variant="filled"
            capitalize
            onPress={() => onRemove(item)}
          />
        ))}
      </ChipGroup>
    </SurfaceCard>
  );
};

const SuggestedItems = ({
  items,
  onAdd,
}: {
  items: string[];
  onAdd: (item: string) => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <SurfaceCard padding={spacing.md}>
      <Text
        style={{
          fontSize: fontSize.xs,
          fontWeight: fontWeight.semibold,
          color: colors.content.strong,
          marginBottom: spacing.sm,
        }}
      >
        {t('settings.suggestions')}
      </Text>
      <ChipGroup gap={spacing['xs-sm']}>
        {items.map((item) => (
          <Chip
            key={item}
            label={item}
            variant="outline"
            onPress={() => onAdd(item)}
          />
        ))}
      </ChipGroup>
    </SurfaceCard>
  );
};
