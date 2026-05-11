import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { AnimatedPressable, ButtonGroup, IconButton } from '@/components';
import { ThemeIcon } from '@/components/ThemeIcon';
import { useCurrentUser } from '@/lib/hooks/use-admin';
import { useTranslation } from '@/lib/i18n';
import { fontSize, fontWeight, iconSize, spacing, useTheme } from '@/lib/theme';
import { ClearMenu } from './ClearMenu';

interface ActionButtonsProps {
  showAddItem: boolean;
  deleteMode: boolean;
  reorderMode: boolean;
  totalItems: number;
  onToggleAddItem: () => void;
  onToggleDeleteMode: () => void;
  onToggleReorderMode: () => void;
}

const ActionButtons = ({
  showAddItem,
  deleteMode,
  reorderMode,
  totalItems,
  onToggleAddItem,
  onToggleDeleteMode,
  onToggleReorderMode,
}: ActionButtonsProps) => {
  // Active state uses tone='default' (petrol primary) — previously 'ai'
  // (coral) which is reserved for AI features. Inactive uses
  // 'glassSolid' so the buttons feel like real chips, not the
  // near-invisible 4%-ink wash that 'subtle' produced.
  return (
    <ButtonGroup gap={spacing['xs-sm']}>
      {showAddItem ? (
        <IconButton
          icon="close"
          size="md"
          iconSize={iconSize.md}
          onPress={onToggleAddItem}
          label="Close"
          tone="default"
          hoverScale={1.08}
          pressScale={0.95}
        />
      ) : (
        <IconButton
          icon="add"
          size="md"
          iconSize={iconSize.md}
          onPress={onToggleAddItem}
          label="Add"
          tone="glassSolid"
          hoverScale={1.08}
          pressScale={0.95}
        />
      )}
      {totalItems > 1 && (
        <IconButton
          icon={reorderMode ? 'checkmark' : 'swap-vertical'}
          size="md"
          iconSize={iconSize.md}
          onPress={onToggleReorderMode}
          label={reorderMode ? 'Done' : 'Sort'}
          tone={reorderMode ? 'default' : 'glassSolid'}
          hoverScale={1.08}
          pressScale={0.95}
        />
      )}
      {totalItems > 0 && (
        <IconButton
          icon={deleteMode ? 'close' : 'trash-outline'}
          size="md"
          iconSize={iconSize.md}
          onPress={onToggleDeleteMode}
          label={deleteMode ? 'Done' : 'Delete'}
          tone={deleteMode ? 'default' : 'glassSolid'}
          hoverScale={1.08}
          pressScale={0.95}
        />
      )}
    </ButtonGroup>
  );
};

interface ProgressBarProps {
  itemsToBuy: number;
  checkedItemsToBuy: number;
}

const ProgressBar = ({ itemsToBuy, checkedItemsToBuy }: ProgressBarProps) => {
  const { colors, borderRadius } = useTheme();
  if (itemsToBuy <= 0) return null;

  return (
    <View
      style={{
        height: spacing['xs-sm'],
        backgroundColor: colors.ai.light,
        borderRadius: borderRadius['3xs'],
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height: '100%',
          backgroundColor: colors.ai.primary,
          borderRadius: borderRadius['3xs'],
          width: `${(checkedItemsToBuy / itemsToBuy) * 100}%`,
        }}
      />
    </View>
  );
};

interface ItemsAtHomeIndicatorProps {
  hiddenAtHomeCount: number;
}

