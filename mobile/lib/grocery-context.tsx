/**
 * Global grocery state context.
 * Manages checked items in AsyncStorage, shareable across screens.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GroceryState {
  checkedItems: Set<string>;
  customItems: string[];
  selectedMealKeys: string[];
  isLoading: boolean;
}

interface GroceryContextValue extends GroceryState {
  toggleItem: (itemName: string) => void;
  setCheckedItems: (items: Set<string>) => void;
  clearChecked: () => void;
  refreshFromStorage: () => Promise<void>;
}

const GroceryContext = createContext<GroceryContextValue | null>(null);

export function GroceryProvider({ children }: { children: ReactNode }) {
  const [checkedItems, setCheckedItemsState] = useState<Set<string>>(new Set());
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [selectedMealKeys, setSelectedMealKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFromStorage = async () => {
    try {
      const [checkedData, customData, mealsData] = await Promise.all([
        AsyncStorage.getItem('grocery_checked_items'),
        AsyncStorage.getItem('grocery_custom_items'),
        AsyncStorage.getItem('grocery_selected_meals'),
      ]);

      if (checkedData) {
        setCheckedItemsState(new Set(JSON.parse(checkedData)));
      }
      if (customData) {
        const items = JSON.parse(customData);
        // Handle both old format (strings) and new format (GroceryItem objects)
        const names = items.map((i: string | { name: string }) => 
          typeof i === 'string' ? i : i.name
        );
        setCustomItems(names);
      }
      if (mealsData) {
        setSelectedMealKeys(JSON.parse(mealsData));
      }
    } catch (error) {
      console.error('[GroceryContext] Error loading from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFromStorage();
  }, []);

  const setCheckedItems = (items: Set<string>) => {
    setCheckedItemsState(items);
    AsyncStorage.setItem('grocery_checked_items', JSON.stringify(Array.from(items)))
      .catch(error => console.error('[GroceryContext] Error saving checked items:', error));
  };

  const toggleItem = (itemName: string) => {
    setCheckedItemsState(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemName)) {
        newSet.delete(itemName);
      } else {
        newSet.add(itemName);
      }
      AsyncStorage.setItem('grocery_checked_items', JSON.stringify(Array.from(newSet)))
        .catch(error => console.error('[GroceryContext] Error saving checked items:', error));
      return newSet;
    });
  };

  const clearChecked = () => {
    setCheckedItemsState(new Set());
    AsyncStorage.setItem('grocery_checked_items', JSON.stringify([]))
      .catch(error => console.error('[GroceryContext] Error clearing checked items:', error));
  };

  const refreshFromStorage = async () => {
    setIsLoading(true);
    await loadFromStorage();
  };

  return (
    <GroceryContext.Provider value={{
      checkedItems,
      customItems,
      selectedMealKeys,
      isLoading,
      toggleItem,
      setCheckedItems,
      clearChecked,
      refreshFromStorage,
    }}>
      {children}
    </GroceryContext.Provider>
  );
}

export function useGroceryState() {
  const context = useContext(GroceryContext);
  if (!context) {
    throw new Error('useGroceryState must be used within a GroceryProvider');
  }
  return context;
}
