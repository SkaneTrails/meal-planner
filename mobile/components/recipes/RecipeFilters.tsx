/**
 * Search bar and filter chips for the recipes screen.
 */

import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from '@/components';
import { hapticLight } from '@/lib/haptics';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  spacing,
} from '@/lib/theme';
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
  <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.sm }}>
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.glass.light,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.glass.border,
      }}
    >
      <Ionicons name="search" size={18} color={colors.content.secondary} />
      <TextInput
        ref={searchInputRef}
        style={{
          flex: 1,
          fontSize: fontSize.md,
          color: colors.content.body,
          marginLeft: spacing.sm,
        }}
        placeholder={t('recipes.searchPlaceholder')}
        placeholderTextColor={colors.content.secondary}
        value={searchQuery}
        onChangeText={onSearchChange}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {searchQuery !== '' && (
        <Pressable
          onPress={() => onSearchChange('')}
          style={{ padding: spacing.xs }}
        >
          <Ionicons name="close-circle" size={18} color={colors.text.muted} />
        </Pressable>
      )}
      {isSearchFocused && (
        <Pressable onPress={onClear} style={{ marginLeft: spacing.sm }}>
          <Text
            style={{
              fontSize: fontSize.xl,
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
  { diet: 'fish', emoji: '🐟', activeColor: colors.chip.fishActive },
  { diet: 'meat', emoji: '🍗', activeColor: colors.chip.meatActive },
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
  <View style={{ paddingVertical: spacing.sm }}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}
    >
      {/* Library scope toggle */}
      <View
        style={{
          flexDirection: 'row',
          borderRadius: borderRadius.sm,
          borderWidth: 1,
          borderColor: colors.chip.border,
          overflow: 'hidden',
        }}
      >
        <Pressable
          onPress={() => {
            hapticLight();
            onLibraryScopeChange('all');
          }}
          style={{
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            backgroundColor:
              libraryScope === 'all'
                ? colors.button.primary
                : colors.glass.dark,
          }}
        >
          <Text
            style={{
              fontSize: fontSize.md,
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
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            backgroundColor:
              libraryScope === 'mine'
                ? colors.button.primary
                : colors.glass.dark,
          }}
        >
          <Text
            style={{
              fontSize: fontSize.md,
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
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: borderRadius.sm,
          backgroundColor:
            !dietFilter && !showFavoritesOnly
              ? colors.content.body
              : colors.chip.bg,
          borderWidth: !dietFilter && !showFavoritesOnly ? 0 : 1,
          borderColor: colors.chip.border,
        }}
      >
        <Text
          style={{
            fontSize: fontSize.md,
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
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.sm,
            backgroundColor: dietFilter === diet ? activeColor : colors.chip.bg,
            borderWidth: dietFilter === diet ? 0 : 1,
            borderColor: colors.chip.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
          }}
        >
          <Text style={{ fontSize: fontSize.md }}>{emoji}</Text>
          <Text
            style={{
              fontSize: fontSize.md,
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
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: borderRadius.sm,
          backgroundColor: showFavoritesOnly
            ? colors.chip.favoriteActive
            : colors.chip.bg,
          borderWidth: showFavoritesOnly ? 0 : 1,
          borderColor: colors.chip.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        }}
      >
        <Ionicons
          name={showFavoritesOnly ? 'heart' : 'heart-outline'}
          size={15}
          color={showFavoritesOnly ? colors.white : colors.chip.favoriteActive}
        />
        <Text
          style={{
            fontSize: fontSize.md,
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
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: borderRadius.sm,
          backgroundColor: colors.chip.bg,
          borderWidth: 1,
          borderColor: colors.chip.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        }}
      >
        <Ionicons name="funnel-outline" size={13} color={colors.content.body} />
        <Text
          style={{
            fontSize: fontSize.md,
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
