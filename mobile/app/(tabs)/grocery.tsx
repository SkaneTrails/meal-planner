/**
 * Grocery screen - Shopping list from meal plan.
 */

import { View } from 'react-native';
import {
  GroceryListSkeleton,
  GroceryListView,
  ScreenHeader,
  ScreenLayout,
} from '@/components';
import {
  AddItemCard,
  EmptyGroceryState,
  GroceryHeader,
  StatsCard,
  StoreChips,
} from '@/components/grocery';
import { useGroceryScreen } from '@/lib/hooks/useGroceryScreen';
import { useTranslation } from '@/lib/i18n';
import { useSettings } from '@/lib/settings-context';
import { spacing } from '@/lib/theme';

export default function GroceryScreen() {
  const { t } = useTranslation();
  const { groceryStores, activeStoreId, setActiveStoreId } = useSettings();
  const {
    isLoading,
    hasLoadedOnce,
    showAddItem,
    setShowAddItem,
    deleteMode,
    reorderMode,
    newItemText,
    setNewItemText,
    totalItems,
    checkedCount,
    hiddenAtHomeCount,
    itemsToBuy,
    checkedItemsToBuy,
    uncheckedItems,
    pickedItems,
    handleItemToggle,
    handleAddItem,
    handleDeleteItem,
    handleToggleAddItem,
    handleToggleDeleteMode,
    handleToggleReorderMode,
    handleReorder,
    handleClearChecked,
    handleClearAll,
    handleClearMealPlanItems,
    handleClearManualItems,
    filterOutItemsAtHome,
  } = useGroceryScreen();

  if (isLoading && !hasLoadedOnce) {
    return (
      <ScreenLayout>
        <GroceryHeader />
        <GroceryListSkeleton />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <ScreenHeader title={t('grocery.thisWeeksShopping')}>
        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.md,
          }}
        >
          <StoreChips
            stores={groceryStores}
            activeStoreId={activeStoreId}
            onSelect={setActiveStoreId}
          />
          <StatsCard
            itemsToBuy={itemsToBuy}
            checkedItemsToBuy={checkedItemsToBuy}
            totalItems={totalItems}
            checkedCount={checkedCount}
            hiddenAtHomeCount={hiddenAtHomeCount}
            showAddItem={showAddItem}
            deleteMode={deleteMode}
            reorderMode={reorderMode}
            onToggleAddItem={handleToggleAddItem}
            onToggleDeleteMode={handleToggleDeleteMode}
            onToggleReorderMode={handleToggleReorderMode}
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
              onDismiss={() => setShowAddItem(false)}
            />
          )}
        </View>
      </ScreenHeader>

      {totalItems > 0 ? (
        <GroceryListView
          uncheckedItems={uncheckedItems}
          pickedItems={pickedItems}
          deleteMode={deleteMode}
          reorderMode={reorderMode}
          onItemToggle={handleItemToggle}
          onDeleteItem={handleDeleteItem}
          filterOutItems={filterOutItemsAtHome}
          onReorder={handleReorder}
        />
      ) : (
        <EmptyGroceryState
          title={t('grocery.emptyList')}
          subtitle={t('grocery.goToMealPlan')}
        />
      )}
    </ScreenLayout>
  );
}
