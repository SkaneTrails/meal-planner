/**
 * Search bar and filter chips for the recipes screen.
 */

import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, colors, fontSize, fontFamily } from '@/lib/theme';
import { AnimatedPressable } from '@/components';
import { hapticLight } from '@/lib/haptics';
import type { TFunction } from '@/lib/i18n';
import type { DietLabel } from '@/lib/types';

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
  <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.glass.card,
      borderRadius: borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
    }}>
      <Ionicons name="search" size={18} color="#8B7355" />
      <TextInput
        ref={searchInputRef}
        style={{ flex: 1, fontSize: fontSize.md, color: '#5D4E40', marginLeft: 10 }}
        placeholder={t('recipes.searchPlaceholder')}
        placeholderTextColor="#8B7355"
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
          <Text style={{ fontSize: 15, color: '#7A6858', fontFamily: fontFamily.bodyMedium }}>
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
  sortBy: string;
  sortOptions: { value: string; label: string }[];
  onDietChange: (diet: DietLabel | null) => void;
  onFavoritesToggle: () => void;
  onSortPress: () => void;
  t: TFunction;
}

const DIET_CHIPS: { diet: DietLabel; emoji: string; activeColor: string }[] = [
  { diet: 'veggie', emoji: '🌱', activeColor: '#4A8C5C' },
  { diet: 'fish', emoji: '🐟', activeColor: '#2D7AB8' },
  { diet: 'meat', emoji: '🍗', activeColor: '#B85C38' },
];

export const FilterChips = ({
  dietFilter,
  showFavoritesOnly,
  sortBy,
  sortOptions,
  onDietChange,
  onFavoritesToggle,
  onSortPress,
  t,
}: FilterChipsProps) => (
  <View style={{ paddingVertical: 8 }}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {/* All chip */}
      <AnimatedPressable
        onPress={() => { hapticLight(); onDietChange(null); }}
        hoverScale={1.05}
        pressScale={0.95}
        style={{
          paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
          backgroundColor: !dietFilter && !showFavoritesOnly ? '#5D4E40' : 'transparent',
          borderWidth: 1.5,
          borderColor: !dietFilter && !showFavoritesOnly ? '#5D4E40' : '#8B7355',
        }}
      >
        <Text style={{
          fontSize: 14, fontWeight: '600',
          color: !dietFilter && !showFavoritesOnly ? colors.white : '#5D4E40',
        }}>
          {t('labels.diet.all')}
        </Text>
      </AnimatedPressable>

      {/* Diet chips */}
      {DIET_CHIPS.map(({ diet, emoji, activeColor }) => (
        <AnimatedPressable
          key={diet}
          onPress={() => { hapticLight(); onDietChange(dietFilter === diet ? null : diet); }}
          hoverScale={1.05}
          pressScale={0.95}
          style={{
            paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
            backgroundColor: dietFilter === diet ? activeColor : 'transparent',
            borderWidth: 1.5,
            borderColor: dietFilter === diet ? activeColor : '#8B7355',
            flexDirection: 'row', alignItems: 'center', gap: 6,
          }}
        >
          <Text style={{ fontSize: 14 }}>{emoji}</Text>
          <Text style={{
            fontSize: 14, fontWeight: '600',
            color: dietFilter === diet ? colors.white : '#5D4E40',
          }}>
            {t(`labels.diet.${diet}`)}
          </Text>
        </AnimatedPressable>
      ))}

      {/* Favorites chip */}
      <AnimatedPressable
        onPress={() => { hapticLight(); onFavoritesToggle(); }}
        hoverScale={1.05}
        pressScale={0.95}
        style={{
          paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
          backgroundColor: showFavoritesOnly ? '#C75050' : 'transparent',
          borderWidth: 1.5,
          borderColor: showFavoritesOnly ? '#C75050' : '#8B7355',
          flexDirection: 'row', alignItems: 'center', gap: 6,
        }}
      >
        <Ionicons
          name={showFavoritesOnly ? 'heart' : 'heart-outline'}
          size={16}
          color={showFavoritesOnly ? colors.white : '#C75050'}
        />
        <Text style={{
          fontSize: 14, fontWeight: '600',
          color: showFavoritesOnly ? colors.white : '#5D4E40',
        }}>
          {t('recipes.favorites')}
        </Text>
      </AnimatedPressable>

      {/* Sort chip */}
      <AnimatedPressable
        onPress={() => { hapticLight(); onSortPress(); }}
        hoverScale={1.05}
        pressScale={0.95}
        style={{
          paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
          backgroundColor: 'transparent',
          borderWidth: 1.5, borderColor: '#8B7355',
          flexDirection: 'row', alignItems: 'center', gap: 6,
        }}
      >
        <Ionicons name="funnel-outline" size={14} color="#5D4E40" />
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#5D4E40' }}>
          {sortOptions.find((o) => o.value === sortBy)?.label}
        </Text>
      </AnimatedPressable>
    </ScrollView>
  </View>
);
