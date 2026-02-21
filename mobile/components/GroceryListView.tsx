/**
 * Grocery list with checked sorting and drag-and-drop reordering.
 * Drag reordering is only available on touch devices.
 */

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import DraggableFlatList, {
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useIsTouchDevice } from '@/lib/hooks/useIsTouchDevice';
import { useTranslation } from '@/lib/i18n';
import { fontSize, layout, spacing, useTheme } from '@/lib/theme';
import type { GroceryItem, GroceryList } from '@/lib/types';
import { Button } from './Button';
import { GroceryItemRow } from './GroceryItemRow';
import { EmptyGroceryState } from './grocery/EmptyGroceryState';
import { TerminalFrame } from './TerminalFrame';

interface GroceryListViewProps {
  groceryList: GroceryList;
  onItemToggle?: (itemName: string, checked: boolean) => void;
  filterOutItems?: (itemName: string) => boolean;
  onReorder?: (items: GroceryItem[]) => void;
}

export const GroceryListView = ({
  groceryList,
  onItemToggle,
  filterOutItems,
  onReorder,
}: GroceryListViewProps) => {
  const { colors, fonts, chrome } = useTheme();
  const { t } = useTranslation();
  const [reorderMode, setReorderMode] = useState(false);
  const [orderedItems, setOrderedItems] = useState<GroceryItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    () =>
      new Set(groceryList.items.filter((i) => i.checked).map((i) => i.name)),
  );

  // Sync local checked state when the parent's grocery list changes
  // (e.g., generated items arrive after recipes load, or Firestore refreshes)
  useEffect(() => {
    setCheckedItems(
      new Set(groceryList.items.filter((i) => i.checked).map((i) => i.name)),
    );
  }, [groceryList.items]);

  const filteredItems = filterOutItems
    ? groceryList.items.filter((item) => !filterOutItems(item.name))
    : groceryList.items;

  const sortByChecked = useCallback(
    (items: GroceryItem[]) =>
      [...items].sort((a, b) => {
        const aChecked = checkedItems.has(a.name);
        const bChecked = checkedItems.has(b.name);
        if (aChecked === bChecked) return 0;
        return aChecked ? 1 : -1;
      }),
    [checkedItems],
  );

  const displayItems =
    reorderMode && orderedItems.length > 0
      ? orderedItems
      : sortByChecked(filteredItems);

  const handleItemToggle = useCallback(
    (itemName: string, checked: boolean) => {
      setCheckedItems((prev) => {
        const next = new Set(prev);
        if (checked) {
          next.add(itemName);
        } else {
          next.delete(itemName);
        }
        return next;
      });
      onItemToggle?.(itemName, checked);
    },
    [onItemToggle],
  );

  const handleToggleReorder = useCallback(() => {
    if (!reorderMode) {
      setOrderedItems(sortByChecked(filteredItems));
    } else if (onReorder && orderedItems.length > 0) {
      onReorder(orderedItems);
    }
    setReorderMode(!reorderMode);
  }, [reorderMode, filteredItems, orderedItems, onReorder, sortByChecked]);

  const handleDragEnd = useCallback(({ data }: { data: GroceryItem[] }) => {
    setOrderedItems(data);
  }, []);

  const renderDraggableItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<GroceryItem>) => (
      <GroceryItemRow
        item={{ ...item, checked: checkedItems.has(item.name) }}
        onToggle={(checked) => handleItemToggle(item.name, checked)}
        drag={drag}
        isActive={isActive}
        showReorder={true}
      />
    ),
    [handleItemToggle, checkedItems],
  );

  const isTouchDevice = useIsTouchDevice();

  if (displayItems.length === 0) {
    return (
      <EmptyGroceryState
        title={t('grocery.noItemsYet')}
        subtitle={t('grocery.emptyFromMealPlan')}
      />
    );
  }

  const sortLabel = reorderMode
    ? t('grocery.doneSorting')
    : t('grocery.sortItems');
  const sortSegment = {
    label: sortLabel.toUpperCase(),
    onPress: handleToggleReorder,
  };

  if (chrome === 'flat') {
    return (
      <View
        style={{
          paddingHorizontal: spacing.xl,
          flex: 1,
          paddingBottom: layout.tabBar.contentBottomPadding,
        }}
      >
        <TerminalFrame
          label={(displayItems.length === 1
            ? t('grocery.itemCountOne')
            : t('grocery.itemCount', { count: displayItems.length })
          ).toUpperCase()}
          rightSegments={isTouchDevice ? [sortSegment] : []}
          variant="single"
          style={{ flex: 1 }}
        >
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {displayItems.map((item) => (
              <GroceryItemRow
                key={item.name}
                item={{ ...item, checked: checkedItems.has(item.name) }}
                onToggle={(checked) => handleItemToggle(item.name, checked)}
                showReorder={false}
              />
            ))}
          </ScrollView>
        </TerminalFrame>
      </View>
    );
  }

  if (!isTouchDevice) {
    return (
      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: layout.tabBar.contentBottomPadding,
          }}
          showsVerticalScrollIndicator={false}
        >
          {displayItems.map((item) => (
            <GroceryItemRow
              key={item.name}
              item={{ ...item, checked: checkedItems.has(item.name) }}
              onToggle={(checked) => handleItemToggle(item.name, checked)}
              showReorder={false}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.sm }}
      >
        <Button
          variant="text"
          tone="alt"
          icon={reorderMode ? 'checkmark' : 'swap-vertical'}
          label={
            reorderMode ? t('grocery.doneSorting') : t('grocery.sortItems')
          }
          onPress={handleToggleReorder}
          color={reorderMode ? colors.glass.heavy : undefined}
        />
      </View>

      {reorderMode ? (
        <View style={{ flex: 1, paddingHorizontal: spacing.xl }}>
          <Text
            style={{
              fontSize: fontSize.base,
              fontFamily: fonts.body,
              color: colors.content.tertiary,
              marginBottom: spacing['sm-md'],
              fontStyle: 'italic',
            }}
          >
            {t('grocery.reorderHintMobile')}
          </Text>
          <DraggableFlatList
            data={orderedItems}
            onDragEnd={handleDragEnd}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            renderItem={renderDraggableItem}
            containerStyle={{ flex: 1 }}
            contentContainerStyle={{
              paddingBottom: layout.tabBar.contentBottomPadding,
            }}
          />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: layout.tabBar.contentBottomPadding,
          }}
          showsVerticalScrollIndicator={false}
        >
          {displayItems.map((item) => (
            <GroceryItemRow
              key={item.name}
              item={{ ...item, checked: checkedItems.has(item.name) }}
              onToggle={(checked) => handleItemToggle(item.name, checked)}
              showReorder={false}
            />
          ))}
        </ScrollView>
      )}
    </GestureHandlerRootView>
  );
};
