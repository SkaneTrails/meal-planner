/**
 * Settings screen for app configuration.
 * Includes "Items at Home" list management.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '@/lib/settings-context';
import { GradientBackground } from '@/components';

// Common items that people often have at home
const SUGGESTED_ITEMS = [
  'salt',
  'pepper',
  'olive oil',
  'vegetable oil',
  'butter',
  'sugar',
  'flour',
  'garlic',
  'onion',
  'soy sauce',
  'vinegar',
  'honey',
  'rice',
  'pasta',
  'eggs',
];

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, addItemAtHome, removeItemAtHome, isLoading } = useSettings();
  const [newItem, setNewItem] = useState('');

  const handleAddItem = async () => {
    const item = newItem.trim();
    if (!item) return;
    
    try {
      await addItemAtHome(item);
      setNewItem('');
    } catch {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleRemoveItem = async (item: string) => {
    try {
      await removeItemAtHome(item);
    } catch {
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  const handleAddSuggested = async (item: string) => {
    if (settings.itemsAtHome.includes(item.toLowerCase())) {
      return; // Already added
    }
    try {
      await addItemAtHome(item);
    } catch {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const suggestedNotAdded = SUGGESTED_ITEMS.filter(
    item => !settings.itemsAtHome.includes(item.toLowerCase())
  );

  return (
    <GradientBackground>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerStyle: { backgroundColor: '#4A3728' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
          ),
        }}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Items at Home Section */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#E8D5C4',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <Ionicons name="home" size={20} color="#4A3728" />
              </View>
              <View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#4A3728' }}>
                  Items at Home
                </Text>
                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>
                  These won't appear in your grocery list
                </Text>
              </View>
            </View>

            {/* Add new item input */}
            <View style={{
              flexDirection: 'row',
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 4,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <TextInput
                style={{
                  flex: 1,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: '#4A3728',
                }}
                placeholder="Add an item (e.g., salt, olive oil)"
                placeholderTextColor="#9CA3AF"
                value={newItem}
                onChangeText={setNewItem}
                onSubmitEditing={handleAddItem}
                returnKeyType="done"
              />
              <Pressable
                onPress={handleAddItem}
                disabled={!newItem.trim()}
                style={({ pressed }) => ({
                  backgroundColor: newItem.trim() ? '#4A3728' : '#E5E7EB',
                  borderRadius: 12,
                  padding: 12,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Ionicons 
                  name="add" 
                  size={24} 
                  color={newItem.trim() ? '#fff' : '#9CA3AF'} 
                />
              </Pressable>
            </View>

            {/* Current items */}
            {settings.itemsAtHome.length > 0 ? (
              <View style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
                  Your items ({settings.itemsAtHome.length})
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {settings.itemsAtHome.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => handleRemoveItem(item)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: pressed ? '#FEE2E2' : '#F5E6D3',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        gap: 6,
                      })}
                    >
                      <Text style={{ fontSize: 14, color: '#4A3728', textTransform: 'capitalize' }}>
                        {item}
                      </Text>
                      <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              <View style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 24,
                alignItems: 'center',
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                <View style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: '#F5E6D3',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}>
                  <Ionicons name="basket-outline" size={28} color="#4A3728" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#4A3728', marginBottom: 4 }}>
                  No items yet
                </Text>
                <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
                  Add items you always have at home to exclude them from your grocery list
                </Text>
              </View>
            )}

            {/* Suggested items */}
            {suggestedNotAdded.length > 0 && (
              <View style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
                  Suggestions
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {suggestedNotAdded.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => handleAddSuggested(item)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: pressed ? '#DCFCE7' : '#F9FAFB',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        borderStyle: 'dashed',
                        gap: 6,
                      })}
                    >
                      <Ionicons name="add" size={16} color="#6B7280" />
                      <Text style={{ fontSize: 14, color: '#6B7280', textTransform: 'capitalize' }}>
                        {item}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
