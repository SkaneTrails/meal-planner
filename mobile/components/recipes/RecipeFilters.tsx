/**
 * Search bar and filter chips for the recipes screen.
 */

import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from '@/components';
import { hapticLight } from '@/lib/haptics';
import type { TFunction } from '@/lib/i18n';
import { borderRadius, colors, fontFamily, fontSize } from '@/lib/theme';
import type { DietLabel, LibraryScope } from '@/lib/types';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  isSearchFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onClear: () => void;
  searchInputRef: React.RefObject<TextInput | null>;
  t: TFunction;
}

export const SearchBar = ({
  searchQuery,
  onSearchChange,
  isSearchFocused,
  onFocus,
  onBlur,
  onClear,
  searchInputRef,
  t,
}: SearchBarProps) => (
  <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        borderRadius: borderRadius.md,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
      }}
    >
      <Ionicons name="search" size={18} color={colors.content.secondary} />
      <TextInput
        ref={searchInputRef}
        style={{
          flex: 1,
          fontSize: fontSize.md,
          color: colors.content.body,
          marginLeft: 10,
        }}
        placeholder={t('recipes.searchPlaceholder')}
        placeholderTextColor={colors.content.secondary}
        value={searchQuery}
        onChangeText={onSearchChange}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {searchQuery !== '' && (
        <Pressable onPress={() => onSearchChange('')} style={{ padding: 4 }}>
          <Ionicons name="close-circle" size={18} color={colors.text.muted} />
        </Pressable>
      )}
      {isSearchFocused && (
        <Pressable onPress={onClear} style={{ marginLeft: 8 }}>
          <Text
            style={{
              fontSize: 15,
              color: colors.button.primary,
              fontFamily: fontFamily.bodyMedium,
            }}
          >
            {t('common.cancel')}
          </Text>
        </Pressable>
      )}
    </View>
  </View>
);

interface FilterChipsProps {
  dietFilter: DietLabel | null;
  showFavoritesOnly: boolean;
  libraryScope: LibraryScope;
  sortBy: string;
  sortOptions: { value: string; label: string }[];
  onDietChange: (diet: DietLabel | null) => void;
  onFavoritesToggle: () => void;
  onLibraryScopeChange: (scope: LibraryScope) => void;
  onSortPress: () => void;
  t: TFunction;
}

const DIET_CHIPS: { diet: DietLabel; emoji: string; activeColor: string }[] = [
  { diet: 'veggie', emoji: '🌱', activeColor: colors.ai.primary },
  { diet: 'fish', emoji: '🐟', activeColor: '#2D7AB8' },
  { diet: 'meat', emoji: '🍗', activeColor: '#B85C38' },
];

export const FilterChips = ({
  dietFilter,
  showFavoritesOnly,
  libraryScope,
  sortBy,
  sortOptions,
  onDietChange,
  onFavoritesToggle,
  onLibraryScopeChange,
  onSortPress,
  t,
}: FilterChipsProps) => (
  <View style={{ paddingVertical: 8 }}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      {/* Library scope toggle */}
      <View
        style={{
          flexDirection: 'row',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: 'rgba(139, 115, 85, 0.3)',
          overflow: 'hidden',
        }}
      >
        <Pressable
          onPress={() => {
            hapticLight();
            onLibraryScopeChange('all');
          }}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 5,
            backgroundColor:
              libraryScope === 'all'
                ? colors.button.primary
                : colors.glass.dark,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontFamily: fontFamily.bodySemibold,
              color:
                libraryScope === 'all' ? colors.white : colors.content.body,
            }}
          >
            {t('recipes.scopeAll')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            hapticLight();
            onLibraryScopeChange('mine');
          }}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 5,
            backgroundColor:
              libraryScope === 'mine'
                ? colors.button.primary
                : colors.glass.dark,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontFamily: fontFamily.bodySemibold,
              color:
                libraryScope === 'mine' ? colors.white : colors.content.body,
            }}
          >
            {t('recipes.scopeMine')}
          </Text>
        </Pressable>
      </View>
      {/* All chip */}
      <AnimatedPressable
        onPress={() => {
          hapticLight();
          onDietChange(null);
        }}
        hoverScale={1.05}
        pressScale={0.95}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 5,
          borderRadius: 14,
          backgroundColor:
            !dietFilter && !showFavoritesOnly
              ? colors.content.body
              : 'rgba(232, 222, 212, 0.7)',
          borderWidth: !dietFilter && !showFavoritesOnly ? 0 : 1,
          borderColor: 'rgba(139, 115, 85, 0.3)',
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontFamily: fontFamily.bodySemibold,
            color:
              !dietFilter && !showFavoritesOnly
                ? colors.white
                : colors.content.body,
          }}
        >
          {t('labels.diet.all')}
        </Text>
      </AnimatedPressable>

      {/* Diet chips */}
      {DIET_CHIPS.map(({ diet, emoji, activeColor }) => (
        <AnimatedPressable
          key={diet}
          onPress={() => {
            hapticLight();
            onDietChange(dietFilter === diet ? null : diet);
          }}
          hoverScale={1.05}
          pressScale={0.95}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 14,
            backgroundColor:
              dietFilter === diet ? activeColor : 'rgba(232, 222, 212, 0.7)',
            borderWidth: dietFilter === diet ? 0 : 1,
            borderColor: 'rgba(139, 115, 85, 0.3)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Text style={{ fontSize: 13 }}>{emoji}</Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: fontFamily.bodySemibold,
              color: dietFilter === diet ? colors.white : colors.content.body,
            }}
          >
            {t(`labels.diet.${diet}`)}
          </Text>
        </AnimatedPressable>
      ))}

      {/* Favorites chip */}
      <AnimatedPressable
        onPress={() => {
          hapticLight();
          onFavoritesToggle();
        }}
        hoverScale={1.05}
        pressScale={0.95}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 5,
          borderRadius: 14,
          backgroundColor: showFavoritesOnly
            ? '#C75050'
            : 'rgba(232, 222, 212, 0.7)',
          borderWidth: showFavoritesOnly ? 0 : 1,
          borderColor: 'rgba(139, 115, 85, 0.3)',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <Ionicons
          name={showFavoritesOnly ? 'heart' : 'heart-outline'}
          size={15}
          color={showFavoritesOnly ? colors.white : '#C75050'}
        />
        <Text
          style={{
            fontSize: 13,
            fontFamily: fontFamily.bodySemibold,
            color: showFavoritesOnly ? colors.white : colors.content.body,
          }}
        >
          {t('recipes.favorites')}
        </Text>
      </AnimatedPressable>

      {/* Sort chip */}
      <AnimatedPressable
        onPress={() => {
          hapticLight();
          onSortPress();
        }}
        hoverScale={1.05}
        pressScale={0.95}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 5,
          borderRadius: 14,
          backgroundColor: 'rgba(232, 222, 212, 0.7)',
          borderWidth: 1,
          borderColor: 'rgba(139, 115, 85, 0.3)',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <Ionicons name="funnel-outline" size={13} color={colors.content.body} />
        <Text
          style={{
            fontSize: 13,
            fontFamily: fontFamily.bodySemibold,
            color: colors.content.body,
          }}
        >
          {sortOptions.find((o) => o.value === sortBy)?.label}
        </Text>
      </AnimatedPressable>
    </ScrollView>
  </View>
);
