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
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { shadows, borderRadius, colors, spacing, fontSize, fontWeight, fontFamily } from '@/lib/theme';
import { useSettings, LANGUAGES, type AppLanguage } from '@/lib/settings-context';
import { useAuth } from '@/lib/hooks/use-auth';
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
  const { user, signOut } = useAuth();
  const { settings, addItemAtHome, removeItemAtHome, setLanguage } = useSettings();
  const [newItem, setNewItem] = useState('');

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

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
      <View style={{ flex: 1, paddingBottom: 100 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingTop: 44, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{
              fontSize: fontSize['4xl'],
              fontFamily: fontFamily.display,
              color: colors.text.primary,
              letterSpacing: -0.5,
            }}>Settings</Text>
            <Text style={{
              fontSize: fontSize.lg,
              fontFamily: fontFamily.body,
              color: colors.text.secondary,
              marginTop: 4,
            }}>Customize your experience</Text>
          </View>

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
              {LANGUAGES.map((lang, index) => {
                // Flag image URLs - using circular flag icons
                const flagUrls: Record<AppLanguage, string> = {
                  en: 'https://flagcdn.com/w80/gb.png',
                  sv: 'https://flagcdn.com/w80/se.png',
                  it: 'https://flagcdn.com/w80/it.png',
                };

                return (
                <Pressable
                  key={lang.code}
                  onPress={() => handleLanguageChange(lang.code)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: spacing.md,
                    backgroundColor: pressed ? colors.bgMid : 'transparent',
                    borderBottomWidth: index < LANGUAGES.length - 1 ? 1 : 0,
                    borderBottomColor: 'rgba(93, 78, 64, 0.15)',
                  })}
                >
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    overflow: 'hidden',
                    marginRight: spacing.md,
                    backgroundColor: '#E8E8E8',
                  }}>
                    <Image
                      source={{ uri: flagUrls[lang.code] }}
                      style={{ width: 32, height: 32 }}
                      contentFit="cover"
                    />
                  </View>
                  <Text style={{ flex: 1, fontSize: fontSize.md, color: colors.text.dark }}>{lang.label}</Text>
                  {settings.language === lang.code && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                  )}
                </Pressable>
              )})}
            </View>
          </View>

          {/* Grocery List Section */}
          <View style={{ marginBottom: spacing['2xl'] }}>
            <SectionHeader
              icon="home"
              title="Items at Home"
              subtitle="These won't appear in your grocery list"
            />

            {/* Current items - show first */}
            {settings.itemsAtHome.length > 0 && (
              <View style={{
                backgroundColor: colors.glass.card,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
                ...shadows.sm,
              }}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.text.dark + '80', marginBottom: spacing.sm }}>
                  Your items ({settings.itemsAtHome.length})
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {settings.itemsAtHome.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => handleRemoveItem(item)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: pressed ? colors.errorBg : colors.bgDark,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xs,
                        borderRadius: borderRadius.full,
                        gap: 4,
                      })}
                    >
                      <Text style={{ fontSize: fontSize.sm, color: colors.text.dark, textTransform: 'capitalize' }}>
                        {item}
                      </Text>
                      <Ionicons name="close-circle" size={14} color={colors.text.dark + '60'} />
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Add new item input - second */}
            <View style={{
              flexDirection: 'row',
              backgroundColor: colors.glass.card,
              borderRadius: borderRadius.md,
              padding: 4,
              marginBottom: spacing.md,
              ...shadows.sm,
            }}>
              <TextInput
                style={{
                  flex: 1,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  fontSize: fontSize.md,
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
                  padding: spacing.sm,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={newItem.trim() ? colors.white : colors.text.inverse + '60'}
                />
              </Pressable>
            </View>

            {/* Suggested items - third */}
            {suggestedNotAdded.length > 0 && (
              <View style={{
                backgroundColor: colors.glass.card,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                ...shadows.sm,
              }}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.text.dark + '80', marginBottom: spacing.sm }}>
                  Suggestions
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {suggestedNotAdded.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => handleAddSuggested(item)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: pressed ? colors.successBg : 'transparent',
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xs,
                        borderRadius: borderRadius.full,
                        borderWidth: 1,
                        borderColor: colors.text.dark + '30',
                        borderStyle: 'dashed',
                        gap: 4,
                      })}
                    >
                      <Ionicons name="add" size={14} color={colors.text.dark + '80'} />
                      <Text style={{ fontSize: fontSize.sm, color: colors.text.dark + '80', textTransform: 'capitalize' }}>
                        {item}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Empty state - only show when no items */}
            {settings.itemsAtHome.length === 0 && (
              <View style={{
                backgroundColor: colors.glass.card,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
                alignItems: 'center',
                marginTop: spacing.sm,
                ...shadows.sm,
              }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.bgDark,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.sm,
                }}>
                  <Ionicons name="basket-outline" size={24} color={colors.text.dark} />
                </View>
                <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text.dark, marginBottom: 2 }}>
                  No items yet
                </Text>
                <Text style={{ fontSize: fontSize.sm, color: colors.text.dark + '80', textAlign: 'center' }}>
                  Add items you always have at home
                </Text>
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

          {/* Account Section */}
          <View style={{ marginBottom: spacing['2xl'] }}>
            <SectionHeader
              icon="person-circle"
              title="Account"
              subtitle={user?.email || 'Email unavailable'}
            />

            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#FEE2E2' : colors.glass.card,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                ...shadows.sm,
              })}
            >
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontWeight: fontWeight.semibold,
                  color: '#DC2626',
                  marginLeft: spacing.sm,
                }}
              >
                Sign Out
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </GradientBackground>
  );
}
