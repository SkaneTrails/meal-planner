/**
 * Grocery list components.
 * Layout matches Streamlit app design.
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
      style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 14, 
        backgroundColor: '#fff', 
        borderRadius: 14, 
        marginBottom: 10, 
        opacity: checked ? 0.6 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View
        style={{ 
          width: 26, 
          height: 26, 
          borderRadius: 8, 
          borderWidth: 2, 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginRight: 14, 
          backgroundColor: checked ? '#4A3728' : 'transparent', 
          borderColor: checked ? '#4A3728' : '#d1d5db',
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
            color: checked ? '#9ca3af' : '#4A3728',
          }}
        >
          {quantity ? `${quantity} ${item.name}` : item.name}
        </Text>
        {item.recipe_sources.length > 0 && (
          <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>
            {item.recipe_sources.join(' · ')}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

interface GroceryListViewProps {
  groceryList: GroceryList;
  onItemToggle?: (itemName: string, checked: boolean) => void;
  filterOutItems?: (itemName: string) => boolean; // Return true to filter out/hide the item
}

export function GroceryListView({ groceryList, onItemToggle, filterOutItems }: GroceryListViewProps) {
  // Filter items if filter function provided
  const filteredItems = filterOutItems 
    ? groceryList.items.filter(item => !filterOutItems(item.name))
    : groceryList.items;

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

  for (const item of filteredItems) {
    itemsByCategory[item.category].push(item);
  }

  // Create sections for SectionList
  const sections = Object.entries(itemsByCategory)
    .filter(([_, items]) => items.length > 0)
    .map(([category, items]) => ({
      title: CATEGORY_LABELS[category as GroceryCategory],
      data: items,
    }));

  if (sections.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{ 
          width: 80, 
          height: 80, 
          borderRadius: 40, 
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
        <Text style={{ color: '#6b7280', fontSize: 15, marginTop: 8, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>
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
        <View style={{ 
          paddingVertical: 10, 
          paddingHorizontal: 4,
          marginTop: 20,
          marginBottom: 4,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#4A3728', letterSpacing: -0.2 }}>{section.title}</Text>
        </View>
      )}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      stickySectionHeadersEnabled={false}
    />
  );
}
