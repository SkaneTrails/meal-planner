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
import { shadows, borderRadius, colors, spacing, fontSize, fontWeight } from '@/lib/theme';
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
  title,
  subtitle
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
      }}>
        <Ionicons name={icon} size={20} color="#5D4E40" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.primary }}>
          {title}
        </Text>
        <Text style={{ fontSize: fontSize.sm, color: colors.text.secondary, marginTop: 2 }}>
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
          contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
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

          {/* Household Settings Section */}
          <View style={{ marginBottom: spacing['2xl'] }}>
            <SectionHeader
              icon="people"
              title="Household"
              subtitle="Dietary preferences, equipment & more"
            />

            <Pressable
              onPress={() => router.push('/household-settings')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: pressed ? colors.bgDark : colors.glass.card,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
                ...shadows.sm,
              })}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.dark }}>
                  Household Settings
                </Text>
                <Text style={{ fontSize: 13, color: colors.text.dark + '80', marginTop: 4 }}>
                  Configure dietary preferences, kitchen equipment, and household size
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.dark + '80'} />
            </Pressable>
          </View>

          {/* Language Section */}
          <View style={{ marginBottom: spacing['2xl'] }}>
            <SectionHeader
              icon="language"
              title="Language"
              subtitle="Choose your preferred language"
            />

            <View style={{
              backgroundColor: colors.glass.card,
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
                    padding: spacing.lg,
                    backgroundColor: pressed ? colors.bgMid : 'transparent',
                    borderBottomWidth: index < LANGUAGES.length - 1 ? 1 : 0,
                    borderBottomColor: 'rgba(93, 78, 64, 0.15)',
                  })}
                >
                  <Text style={{ fontSize: 24, marginRight: spacing.md }}>{lang.flag}</Text>
                  <Text style={{ flex: 1, fontSize: fontSize.lg, color: colors.text.dark }}>{lang.label}</Text>
                  {settings.language === lang.code && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Grocery List Section */}
          <View style={{ marginBottom: spacing['2xl'] }}>
            <SectionHeader
              icon="home"
              title="Items at Home"
              subtitle="These won't appear in your grocery list"
            />

            {/* Add new item input */}
            <View style={{
              flexDirection: 'row',
              backgroundColor: colors.glass.card,
              borderRadius: borderRadius.md,
              padding: 4,
              marginBottom: spacing.lg,
              ...shadows.sm,
            }}>
              <TextInput
                style={{
                  flex: 1,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  fontSize: fontSize.lg,
                  color: colors.text.dark,
                }}
                placeholder="Add an item (e.g., salt, olive oil)"
                placeholderTextColor={colors.text.dark + '60'}
                value={newItem}
                onChangeText={setNewItem}
                onSubmitEditing={handleAddItem}
                returnKeyType="done"
              />
              <Pressable
                onPress={handleAddItem}
                disabled={!newItem.trim()}
                style={({ pressed }) => ({
                  backgroundColor: newItem.trim() ? colors.primary : colors.bgDark,
                  borderRadius: borderRadius.sm,
                  padding: spacing.md,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Ionicons
                  name="add"
                  size={24}
                  color={newItem.trim() ? colors.white : colors.text.inverse + '60'}
                />
              </Pressable>
            </View>

            {/* Current items */}
            {settings.itemsAtHome.length > 0 ? (
              <View style={{
                backgroundColor: colors.glass.card,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
                marginBottom: spacing.lg,
                ...shadows.sm,
              }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text.dark + '80', marginBottom: spacing.md }}>
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
                        backgroundColor: pressed ? colors.errorBg : colors.bgDark,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        borderRadius: borderRadius.full,
                        gap: 6,
                      })}
                    >
                      <Text style={{ fontSize: fontSize.base, color: colors.text.dark, textTransform: 'capitalize' }}>
                        {item}
                      </Text>
                      <Ionicons name="close-circle" size={18} color={colors.text.dark + '60'} />
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              <View style={{
                backgroundColor: colors.glass.card,
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
                  backgroundColor: colors.bgDark,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.md,
                }}>
                  <Ionicons name="basket-outline" size={28} color={colors.text.dark} />
                </View>
                <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text.dark, marginBottom: 4 }}>
                  No items yet
                </Text>
                <Text style={{ fontSize: fontSize.base, color: colors.text.dark + '80', textAlign: 'center' }}>
                  Add items you always have at home to exclude them from your grocery list
                </Text>
              </View>
            )}

            {/* Suggested items */}
            {suggestedNotAdded.length > 0 && (
              <View style={{
                backgroundColor: colors.glass.card,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
                ...shadows.sm,
              }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text.dark + '80', marginBottom: spacing.md }}>
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
                        backgroundColor: pressed ? colors.successBg : 'transparent',
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        borderRadius: borderRadius.full,
                        borderWidth: 1,
                        borderColor: colors.text.dark + '30',
                        borderStyle: 'dashed',
                        gap: 6,
                      })}
                    >
                      <Ionicons name="add" size={16} color={colors.text.dark + '80'} />
                      <Text style={{ fontSize: fontSize.base, color: colors.text.dark + '80', textTransform: 'capitalize' }}>
                        {item}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* About Section */}
          <View style={{ marginBottom: spacing['2xl'] }}>
            <SectionHeader
              icon="information-circle"
              title="About"
              subtitle="App information"
            />

            <View style={{
              backgroundColor: colors.glass.card,
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              ...shadows.sm,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                <Text style={{ fontSize: fontSize.md, color: colors.text.dark + '80' }}>Version</Text>
                <Text style={{ fontSize: fontSize.md, color: colors.text.dark, fontWeight: fontWeight.medium }}>1.0.0</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: fontSize.md, color: colors.text.dark + '80' }}>Made with</Text>
                <Text style={{ fontSize: fontSize.md }}>❤️</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
