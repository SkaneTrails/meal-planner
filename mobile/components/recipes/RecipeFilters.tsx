/**
 * Search bar and filter chips for the recipes screen.
 */

import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AnimatedPressable, Button } from '@/components';
import { hapticLight } from '@/lib/haptics';
import type { TFunction } from '@/lib/i18n';
import { dotSize, fontSize, spacing, useTheme } from '@/lib/theme';
import type { DietLabel, LibraryScope } from '@/lib/types';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  isSearchFocused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onClear?: () => void;
  searchInputRef?: React.RefObject<TextInput | null>;
  placeholder?: string;
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
  placeholder,
  t,
}: SearchBarProps) => {
  const { colors, fonts, borderRadius } = useTheme();

  return (
    <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.sm }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.searchBar.bg,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderWidth: 1,
          borderColor: colors.searchBar.border,
        }}
      >
        <Ionicons name="search" size={18} color={colors.searchBar.icon} />
        <TextInput
          ref={searchInputRef}
          style={{
            flex: 1,
            fontSize: fontSize.md,
            fontFamily: fonts.body,
            color: colors.searchBar.text,
            marginLeft: spacing.sm,
          }}
          placeholder={placeholder ?? t('recipes.searchPlaceholder')}
          placeholderTextColor={colors.searchBar.placeholder}
          value={searchQuery}
          onChangeText={onSearchChange}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {searchQuery !== '' && (
          <Button
            variant="icon"
            tone="cancel"
            icon="close-circle"
            size="sm"
            onPress={onClear ?? (() => onSearchChange(''))}
          />
        )}
        {isSearchFocused && onClear && (
          <Button
            variant="text"
            tone="cancel"
            label={t('common.cancel')}
            size="lg"
            onPress={onClear}
            style={{ marginLeft: spacing.sm }}
          />
        )}
      </View>
    </View>
  );
};

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
}: FilterChipsProps) => {
  const { colors, fonts, borderRadius } = useTheme();

  const dietChips: {
    diet: DietLabel;
    dotColor: string;
    activeColor: string;
  }[] = [
    {
      diet: 'veggie',
      dotColor: colors.ai.primary,
      activeColor: colors.ai.primary,
    },
    {
      diet: 'fish',
      dotColor: colors.chip.fishActive,
      activeColor: colors.chip.fishActive,
    },
    {
      diet: 'meat',
      dotColor: colors.chip.meatActive,
      activeColor: colors.chip.meatActive,
    },
  ];

  return (
    <View style={{ paddingVertical: spacing.sm }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          gap: spacing.sm,
        }}
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
                fontFamily: fonts.bodySemibold,
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
                fontFamily: fonts.bodySemibold,
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
              fontFamily: fonts.bodySemibold,
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
        {dietChips.map(({ diet, dotColor, activeColor }) => (
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
              backgroundColor:
                dietFilter === diet ? activeColor : colors.chip.bg,
              borderWidth: dietFilter === diet ? 0 : 1,
              borderColor: colors.chip.border,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <View
              style={{
                width: dotSize.md,
                height: dotSize.md,
                borderRadius: dotSize.md / 2,
                backgroundColor: dietFilter === diet ? colors.white : dotColor,
              }}
            />
            <Text
              style={{
                fontSize: fontSize.md,
                fontFamily: fonts.bodySemibold,
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
            color={
              showFavoritesOnly ? colors.white : colors.chip.favoriteActive
            }
          />
          <Text
            style={{
              fontSize: fontSize.md,
              fontFamily: fonts.bodySemibold,
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
          <Ionicons
            name="funnel-outline"
            size={13}
            color={colors.content.body}
          />
          <Text
            style={{
              fontSize: fontSize.md,
              fontFamily: fonts.bodySemibold,
              color: colors.content.body,
            }}
          >
            {sortOptions.find((o) => o.value === sortBy)?.label}
          </Text>
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
};