const ItemsAtHomeIndicator = ({
  hiddenAtHomeCount,
}: ItemsAtHomeIndicatorProps) => {
  const { colors, fonts, borderRadius } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const householdId = currentUser?.household_id;

  if (hiddenAtHomeCount <= 0) return null;

  const onPress = () => {
    if (householdId) {
      router.push(`/household-settings?id=${householdId}&section=pantry`);
    } else {
      router.push('/settings');
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      hoverScale={1.02}
      pressScale={0.98}
      accessibilityRole="button"
      accessibilityLabel={t('grocery.hiddenAtHome', {
        count: hiddenAtHomeCount,
      })}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing['sm-md'],
        paddingVertical: spacing['xs-sm'],
        paddingHorizontal: spacing['sm-md'],
        backgroundColor: colors.surface.subtle,
        borderRadius: borderRadius.sm,
        gap: spacing['xs-sm'],
      }}
    >
      <ThemeIcon
        name="home-outline"
        size={iconSize.xs}
        color={colors.content.subtitle}
      />
      <Text
        style={{
          fontSize: fontSize.base,
          fontFamily: fonts.bodyMedium,
          color: colors.content.body,
          flex: 1,
          fontWeight: fontWeight.medium,
        }}
      >
        {t('grocery.hiddenAtHome', { count: hiddenAtHomeCount })}
      </Text>
      <ThemeIcon
        name="chevron-forward"
        size={iconSize.xs}
        color={colors.content.subtitle}
      />
    </AnimatedPressable>
  );
};

interface StatsCardProps {
  itemsToBuy: number;
  checkedItemsToBuy: number;
  totalItems: number;
  hiddenAtHomeCount: number;
  showAddItem: boolean;
  deleteMode: boolean;
  reorderMode: boolean;
  deleteSelection: Set<string>;
  mealPlanItemNames: string[];
  manualItemNames: string[];
  onToggleAddItem: () => void;
  onToggleDeleteMode: () => void;
  onToggleReorderMode: () => void;
  onSelectionChange: (selection: Set<string>) => void;
  onDeleteSelected: () => void;
}

export const StatsCard = ({
  itemsToBuy,
  checkedItemsToBuy,
  totalItems,
  hiddenAtHomeCount,
  showAddItem,
  deleteMode,
  reorderMode,
  deleteSelection,
  mealPlanItemNames,
  manualItemNames,
  onToggleAddItem,
  onToggleDeleteMode,
  onToggleReorderMode,
  onSelectionChange,
  onDeleteSelected,
}: StatsCardProps) => {
  const { colors, fonts, visibility } = useTheme();
  const { t } = useTranslation();

  // Compact toolbar layout: in default mode the action buttons sit
  // inline with the progress bar (or a compact count when the theme
  // hides the bar) so the row has no dead space; in delete/reorder
  // mode the slot shows a contextual label explaining the mode.
  const showProgress =
    !deleteMode && !reorderMode && itemsToBuy > 0 && visibility.showProgressBar;
  const showCount =
    !deleteMode &&
    !reorderMode &&
    itemsToBuy > 0 &&
    !visibility.showProgressBar;
  const modeLabel = deleteMode
    ? t('grocery.itemsSelected', { count: deleteSelection.size })
    : reorderMode
      ? t('grocery.dragToReorder')
      : showCount
        ? t('grocery.itemsProgress', {
            checked: checkedItemsToBuy,
            total: itemsToBuy,
          })
        : '';

  return (
    <View style={{ marginBottom: spacing.sm }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          {showProgress ? (
            <ProgressBar
              itemsToBuy={itemsToBuy}
              checkedItemsToBuy={checkedItemsToBuy}
            />
          ) : modeLabel ? (
            <Text
              style={{
                fontFamily: fonts.bodyMedium,
                fontSize: fontSize.base,
                color: colors.content.subtitle,
              }}
              numberOfLines={1}
            >
              {modeLabel}
            </Text>
          ) : null}
        </View>
        <ActionButtons
          showAddItem={showAddItem}
          deleteMode={deleteMode}
          reorderMode={reorderMode}
          totalItems={totalItems}
          onToggleAddItem={onToggleAddItem}
          onToggleDeleteMode={onToggleDeleteMode}
          onToggleReorderMode={onToggleReorderMode}
        />
      </View>

      {deleteMode && (
        <ClearMenu
          deleteSelection={deleteSelection}
          mealPlanItemNames={mealPlanItemNames}
          manualItemNames={manualItemNames}
          onSelectionChange={onSelectionChange}
          onDeleteSelected={onDeleteSelected}
        />
      )}

      <ItemsAtHomeIndicator hiddenAtHomeCount={hiddenAtHomeCount} />
    </View>
  );
};
