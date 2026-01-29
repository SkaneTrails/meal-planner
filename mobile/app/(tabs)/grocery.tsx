/**
 * Grocery screen - Shopping list from meal plan.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGroceryList } from '@/lib/hooks';
import { GroceryListView } from '@/components';

function getWeekDates(): { start: string; end: string } {
  const today = new Date();
  const currentDay = today.getDay();
  // Calculate days since Saturday (Sat=0 in our week, so Sat->0, Sun->1, Mon->2, etc.)
  const daysSinceSaturday = (currentDay + 1) % 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - daysSinceSaturday);

  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() + 6);

  return {
    start: saturday.toISOString().split('T')[0],
    end: friday.toISOString().split('T')[0],
  };
}

export default function GroceryScreen() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const { start, end } = useMemo(() => getWeekDates(), []);

  const {
    data: groceryList,
    isLoading,
  } = useGroceryList(undefined, {
    start_date: start,
    end_date: end,
  });

  // Apply local checked state to grocery list
  const groceryListWithChecked = useMemo(() => {
    if (!groceryList) return null;

    return {
      ...groceryList,
      items: groceryList.items.map((item) => ({
        ...item,
        checked: checkedItems.has(item.name),
      })),
    };
  }, [groceryList, checkedItems]);

  const handleItemToggle = (itemName: string, checked: boolean) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(itemName);
      } else {
        newSet.delete(itemName);
      }
      return newSet;
    });
  };

  const handleClearChecked = () => {
    setCheckedItems(new Set());
  };

  const totalItems = groceryList?.items.length || 0;
  const checkedCount = checkedItems.size;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header with stats */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-gray-500">This week's shopping</Text>
            <Text className="text-lg font-semibold text-gray-900">
              {totalItems === 0
                ? 'No items'
                : `${checkedCount} of ${totalItems} items`}
            </Text>
          </View>

          {checkedCount > 0 && (
            <Pressable
              onPress={handleClearChecked}
              className="flex-row items-center px-3 py-2 rounded-lg bg-gray-100"
            >
              <Ionicons name="refresh" size={16} color="#6b7280" />
              <Text className="ml-1 text-sm text-gray-600">Reset</Text>
            </Pressable>
          )}
        </View>

        {/* Progress bar */}
        {totalItems > 0 && (
          <View className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${(checkedCount / totalItems) * 100}%` }}
            />
          </View>
        )}
      </View>

      {/* Grocery list */}
      {groceryListWithChecked ? (
        <GroceryListView
          groceryList={groceryListWithChecked}
          onItemToggle={handleItemToggle}
        />
      ) : (
        <View className="flex-1 items-center justify-center p-8">
          {isLoading ? (
            <>
              <Ionicons name="hourglass-outline" size={64} color="#d1d5db" />
              <Text className="text-gray-500 text-lg mt-4">
                Loading grocery list...
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="cart-outline" size={64} color="#d1d5db" />
              <Text className="text-gray-500 text-lg mt-4 text-center">
                Plan some meals to generate your grocery list
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}
