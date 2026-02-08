/**
 * Individual grocery item row with checkbox, quantity display, and drag handle.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticSelection } from '@/lib/haptics';
import type { GroceryItem } from '@/lib/types';

interface GroceryItemRowProps {
  item: GroceryItem;
  onToggle?: (checked: boolean) => void;
  drag?: () => void;
  isActive?: boolean;
  showReorder?: boolean;
}

const formatQuantity = (item: GroceryItem): string => {
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
};

export const GroceryItemRow = ({ item, onToggle, drag, isActive, showReorder }: GroceryItemRowProps) => {
  const [checked, setChecked] = useState(item.checked);
  const quantity = formatQuantity(item);

  const handleToggle = () => {
    hapticSelection();
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
        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.55)',
        borderRadius: 12,
        marginBottom: 8,
        opacity: checked ? 0.7 : 1,
      }}
    >
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
          <Ionicons name="reorder-three" size={24} color="rgba(93, 78, 64, 0.6)" />
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
            backgroundColor: checked ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
            borderColor: checked ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
          }}
        >
          {checked && <Ionicons name="checkmark" size={16} color="#5D4E40" />}
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '500',
              textDecorationLine: checked ? 'line-through' : 'none',
              color: checked ? 'rgba(93, 78, 64, 0.6)' : '#5D4E40',
            }}
          >
            {quantity ? `${quantity} ${item.name}` : item.name}
          </Text>
          {item.recipe_sources.length > 0 && (
            <Text style={{ fontSize: 12, color: 'rgba(93, 78, 64, 0.7)', marginTop: 3 }}>
              {item.recipe_sources.join(' · ')}
            </Text>
          )}
        </View>
      </Pressable>
    </View>
  );
};
