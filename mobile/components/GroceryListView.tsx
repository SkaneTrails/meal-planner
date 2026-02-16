/**
 * Grocery list with checked sorting and drag-and-drop reordering.
 */

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from '@/lib/i18n';
import { colors, fontWeight, layout } from '@/lib/theme';
import type { GroceryItem, GroceryList } from '@/lib/types';
import { GroceryItemRow } from './GroceryItemRow';

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
  const { t } = useTranslation();
  const [reorderMode, setReorderMode] = useState(false);
  const [orderedItems, setOrderedItems] = useState<GroceryItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    () =>
      new Set(groceryList.items.filter((i) => i.checked).map((i) => i.name)),
  );

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
      <ScaleDecorator>
        <GroceryItemRow
          item={{ ...item, checked: checkedItems.has(item.name) }}
          onToggle={(checked) => handleItemToggle(item.name, checked)}
          drag={drag}
          isActive={isActive}
          showReorder={true}
        />
      </ScaleDecorator>
    ),
    [handleItemToggle, checkedItems],
  );

  if (displayItems.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <Ionicons name="cart-outline" size={40} color={colors.content.body} />
        </View>
        <Text
          style={{
            color: colors.content.body,
            fontSize: 18,
            fontWeight: fontWeight.semibold,
            textAlign: 'center',
          }}
        >
          {t('grocery.noItemsYet')}
        </Text>
        <Text
          style={{
            color: colors.content.tertiary,
            fontSize: 15,
            marginTop: 8,
            textAlign: 'center',
            lineHeight: 22,
            maxWidth: 280,
          }}
        >
          {t('grocery.emptyFromMealPlan')}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <Pressable
          onPress={handleToggleReorder}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            backgroundColor: reorderMode
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(255, 255, 255, 0.6)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            gap: 4,
          }}
        >
          <Ionicons
            name={reorderMode ? 'checkmark' : 'swap-vertical'}
            size={14}
            color={colors.content.body}
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: fontWeight.semibold,
              color: colors.content.body,
            }}
          >
            {reorderMode ? t('grocery.doneSorting') : t('grocery.sortItems')}
          </Text>
        </Pressable>
      </View>

      {reorderMode ? (
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <Text
            style={{
              fontSize: 12,
              color: colors.content.tertiary,
              marginBottom: 10,
              fontStyle: 'italic',
            }}
          >
            {Platform.OS === 'web'
              ? t('grocery.reorderHintWeb')
              : t('grocery.reorderHintMobile')}
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
            paddingHorizontal: 20,
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
