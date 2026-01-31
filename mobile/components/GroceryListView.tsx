/**
 * Grocery list components.
 * Layout matches Streamlit app design.
 * Supports drag-and-drop reordering within categories.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { GroceryItem, GroceryCategory, GroceryList } from '@/lib/types';

interface GroceryItemRowProps {
  item: GroceryItem;
  onToggle?: (checked: boolean) => void;
  drag?: () => void;
  isActive?: boolean;
  showReorder?: boolean;
}

const CATEGORY_LABELS: Record<GroceryCategory, string> = {
  produce: '🥬 Produce',
  meat_seafood: '🥩 Meat & Seafood',
  dairy: '🧀 Dairy',
  bakery: '🍞 Bakery',
  pantry: '🥫 Pantry',
  frozen: '🧊 Frozen',
  beverages: '🥤 Beverages',
  other: '📦 Other',
};

function formatQuantity(item: GroceryItem): string {
  if (item.quantity_sources.length > 0) {
    const byUnit: Record<string, number[]> = {};
    for (const qs of item.quantity_sources) {
      if (qs.quantity !== null) {
        const key = qs.unit || '';
        if (!byUnit[key]) byUnit[key] = [];
        byUnit[key].push(qs.quantity);
      }
    }

    const parts: string[] = [];
    for (const [unit, quantities] of Object.entries(byUnit)) {
      const sum = quantities.reduce((a, b) => a + b, 0);
      const qtyStr = Number.isInteger(sum) ? sum.toString() : sum.toFixed(1);
      parts.push(unit ? `${qtyStr} ${unit}` : qtyStr);
    }

    if (parts.length > 0) {
      return parts.join(', ');
    }
  }

  if (item.quantity && item.unit) {
    return `${item.quantity} ${item.unit}`;
  }
  if (item.quantity) {
    return item.quantity;
  }
  return '';
}

export function GroceryItemRow({ item, onToggle, drag, isActive, showReorder }: GroceryItemRowProps) {
  const [checked, setChecked] = useState(item.checked);
  const quantity = formatQuantity(item);

  const handleToggle = () => {
    const newValue = !checked;
    setChecked(newValue);
    onToggle?.(newValue);
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: isActive ? '#F5E6D3' : '#fff',
        borderRadius: 12,
        marginBottom: 8,
        opacity: checked ? 0.6 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: isActive ? 4 : 1 },
        shadowOpacity: isActive ? 0.15 : 0.04,
        shadowRadius: isActive ? 8 : 4,
        elevation: isActive ? 8 : 1,
      }}
    >
      {/* Drag handle - on web use onPressIn, on mobile use onLongPress */}
      {showReorder && (
        <Pressable
          onLongPress={Platform.OS !== 'web' ? drag : undefined}
          onPressIn={Platform.OS === 'web' ? drag : undefined}
          delayLongPress={100}
          style={({ pressed }) => ({
            padding: 8,
            marginRight: 4,
            opacity: pressed ? 0.6 : 1,
            cursor: Platform.OS === 'web' ? 'grab' : undefined,
          } as any)}
        >
          <Ionicons name="reorder-three" size={24} color="#9CA3AF" />
        </Pressable>
      )}

      <Pressable
        onPress={handleToggle}
        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            borderWidth: 2,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
            backgroundColor: checked ? '#4A3728' : 'transparent',
            borderColor: checked ? '#4A3728' : '#D1D5DB',
          }}
        >
          {checked && <Ionicons name="checkmark" size={16} color="white" />}
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '500',
              textDecorationLine: checked ? 'line-through' : 'none',
              color: checked ? '#9CA3AF' : '#4A3728',
            }}
          >
            {quantity ? `${quantity} ${item.name}` : item.name}
          </Text>
          {item.recipe_sources.length > 0 && (
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>
              {item.recipe_sources.join(' · ')}
            </Text>
          )}
        </View>
      </Pressable>
    </View>
  );
}

interface GroceryListViewProps {
  groceryList: GroceryList;
  onItemToggle?: (itemName: string, checked: boolean) => void;
  filterOutItems?: (itemName: string) => boolean; // Return true to filter out/hide the item
  onReorder?: (items: GroceryItem[]) => void; // Callback when items are reordered
}

