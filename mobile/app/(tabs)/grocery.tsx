/**
 * Grocery screen - Shopping list from meal plan.
 * Layout matches Streamlit app design.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGroceryList } from '@/lib/hooks';
import { GroceryListView, GradientBackground, BouncingLoader } from '@/components';

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekDates(): { start: string; end: string } {
  const today = new Date();
  const currentDay = today.getDay();
  // Calculate days since Saturday
  const daysSinceSaturday = (currentDay + 1) % 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - daysSinceSaturday);

  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() + 6);

  return {
    start: formatDateLocal(saturday),
    end: formatDateLocal(friday),
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
    <GradientBackground>
      <View style={{ flex: 1 }}>
      {/* Header with title */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="cart-outline" size={22} color="#4A3728" />
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#4A3728', marginLeft: 8 }}>Grocery List</Text>
        </View>
      </View>

      {/* Stats and controls */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 13, color: '#6b7280' }}>This week's shopping</Text>
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#4A3728' }}>
              {totalItems === 0
                ? 'No items'
                : `${checkedCount} of ${totalItems} items`}
            </Text>
          </View>

          {checkedCount > 0 && (
            <Pressable
              onPress={handleClearChecked}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#fff' }}
            >
              <Ionicons name="refresh" size={16} color="#4A3728" />
              <Text style={{ marginLeft: 4, fontSize: 13, fontWeight: '600', color: '#4A3728' }}>Reset</Text>
            </Pressable>
          )}
        </View>

        {/* Progress bar */}
        {totalItems > 0 && (
          <View style={{ marginTop: 12, height: 8, backgroundColor: '#e5e7eb', borderRadius: 9999, overflow: 'hidden' }}>
            <View
              style={{ height: '100%', backgroundColor: '#4A3728', borderRadius: 9999, width: `${(checkedCount / totalItems) * 100}%` }}
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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          {isLoading ? (
            <>
              <BouncingLoader size={14} />
              <Text style={{ color: '#6b7280', fontSize: 17, marginTop: 16 }}>
                Loading grocery list...
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="cart-outline" size={56} color="#4A3728" />
              <Text style={{ color: '#6b7280', fontSize: 17, marginTop: 16, textAlign: 'center', lineHeight: 24 }}>
                Plan some meals to generate your grocery list
              </Text>
            </>
          )}
        </View>
      )}
      </View>
    </GradientBackground>
  );
}
