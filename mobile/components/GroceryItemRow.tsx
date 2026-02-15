/**
 * Individual grocery item row with checkbox, quantity display, and drag handle.
 */

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, Text, View, type ViewStyle } from 'react-native';
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

export const GroceryItemRow = ({
  item,
  onToggle,
  drag,
  isActive,
  showReorder,
}: GroceryItemRowProps) => {
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
        padding: 10,
        paddingVertical: 12,
        backgroundColor: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.92)',
        borderRadius: 10,
        marginBottom: 8,
        opacity: checked ? 0.85 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {showReorder && (
        <Pressable
          onLongPress={drag}
          delayLongPress={50}
          style={({ pressed }) =>
            ({
              padding: 14,
              marginRight: 2,
              opacity: pressed ? 0.5 : 1,
              ...(Platform.OS === 'web' && { cursor: 'grab' }),
            }) as ViewStyle
          }
        >
          <Ionicons
            name="reorder-three"
            size={24}
            color="rgba(93, 78, 64, 0.6)"
          />
        </Pressable>
      )}

      <Pressable
        onPress={handleToggle}
        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            borderWidth: 2,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            backgroundColor: checked ? '#6B8E6B' : 'transparent',
            borderColor: checked ? '#6B8E6B' : 'rgba(93, 78, 64, 0.3)',
          }}
        >
          {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
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
            <Text
              style={{
                fontSize: 12,
                color: 'rgba(93, 78, 64, 0.7)',
                marginTop: 3,
              }}
            >
              {item.recipe_sources.join(' · ')}
            </Text>
          )}
        </View>
      </Pressable>
    </View>
  );
};
