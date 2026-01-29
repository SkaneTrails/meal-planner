/**
 * Grocery list components.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, SectionList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { GroceryItem, GroceryCategory, GroceryList } from '@/lib/types';

interface GroceryItemRowProps {
  item: GroceryItem;
  onToggle?: (checked: boolean) => void;
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

const CATEGORY_COLORS: Record<GroceryCategory, string> = {
  produce: 'bg-green-50 border-green-200',
  meat_seafood: 'bg-red-50 border-red-200',
  dairy: 'bg-yellow-50 border-yellow-200',
  bakery: 'bg-orange-50 border-orange-200',
  pantry: 'bg-amber-50 border-amber-200',
  frozen: 'bg-blue-50 border-blue-200',
  beverages: 'bg-purple-50 border-purple-200',
  other: 'bg-gray-50 border-gray-200',
};

function formatQuantity(item: GroceryItem): string {
  if (item.quantity_sources.length > 0) {
    // Group by unit
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

export function GroceryItemRow({ item, onToggle }: GroceryItemRowProps) {
  const [checked, setChecked] = useState(item.checked);
  const quantity = formatQuantity(item);

  const handleToggle = () => {
    const newValue = !checked;
    setChecked(newValue);
    onToggle?.(newValue);
  };

  return (
    <Pressable
      onPress={handleToggle}
      className={`
        flex-row items-center p-3 bg-white rounded-lg border border-gray-200 mb-2
        ${checked ? 'opacity-50' : ''}
      `}
    >
      <View
        className={`
          w-6 h-6 rounded-full border-2 items-center justify-center mr-3
          ${checked ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}
        `}
      >
        {checked && <Ionicons name="checkmark" size={16} color="white" />}
      </View>

      <View className="flex-1">
        <Text
          className={`text-base ${
            checked ? 'line-through text-gray-400' : 'text-gray-900'
          }`}
        >
          {quantity ? `${quantity} ${item.name}` : item.name}
        </Text>
        {item.recipe_sources.length > 0 && (
          <Text className="text-xs text-gray-500 mt-0.5">
            From: {item.recipe_sources.join(', ')}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

interface GroceryListViewProps {
  groceryList: GroceryList;
  onItemToggle?: (itemName: string, checked: boolean) => void;
}

export function GroceryListView({ groceryList, onItemToggle }: GroceryListViewProps) {
  // Group items by category
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

  for (const item of groceryList.items) {
    itemsByCategory[item.category].push(item);
  }

  // Create sections for SectionList
  const sections = Object.entries(itemsByCategory)
    .filter(([_, items]) => items.length > 0)
    .map(([category, items]) => ({
      title: CATEGORY_LABELS[category as GroceryCategory],
      color: CATEGORY_COLORS[category as GroceryCategory],
      data: items,
    }));

  if (sections.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Ionicons name="cart-outline" size={64} color="#d1d5db" />
        <Text className="text-gray-500 text-lg mt-4 text-center">
          No items in your grocery list
        </Text>
        <Text className="text-gray-400 text-sm mt-2 text-center">
          Add meals to your plan to generate a shopping list
        </Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.name}
      renderItem={({ item }) => (
        <GroceryItemRow
          item={item}
          onToggle={(checked) => onItemToggle?.(item.name, checked)}
        />
      )}
      renderSectionHeader={({ section }) => (
        <View className={`p-2 rounded-lg mb-2 mt-4 border ${section.color}`}>
          <Text className="font-semibold text-gray-800">{section.title}</Text>
        </View>
      )}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      stickySectionHeadersEnabled={false}
    />
  );
}
