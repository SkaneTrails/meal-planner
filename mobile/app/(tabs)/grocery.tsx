/**
 * Grocery screen - Shopping list from meal plan.
 */

import { View } from 'react-native';
import {
  GradientBackground,
  GroceryListSkeleton,
  GroceryListView,
} from '@/components';
import {
  AddItemCard,
  EmptyGroceryState,
  GroceryHeader,
  StatsCard,
} from '@/components/grocery';
import { useGroceryScreen } from '@/lib/hooks/useGroceryScreen';
import { useTranslation } from '@/lib/i18n';
import { layout, spacing } from '@/lib/theme';

export default function GroceryScreen() {
  const { t } = useTranslation();
  const {
    isLoading,
    hasLoadedOnce,
    showAddItem,
    setShowAddItem,
    showClearMenu,
    setShowClearMenu,
    newItemText,
    setNewItemText,
    totalItems,
    checkedCount,
    hiddenAtHomeCount,
    itemsToBuy,
    checkedItemsToBuy,
    groceryListWithChecked,
    handleItemToggle,
    handleAddItem,
    handleClearChecked,
    handleClearAll,
    handleClearMealPlanItems,
    handleClearManualItems,
    filterOutItemsAtHome,
  } = useGroceryScreen();

  if (isLoading && !hasLoadedOnce) {
    return (
      <GradientBackground structured>
        <View style={[{ flex: 1 }, layout.contentContainer]}>
          <GroceryHeader />
          <GroceryListSkeleton />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground structured>
      <View style={[{ flex: 1 }, layout.contentContainer]}>
        <GroceryHeader />

        <View
          style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}
        >
          <StatsCard
            itemsToBuy={itemsToBuy}
            checkedItemsToBuy={checkedItemsToBuy}
            totalItems={totalItems}
            checkedCount={checkedCount}
            hiddenAtHomeCount={hiddenAtHomeCount}
            showAddItem={showAddItem}
            showClearMenu={showClearMenu}
            onToggleAddItem={() => {
              setShowAddItem(!showAddItem);
              setShowClearMenu(false);
            }}
            onToggleClearMenu={() => {
              setShowClearMenu(!showClearMenu);
              setShowAddItem(false);
            }}
            onClearChecked={handleClearChecked}
            onClearMealPlanItems={handleClearMealPlanItems}
            onClearManualItems={handleClearManualItems}
            onClearAll={handleClearAll}
          />

          {showAddItem && (
            <AddItemCard
              newItemText={newItemText}
              onChangeText={setNewItemText}
              onSubmit={handleAddItem}
            />
          )}
        </View>

        {totalItems > 0 ? (
          <GroceryListView
            groceryList={groceryListWithChecked}
            onItemToggle={handleItemToggle}
            filterOutItems={filterOutItemsAtHome}
          />
        ) : (
          <EmptyGroceryState
            title={t('grocery.emptyList')}
            subtitle={t('grocery.goToMealPlan')}
          />
        )}
      </View>
    </GradientBackground>
  );
}
