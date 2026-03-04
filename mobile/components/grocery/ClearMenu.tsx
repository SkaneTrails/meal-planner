import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { ActionButton, ButtonGroup, Chip } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { spacing } from '@/lib/theme';

interface ClearMenuProps {
  deleteSelection: Set<string>;
  mealPlanItemNames: string[];
  manualItemNames: string[];
  onSelectionChange: (selection: Set<string>) => void;
  onDeleteSelected: () => void;
}

export const ClearMenu = ({
  deleteSelection,
  mealPlanItemNames,
  manualItemNames,
  onSelectionChange,
  onDeleteSelected,
}: ClearMenuProps) => {
  const { t } = useTranslation();

  const mealPlanSelected = useMemo(
    () =>
      mealPlanItemNames.length > 0 &&
      mealPlanItemNames.every((name) => deleteSelection.has(name)),
    [mealPlanItemNames, deleteSelection],
  );

  const manualSelected = useMemo(
    () =>
      manualItemNames.length > 0 &&
      manualItemNames.every((name) => deleteSelection.has(name)),
    [manualItemNames, deleteSelection],
  );

  const allItemNames = useMemo(
    () => [...mealPlanItemNames, ...manualItemNames],
    [mealPlanItemNames, manualItemNames],
  );

  const allSelected =
    allItemNames.length > 0 &&
    allItemNames.every((name) => deleteSelection.has(name));

  const toggleCategory = useCallback(
    (itemNames: string[], selected: boolean) => {
      const next = new Set(deleteSelection);
      if (selected) {
        for (const name of itemNames) next.delete(name);
      } else {
        for (const name of itemNames) next.add(name);
      }
      onSelectionChange(next);
    },
    [deleteSelection, onSelectionChange],
  );

  const toggleAll = useCallback(() => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(allItemNames));
    }
  }, [allSelected, allItemNames, onSelectionChange]);

  const hasMealPlanItems = mealPlanItemNames.length > 0;
  const hasManualItems = manualItemNames.length > 0;
  const showAllChip = hasMealPlanItems && hasManualItems;

  return (
    <View style={{ marginTop: spacing.sm }}>
      <ButtonGroup gap={spacing.xs} style={{ flexWrap: 'wrap' }}>
        {showAllChip && (
          <Chip
            variant="toggle"
            label={t('grocery.selectAll')}
            active={allSelected}
            onPress={toggleAll}
            testID="select-all"
          />
        )}
        {hasMealPlanItems && (
          <Chip
            variant="toggle"
            icon="calendar-outline"
            label={t('grocery.selectMealPlanItems')}
            active={mealPlanSelected}
            onPress={() => toggleCategory(mealPlanItemNames, mealPlanSelected)}
            testID="select-mealplan"
          />
        )}
        {hasManualItems && (
          <Chip
            variant="toggle"
            icon="create-outline"
            label={t('grocery.selectManualItems')}
            active={manualSelected}
            onPress={() => toggleCategory(manualItemNames, manualSelected)}
            testID="select-manual"
          />
        )}
        {deleteSelection.size > 0 && (
          <ActionButton.Delete
            size="sm"
            label={t('grocery.deleteSelected')}
            onPress={onDeleteSelected}
            testID="delete-selected"
          />
        )}
      </ButtonGroup>
    </View>
  );
};
