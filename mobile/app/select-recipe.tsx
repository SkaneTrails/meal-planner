import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { GradientBackground } from '@/components';
import { CopyMealTab } from '@/components/select-recipe/CopyMealTab';
import { LibraryTab } from '@/components/select-recipe/LibraryTab';
import { QuickMealTab } from '@/components/select-recipe/QuickMealTab';
import { RandomTab } from '@/components/select-recipe/RandomTab';
import {
  type TabType,
  useSelectRecipeState,
} from '@/lib/hooks/useSelectRecipeState';
import { fontFamily, fontSize, spacing } from '@/lib/theme';

const TAB_KEYS: TabType[] = ['library', 'random', 'quick', 'copy'];

export default function SelectRecipeScreen() {
  const state = useSelectRecipeState();
  const {
    t,
    mode,
    MEAL_TYPE_LABELS,
    mealType,
    formattedDate,
    activeTab,
    setActiveTab,
    shuffleRandom,
  } = state;

  const renderActiveTab = () => {
    if (mode === 'extras') return <LibraryTab state={state} />;
    if (mode === 'quick' || activeTab === 'quick')
      return <QuickMealTab state={state} />;
    if (activeTab === 'library') return <LibraryTab state={state} />;
    if (activeTab === 'random') return <RandomTab state={state} />;
    return <CopyMealTab state={state} />;
  };

  // Different header for extras mode
  const headerTitle = mode === 'extras'
    ? t('mealPlan.extras.selectTitle')
    : formattedDate;
  const headerSubtitle = mode === 'extras'
    ? t('mealPlan.extras.selectSubtitle')
    : `${t('selectRecipe.choosingFor')} ${MEAL_TYPE_LABELS[mealType]?.toLowerCase() || ''}`;

  return (
    <>
      <Stack.Screen
        options={{
          title: mode === 'extras'
            ? t('mealPlan.extras.headerTitle')
            : `${MEAL_TYPE_LABELS[mealType]} - ${formattedDate}`,
        }}
      />

      <GradientBackground structured style={{ flex: 1, paddingBottom: 70 }}>
        {/* Header - same style as other pages */}
        <View
          style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}
        >
          <Text
            style={{
              fontSize: fontSize['3xl'],
              fontFamily: fontFamily.display,
              color: '#3D3D3D',
              letterSpacing: -0.3,
              textAlign: 'center',
            }}
          >
            {headerTitle}
          </Text>
          <Text
            style={{
              fontSize: fontSize.md,
              fontFamily: fontFamily.body,
              color: 'rgba(93, 78, 64, 0.6)',
              marginTop: 2,
              textAlign: 'center',
            }}
          >
            {headerSubtitle}
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
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
        backgroundColor: 'rgba(93, 78, 64, 0.06)',
        borderRadius: 12,
        padding: 4,
      }}
    >
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
            shadowOffset: { width: 1, height: 1 },
            shadowOpacity: activeTab === tab ? 0.08 : 0,
            shadowRadius: 4,
            elevation: activeTab === tab ? 2 : 0,
          })}
        >
          <Text
            style={{
              fontSize: fontSize.sm,
              fontFamily: fontFamily.bodySemibold,
              color: activeTab === tab ? '#3D3D3D' : 'rgba(93, 78, 64, 0.6)',
            }}
          >
            {labels[tab]}
          </Text>
        </Pressable>
      ))}
    </View>
  </View>
);
