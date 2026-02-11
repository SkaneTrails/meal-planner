import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, colors, spacing, fontSize, fontFamily } from '@/lib/theme';
import { GradientBackground } from '@/components';
import { useSelectRecipeState, type TabType } from '@/lib/hooks/useSelectRecipeState';
import { QuickMealTab } from '@/components/select-recipe/QuickMealTab';
import { LibraryTab } from '@/components/select-recipe/LibraryTab';
import { RandomTab } from '@/components/select-recipe/RandomTab';
import { CopyMealTab } from '@/components/select-recipe/CopyMealTab';

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

      <GradientBackground structured style={{ flex: 1 }}>
        {/* Contextual header - shows what day/meal you're selecting for */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 14, fontFamily: fontFamily.body, color: 'rgba(93, 78, 64, 0.6)' }}>
            {t('selectRecipe.choosingFor')}
          </Text>
          <Text style={{ fontSize: 24, fontFamily: fontFamily.display, color: '#3D3D3D', marginTop: 2 }}>
            {formattedDate} · {MEAL_TYPE_LABELS[mealType]}
          </Text>
        </View>

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
  <View style={{ paddingHorizontal: 20, paddingVertical: spacing.sm }}>
    <View style={{ flexDirection: 'row', gap: 8, backgroundColor: 'rgba(93, 78, 64, 0.06)', borderRadius: 12, padding: 4 }}>
      {tabs.map((tab) => (
        <Pressable
          key={tab}
          onPress={() => onTabPress(tab)}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: activeTab === tab ? '#FFFFFF' : 'transparent',
            alignItems: 'center',
            transform: [{ scale: pressed ? 0.98 : 1 }],
            shadowColor: activeTab === tab ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: activeTab === tab ? 0.08 : 0,
            shadowRadius: 4,
            elevation: activeTab === tab ? 2 : 0,
          })}
        >
          <Text style={{
            fontSize: fontSize.sm,
            fontFamily: fontFamily.bodySemibold,
            color: activeTab === tab ? '#3D3D3D' : 'rgba(93, 78, 64, 0.6)',
          }}>
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
  <View style={{ padding: spacing.lg, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
    <Pressable
      onPress={onRemove}
      disabled={isPending}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: 12,
        backgroundColor: pressed ? 'rgba(93, 78, 64, 0.12)' : 'rgba(93, 78, 64, 0.08)',
      })}
    >
      <Ionicons name="trash-outline" size={18} color="rgba(93, 78, 64, 0.7)" />
      <Text style={{ marginLeft: spacing.sm, fontSize: fontSize.lg, fontWeight: '600', color: 'rgba(93, 78, 64, 0.7)' }}>
        {label}
      </Text>
    </Pressable>
  </View>
);
