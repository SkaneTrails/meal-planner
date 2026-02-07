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
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { shadows, borderRadius, colors, spacing, fontSize, fontWeight, fontFamily } from '@/lib/theme';
import { useSettings, LANGUAGES, type AppLanguage } from '@/lib/settings-context';
import { useUpdateHouseholdLanguage } from '@/lib/hooks/use-language-sync';
import { useTranslation } from '@/lib/i18n';
import { showNotification } from '@/lib/alert';
import { useAuth } from '@/lib/hooks/use-auth';
import { useCurrentUser } from '@/lib/hooks/use-admin';
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
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { settings, addItemAtHome, removeItemAtHome, setLanguage } = useSettings();
  const updateHouseholdLanguage = useUpdateHouseholdLanguage(currentUser?.household_id);
  const { t } = useTranslation();
  const [newItem, setNewItem] = useState('');

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch {
      showNotification(t('common.error'), t('settings.failedToSignOut'));
    }
  };

  const handleAddItem = async () => {
    const item = newItem.trim();
    if (!item) return;

    try {
      await addItemAtHome(item);
      setNewItem('');
    } catch {
      showNotification(t('common.error'), t('settings.failedToAddItem'));
    }
  };

  const handleRemoveItem = async (item: string) => {
    try {
      await removeItemAtHome(item);
    } catch {
      showNotification(t('common.error'), t('settings.failedToRemoveItem'));
    }
  };

  const handleAddSuggested = async (item: string) => {
    if (settings.itemsAtHome.includes(item.toLowerCase())) {
      return; // Already added
    }
    try {
      await addItemAtHome(item);
    } catch {
      showNotification(t('common.error'), t('settings.failedToAddItem'));
    }
  };

  const suggestedNotAdded = SUGGESTED_ITEMS.filter(
    item => !settings.itemsAtHome.includes(item.toLowerCase())
  );

  const handleLanguageChange = async (language: AppLanguage) => {
    try {
      await setLanguage(language);
      // Write back to Firestore so other household members get the change
      updateHouseholdLanguage(language).catch(() =>
        console.warn('Failed to sync language to household settings')
      );
    } catch {
      showNotification(t('common.error'), t('settings.failedToChangeLanguage'));
    }
  };

  return (
    <GradientBackground muted>
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
              textShadowColor: 'rgba(0, 0, 0, 0.15)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}>{t('settings.title')}</Text>
            <Text style={{
              fontSize: fontSize.lg,
              fontFamily: fontFamily.body,
              color: colors.text.secondary,
              marginTop: 4,
            }}>{t('settings.subtitle')}</Text>
          </View>

          {/* Account Section - Show who's logged in first */}
          <View style={{ marginBottom: spacing['2xl'] }}>
            <SectionHeader
              icon="person-circle"
              title={t('settings.account')}
              subtitle={user?.email || 'Email unavailable'}
            />

            {/* User info card */}
            <View style={{
              backgroundColor: colors.glass.card,
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              marginBottom: spacing.md,
              ...shadows.sm,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.bgDark,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.md,
                }}>
                  <Text style={{ fontSize: 20, fontWeight: '600', color: colors.text.dark }}>
                    {user?.email?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.dark }}>
                    {user?.displayName || user?.email?.split('@')[0] || 'User'}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.text.dark + '80', marginTop: 2 }}>
                    {user?.email}
                  </Text>
                </View>
              </View>
            </View>

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
                {t('settings.signOut')}
              </Text>
            </Pressable>
          </View>

          {/* Household Settings Section */}
          <View style={{ marginBottom: spacing['2xl'] }}>
            <SectionHeader
              icon="people"
              title={t('settings.householdInfo')}
              subtitle={t('settings.householdSettingsDesc')}
            />

            <Pressable
              onPress={() => {
                if (currentUser?.household_id) {
                  router.push(`/household-settings?id=${currentUser.household_id}`);
                }
              }}
              disabled={userLoading || !currentUser?.household_id}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: pressed ? colors.bgDark : colors.glass.card,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
                opacity: userLoading ? 0.6 : currentUser?.household_id ? 1 : 0.5,
                ...shadows.sm,
              })}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.dark }}>
                  {t('settings.householdSettings')}
                </Text>
                <Text style={{ fontSize: 13, color: colors.text.dark + '80', marginTop: 4 }}>
                  {userLoading
                    ? t('settings.loadingHousehold')
                    : currentUser?.household_id
                      ? t('settings.householdSettingsDesc')
                      : t('settings.noHousehold')}
                </Text>
              </View>
              {userLoading ? (
                <ActivityIndicator size="small" color={colors.text.dark + '80'} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.text.dark + '80'} />
              )}
            </Pressable>
          </View>

          {/* Language Section */}
          <View style={{ marginBottom: spacing['2xl'] }}>
            <SectionHeader
              icon="language"
              title={t('settings.language')}
              subtitle={t('settings.languageDesc')}
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
              title={t('settings.itemsAtHome')}
              subtitle={t('settings.itemsAtHomeDesc')}
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
                  {t('settings.yourItems', { count: settings.itemsAtHome.length })}
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
                placeholder={t('settings.addItemPlaceholder')}
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
                  {t('settings.suggestions')}
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
                  {t('settings.noItemsYet')}
                </Text>
                <Text style={{ fontSize: fontSize.sm, color: colors.text.dark + '80', textAlign: 'center' }}>
                  {t('settings.addItemsHint')}
                </Text>
              </View>
            )}
          </View>

          {/* Admin Section - Superuser only */}
          {currentUser?.role === 'superuser' && (
            <View style={{ marginBottom: spacing['2xl'] }}>
              <SectionHeader
                icon="shield-checkmark"
                title={t('settings.adminSection')}
                subtitle={t('settings.adminSectionDesc')}
              />

              <Pressable
                onPress={() => router.push('/admin')}
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
                    {t('settings.adminDashboard')}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.text.dark + '80', marginTop: 4 }}>
                    {t('settings.adminDashboardDesc')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.dark + '80'} />
              </Pressable>
            </View>
          )}

          {/* About Section */}
          <View style={{ marginBottom: spacing['2xl'] }}>
            <SectionHeader
              icon="information-circle"
              title={t('settings.about')}
              subtitle={t('settings.aboutDesc')}
            />

            <View style={{
              backgroundColor: colors.glass.card,
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              ...shadows.sm,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                <Text style={{ fontSize: fontSize.md, color: colors.text.dark + '80' }}>{t('settings.version')}</Text>
                <Text style={{ fontSize: fontSize.md, color: colors.text.dark, fontWeight: fontWeight.medium }}>1.0.0</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: fontSize.md, color: colors.text.dark + '80' }}>{t('settings.madeWith')}</Text>
                <Text style={{ fontSize: fontSize.md }}>❤️</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </GradientBackground>
  );
}
