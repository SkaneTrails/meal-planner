import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, colors, spacing, fontSize, fontFamily } from '@/lib/theme';
import { GradientBackground } from '@/components';
import { useSelectRecipeState, type TabType } from './select-recipe/useSelectRecipeState';
import { QuickMealTab } from './select-recipe/QuickMealTab';
import { LibraryTab } from './select-recipe/LibraryTab';
import { RandomTab } from './select-recipe/RandomTab';
import { CopyMealTab } from './select-recipe/CopyMealTab';

const TAB_KEYS: TabType[] = ['library', 'random', 'quick', 'copy'];

export default function SelectRecipeScreen() {
  const state = useSelectRecipeState();
  const {
    t, mode, MEAL_TYPE_LABELS, mealType, formattedDate,
    activeTab, setActiveTab, shuffleRandom,
    handleRemoveMeal, removeMeal,
  } = state;

  const renderActiveTab = () => {
    if (mode === 'quick' || activeTab === 'quick') return <QuickMealTab state={state} />;
    if (activeTab === 'library') return <LibraryTab state={state} />;
    if (activeTab === 'random') return <RandomTab state={state} />;
    return <CopyMealTab state={state} />;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: `${MEAL_TYPE_LABELS[mealType]} - ${formattedDate}`,
        }}
      />

      <GradientBackground style={{ flex: 1 }}>
        {!mode && (
          <TabBar
            tabs={TAB_KEYS}
            activeTab={activeTab}
            onTabPress={(tab) => {
              setActiveTab(tab);
              if (tab === 'random') shuffleRandom();
            }}
            labels={{
              library: t('selectRecipe.tabs.library'),
              random: t('selectRecipe.tabs.random'),
              quick: t('selectRecipe.tabs.quick'),
              copy: t('selectRecipe.tabs.copy'),
            }}
          />
        )}

        {renderActiveTab()}

        {(activeTab === 'quick' || activeTab === 'copy') && (
          <RemoveMealFooter
            onRemove={handleRemoveMeal}
            isPending={removeMeal.isPending}
            label={t('selectRecipe.clearMeal')}
          />
        )}
      </GradientBackground>
    </>
  );
}

/* ── Inline sub-components ── */

interface TabBarProps {
  tabs: TabType[];
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
  labels: Record<TabType, string>;
}

const TabBar = ({ tabs, activeTab, onTabPress, labels }: TabBarProps) => (
  <View style={{ backgroundColor: colors.glass.card, paddingHorizontal: spacing.md, paddingVertical: spacing.md }}>
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      {tabs.map((tab) => (
        <Pressable
          key={tab}
          onPress={() => onTabPress(tab)}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.sm,
            backgroundColor: activeTab === tab ? colors.primary : colors.glass.light,
            alignItems: 'center',
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Text style={{
            fontSize: fontSize.sm,
            fontFamily: fontFamily.bodySemibold,
            color: activeTab === tab ? colors.white : colors.text.inverse,
          }}>
            {labels[tab]}
          </Text>
        </Pressable>
      ))}
    </View>
  </View>
);

interface RemoveMealFooterProps {
  onRemove: () => void;
  isPending: boolean;
  label: string;
}

const RemoveMealFooter = ({ onRemove, isPending, label }: RemoveMealFooterProps) => (
  <View style={{ padding: spacing.lg, backgroundColor: colors.glass.card }}>
    <Pressable
      onPress={onRemove}
      disabled={isPending}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.sm,
        backgroundColor: pressed ? colors.glass.medium : colors.glass.light,
      })}
    >
      <Ionicons name="trash-outline" size={18} color={colors.text.inverse} />
      <Text style={{ marginLeft: spacing.sm, fontSize: fontSize.lg, fontWeight: '600', color: colors.text.inverse }}>
        {label}
      </Text>
    </Pressable>
  </View>
);
