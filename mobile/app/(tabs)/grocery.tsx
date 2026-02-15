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
import { layout, spacing } from '@/lib/theme';

export default function GroceryScreen() {
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
      <GradientBackground neutral>
        <View style={{ flex: 1 }}>
          <GroceryHeader />
          <GroceryListSkeleton />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground neutral>
      <View
        style={{ flex: 1, paddingBottom: layout.tabBar.contentBottomPadding }}
      >
        <GroceryHeader />

        <View style={{ paddingHorizontal: 20, paddingBottom: spacing.md }}>
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
          <EmptyGroceryState />
        )}
      </View>
    </GradientBackground>
  );
}
