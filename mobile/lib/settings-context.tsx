/**
 * Settings context for app-wide settings including "items at home" list.
 * Uses AsyncStorage for persistence.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@meal_planner_settings';

interface Settings {
  itemsAtHome: string[]; // List of ingredients always at home (won't appear in grocery list)
}

interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  addItemAtHome: (item: string) => Promise<void>;
  removeItemAtHome: (item: string) => Promise<void>;
  isItemAtHome: (item: string) => boolean;
}

const defaultSettings: Settings = {
  itemsAtHome: [],
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings({ ...defaultSettings, ...parsed });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Save settings to AsyncStorage
  const saveSettings = useCallback(async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }, []);

  const addItemAtHome = useCallback(async (item: string) => {
    const normalizedItem = item.toLowerCase().trim();
    if (!normalizedItem) return;
    
    const newSettings = {
      ...settings,
      itemsAtHome: [...new Set([...settings.itemsAtHome, normalizedItem])].sort(),
    };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const removeItemAtHome = useCallback(async (item: string) => {
    const normalizedItem = item.toLowerCase().trim();
    const newSettings = {
      ...settings,
      itemsAtHome: settings.itemsAtHome.filter(i => i !== normalizedItem),
    };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const isItemAtHome = useCallback((item: string) => {
    const normalizedItem = item.toLowerCase().trim();
    // Check if the item or any word in it matches items at home
    return settings.itemsAtHome.some(homeItem => 
      normalizedItem.includes(homeItem) || homeItem.includes(normalizedItem)
    );
  }, [settings.itemsAtHome]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        addItemAtHome,
        removeItemAtHome,
        isItemAtHome,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
