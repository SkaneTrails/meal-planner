/**
 * Individual grocery item row with checkbox, quantity display, and drag handle.
 */

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, Text, View, type ViewStyle } from 'react-native';
import { hapticSelection } from '@/lib/haptics';
import { colors } from '@/lib/theme';
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
        backgroundColor: isActive ? colors.white : colors.glass.solid,
        borderRadius: 10,
        marginBottom: 8,
        opacity: checked ? 0.85 : 1,
        boxShadow: '1px 2px 6px 0px rgba(0, 0, 0, 0.06)',
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
            color={colors.content.subtitle}
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
            backgroundColor: checked ? colors.ai.primary : 'transparent',
            borderColor: checked ? colors.ai.primary : colors.surface.border,
          }}
        >
          {checked && (
            <Ionicons name="checkmark" size={14} color={colors.white} />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '500',
              textDecorationLine: checked ? 'line-through' : 'none',
              color: checked ? colors.content.subtitle : colors.content.body,
            }}
          >
            {quantity ? `${quantity} ${item.name}` : item.name}
          </Text>
          {item.recipe_sources.length > 0 && (
            <Text
              style={{
                fontSize: 12,
                color: colors.content.tertiary,
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
