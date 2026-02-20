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
import { fontSize, fontWeight, layout, spacing, useTheme } from '@/lib/theme';
import type { GroceryItem, GroceryList } from '@/lib/types';
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
  const { colors, fonts, borderRadius, chrome } = useTheme();
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

  const handleMoveItem = useCallback((index: number, direction: -1 | 1) => {
    setOrderedItems((prev) => {
      const next = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
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
          rightSegments={[sortSegment]}
          variant="single"
          style={{ flex: 1 }}
        >
          {reorderMode ? (
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: fontSize.base,
                  fontFamily: fonts.body,
                  color: colors.content.tertiary,
                  marginBottom: spacing['sm-md'],
                  fontStyle: 'italic',
                }}
              >
                {t('grocery.reorderHintArrows')}
              </Text>
              <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
              >
                {orderedItems.map((item, index) => (
                  <View
                    key={`${item.name}-${index}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        marginRight: spacing.xs,
                        gap: spacing['2xs'],
                        alignItems: 'center',
                      }}
                    >
                      <Pressable
                        onPress={() => handleMoveItem(index, -1)}
                        disabled={index === 0}
                        style={{
                          opacity: index === 0 ? 0.25 : 1,
                          padding: spacing['2xs'],
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: fonts.body,
                            fontSize: fontSize.xl,
                            color: colors.primary,
                          }}
                        >
                          ▲
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleMoveItem(index, 1)}
                        disabled={index === orderedItems.length - 1}
                        style={{
                          opacity: index === orderedItems.length - 1 ? 0.25 : 1,
                          padding: spacing['2xs'],
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: fonts.body,
                            fontSize: fontSize.xl,
                            color: colors.primary,
                          }}
                        >
                          ▼
                        </Text>
                      </Pressable>
                    </View>
                    <View style={{ flex: 1 }}>
                      <GroceryItemRow
                        item={{
                          ...item,
                          checked: checkedItems.has(item.name),
                        }}
                        onToggle={(checked) =>
                          handleItemToggle(item.name, checked)
                        }
                        showReorder={false}
                      />
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
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
        </TerminalFrame>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.sm }}
      >
        <Pressable
          onPress={handleToggleReorder}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            backgroundColor: reorderMode
              ? colors.glass.heavy
              : colors.glass.subtle,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing['xs-sm'],
            borderRadius: borderRadius.xs,
            gap: spacing.xs,
          }}
        >
          <Ionicons
            name={reorderMode ? 'checkmark' : 'swap-vertical'}
            size={14}
            color={colors.content.body}
          />
          <Text
            style={{
              fontSize: fontSize.base,
              fontFamily: fonts.bodySemibold,
              fontWeight: fontWeight.semibold,
              color: colors.content.body,
            }}
          >
            {reorderMode ? t('grocery.doneSorting') : t('grocery.sortItems')}
          </Text>
        </Pressable>
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
