/**
 * Settings screen for app configuration.
 * Organized into sections: Language, Grocery List, etc.
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
import { shadows, borderRadius, colors, spacing } from '@/lib/theme';
import { useSettings, LANGUAGES, type AppLanguage } from '@/lib/settings-context';
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

// Section header component
function SectionHeader({
  icon,
  iconColor = '#4A3728',
  iconBg = '#E8D5C4',
  title,
  subtitle
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: iconBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      }}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#4A3728' }}>
          {title}
        </Text>
        <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, addItemAtHome, removeItemAtHome, setLanguage } = useSettings();
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

  const handleLanguageChange = async (language: AppLanguage) => {
    try {
      await setLanguage(language);
    } catch {
      Alert.alert('Error', 'Failed to change language');
    }
  };

  return (
    <GradientBackground>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerStyle: { backgroundColor: '#4A3728' },
          headerTintColor: '#fff',
          headerBackTitle: 'Home',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 8, marginLeft: -4 }}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
              <Text style={{ color: '#fff', fontSize: 17, marginLeft: 2 }}>Home</Text>
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
          {/* Close button */}
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              backgroundColor: pressed ? colors.bgDark : colors.white,
              paddingHorizontal: spacing.lg,
              paddingVertical: 10,
              borderRadius: borderRadius.lg,
              marginBottom: spacing['2xl'],
              ...shadows.sm,
            })}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primary, marginLeft: 8 }}>Back to Home</Text>
          </Pressable>

          {/* Language Section */}
          <View style={{ marginBottom: 28 }}>
            <SectionHeader
              icon="language"
              iconBg="#E8E8F0"
              iconColor="#3D3D5A"
              title="Language"
              subtitle="Choose your preferred language"
            />

            <View style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.md,
              overflow: 'hidden',
              ...shadows.sm,
            }}>
              {LANGUAGES.map((lang, index) => (
                <Pressable
                  key={lang.code}
                  onPress={() => handleLanguageChange(lang.code)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    backgroundColor: pressed ? '#F9FAFB' : '#fff',
                    borderBottomWidth: index < LANGUAGES.length - 1 ? 1 : 0,
                    borderBottomColor: '#F3F4F6',
                  })}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{lang.flag}</Text>
                  <Text style={{ flex: 1, fontSize: 16, color: '#4A3728' }}>{lang.label}</Text>
                  {settings.language === lang.code && (
                    <Ionicons name="checkmark-circle" size={24} color="#2D5A3D" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Grocery List Section */}
          <View style={{ marginBottom: 28 }}>
            <SectionHeader
              icon="home"
              iconBg="#E8F0E8"
              iconColor="#2D5A3D"
              title="Items at Home"
              subtitle="These won't appear in your grocery list"
            />

            {/* Add new item input */}
            <View style={{
              flexDirection: 'row',
              backgroundColor: colors.white,
              borderRadius: borderRadius.md,
              padding: 4,
              marginBottom: spacing.lg,
              ...shadows.sm,
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
                backgroundColor: colors.white,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
                marginBottom: spacing.lg,
                ...shadows.sm,
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
                backgroundColor: colors.white,
                borderRadius: borderRadius.md,
                padding: spacing['2xl'],
                alignItems: 'center',
                marginBottom: spacing.lg,
                ...shadows.sm,
              }}>
                <View style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: colors.bgMid,
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
                backgroundColor: colors.white,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
                ...shadows.sm,
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

          {/* About Section */}
          <View style={{ marginBottom: 28 }}>
            <SectionHeader
              icon="information-circle"
              iconBg="#F3E8E0"
              iconColor="#4A3728"
              title="About"
              subtitle="App information"
            />

            <View style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              ...shadows.sm,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 15, color: '#6B7280' }}>Version</Text>
                <Text style={{ fontSize: 15, color: '#4A3728', fontWeight: '500' }}>1.0.0</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 15, color: '#6B7280' }}>Made with</Text>
                <Text style={{ fontSize: 15 }}>❤️</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