export function GroceryListView({ groceryList, onItemToggle, filterOutItems, onReorder }: GroceryListViewProps) {
  const [reorderMode, setReorderMode] = useState(false);
  const [orderedItems, setOrderedItems] = useState<GroceryItem[]>([]);
  // Track checked state locally to enable moving items to bottom
  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    () => new Set(groceryList.items.filter(i => i.checked).map(i => i.name))
  );

  // Filter items if filter function provided
  const filteredItems = filterOutItems
    ? groceryList.items.filter(item => !filterOutItems(item.name))
    : groceryList.items;

  // Sort items: unchecked first, checked at bottom
  const sortByChecked = useCallback((items: GroceryItem[]) => {
    return [...items].sort((a, b) => {
      const aChecked = checkedItems.has(a.name);
      const bChecked = checkedItems.has(b.name);
      if (aChecked === bChecked) return 0;
      return aChecked ? 1 : -1;
    });
  }, [checkedItems]);

  // Use ordered items if in reorder mode, otherwise use filtered items (sorted by checked)
  const displayItems = reorderMode && orderedItems.length > 0
    ? orderedItems
    : sortByChecked(filteredItems);

  // Handle item toggle - move checked items to bottom
  const handleItemToggle = useCallback((itemName: string, checked: boolean) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(itemName);
      } else {
        next.delete(itemName);
      }
      return next;
    });
    onItemToggle?.(itemName, checked);
  }, [onItemToggle]);

  // Initialize ordered items when entering reorder mode
  const handleToggleReorder = useCallback(() => {
    if (!reorderMode) {
      // Initialize with current sorted order (checked items at bottom)
      setOrderedItems(sortByChecked(filteredItems));
    } else {
      // Save the order when exiting reorder mode
      if (onReorder && orderedItems.length > 0) {
        onReorder(orderedItems);
      }
    }
    setReorderMode(!reorderMode);
  }, [reorderMode, filteredItems, orderedItems, onReorder, sortByChecked]);

  // Handle drag end - update order
  const handleDragEnd = useCallback(({ data }: { data: GroceryItem[] }) => {
    setOrderedItems(data);
  }, []);

  // Render item for draggable list
  const renderDraggableItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<GroceryItem>) => (
      <ScaleDecorator>
        <GroceryItemRow
          item={{...item, checked: checkedItems.has(item.name)}}
          onToggle={(checked) => handleItemToggle(item.name, checked)}
          drag={drag}
          isActive={isActive}
          showReorder={true}
        />
      </ScaleDecorator>
    ),
    [handleItemToggle, checkedItems]
  );

  // Group items by category (only when not in reorder mode)
  const itemsByCategory: Record<GroceryCategory, GroceryItem[]> = {
    produce: [],
    meat_seafood: [],
    dairy: [],
    bakery: [],
    pantry: [],
    frozen: [],
    beverages: [],
    other: [],
  };

  if (!reorderMode) {
    for (const item of displayItems) {
      itemsByCategory[item.category].push(item);
    }
  }

  // Create sections for sectioned view - sort checked items to bottom within each category
  const sections = Object.entries(itemsByCategory)
    .filter(([_, items]) => items.length > 0)
    .map(([category, items]) => ({
      title: CATEGORY_LABELS[category as GroceryCategory],
      data: [...items].sort((a, b) => {
        const aChecked = checkedItems.has(a.name);
        const bChecked = checkedItems.has(b.name);
        if (aChecked === bChecked) return 0;
        return aChecked ? 1 : -1;
      }),
    }));

  if (displayItems.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          backgroundColor: '#E8D5C4',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Ionicons name="cart-outline" size={40} color="#4A3728" />
        </View>
        <Text style={{ color: '#4A3728', fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
          No items yet
        </Text>
        <Text style={{ color: '#6B7280', fontSize: 15, marginTop: 8, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>
          Add meals to your plan to generate a shopping list
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Reorder toggle button */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <Pressable
          onPress={handleToggleReorder}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            backgroundColor: reorderMode ? '#4A3728' : '#F5E6D3',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 10,
            gap: 6,
          }}
        >
          <Ionicons
            name={reorderMode ? 'checkmark' : 'swap-vertical'}
            size={16}
            color={reorderMode ? '#fff' : '#4A3728'}
          />
          <Text style={{
            fontSize: 13,
            fontWeight: '600',
            color: reorderMode ? '#fff' : '#4A3728'
          }}>
            {reorderMode ? 'Done sorting' : 'Sort items'}
          </Text>
        </Pressable>
      </View>

      {reorderMode ? (
        // Draggable list for reorder mode
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <Text style={{
            fontSize: 13,
            color: '#6B7280',
            marginBottom: 12,
            fontStyle: 'italic',
          }}>
            {Platform.OS === 'web'
              ? 'Click and drag ☰ to reorder items'
              : 'Hold and drag ☰ to reorder items'}
          </Text>
          <DraggableFlatList
            data={orderedItems}
            onDragEnd={handleDragEnd}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            renderItem={renderDraggableItem}
            containerStyle={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        </View>
      ) : (
        // Sectioned list for normal mode
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        >
          {sections.map((section) => (
            <View key={section.title}>
              <View style={{
                paddingVertical: 10,
                paddingHorizontal: 4,
                marginTop: 20,
                marginBottom: 4,
              }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#4A3728', letterSpacing: -0.2 }}>
                  {section.title}
                </Text>
              </View>
              {section.data.map((item) => (
                <GroceryItemRow
                  key={item.name}
                  item={{...item, checked: checkedItems.has(item.name)}}
                  onToggle={(checked) => handleItemToggle(item.name, checked)}
                  showReorder={false}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </GestureHandlerRootView>
  );
}
