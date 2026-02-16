import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { AnimatedPressable } from '@/components';
import { useTranslation } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  spacing,
} from '@/lib/theme';
import { ClearMenu } from './ClearMenu';

interface ActionButtonsProps {
  showAddItem: boolean;
  showClearMenu: boolean;
  totalItems: number;
  checkedCount: number;
  onToggleAddItem: () => void;
  onToggleClearMenu: () => void;
  onClearChecked: () => void;
}

const ActionButtons = ({
  showAddItem,
  showClearMenu,
  totalItems,
  checkedCount,
  onToggleAddItem,
  onToggleClearMenu,
  onClearChecked,
}: ActionButtonsProps) => (
  <View style={{ flexDirection: 'row', gap: spacing['xs-sm'] }}>
    <AnimatedPressable
      onPress={onToggleAddItem}
      hoverScale={1.08}
      pressScale={0.95}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: colors.ai.primary,
      }}
    >
      <Ionicons
        name={showAddItem ? 'close' : 'add'}
        size={18}
        color={colors.white}
      />
    </AnimatedPressable>

    {totalItems > 0 && (
      <AnimatedPressable
        onPress={onToggleClearMenu}
        hoverScale={1.08}
        pressScale={0.95}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing['sm-md'],
          paddingVertical: 8,
          borderRadius: 10,
          backgroundColor: showClearMenu
            ? colors.surface.pressed
            : colors.surface.hover,
        }}
      >
        <Ionicons
          name={showClearMenu ? 'close' : 'trash-outline'}
          size={16}
          color={colors.content.icon}
        />
      </AnimatedPressable>
    )}

    {checkedCount > 0 && (
      <AnimatedPressable
        onPress={onClearChecked}
        hoverScale={1.08}
        pressScale={0.95}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing['sm-md'],
          paddingVertical: 8,
          borderRadius: 10,
          backgroundColor: colors.surface.hover,
        }}
      >
        <Ionicons name="refresh" size={16} color={colors.content.icon} />
      </AnimatedPressable>
    )}
  </View>
);

interface ProgressBarProps {
  itemsToBuy: number;
  checkedItemsToBuy: number;
}

const ProgressBar = ({ itemsToBuy, checkedItemsToBuy }: ProgressBarProps) => {
  if (itemsToBuy <= 0) return null;

  return (
    <View style={{ marginTop: spacing['md-lg'] }}>
      <View
        style={{
          height: 6,
          backgroundColor: colors.ai.light,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            backgroundColor: colors.ai.primary,
            borderRadius: 3,
            width: `${(checkedItemsToBuy / itemsToBuy) * 100}%`,
          }}
        />
      </View>
    </View>
  );
};

interface ItemsAtHomeIndicatorProps {
  hiddenAtHomeCount: number;
}

const ItemsAtHomeIndicator = ({
  hiddenAtHomeCount,
}: ItemsAtHomeIndicatorProps) => {
  const router = useRouter();
  const { t } = useTranslation();

  if (hiddenAtHomeCount <= 0) return null;

  return (
    <AnimatedPressable
      onPress={() => router.push('/settings')}
      hoverScale={1.02}
      pressScale={0.98}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing['sm-md'],
        paddingVertical: spacing['xs-sm'],
        paddingHorizontal: spacing['sm-md'],
        backgroundColor: colors.chip.divider,
        borderRadius: borderRadius.xs,
        gap: spacing['xs-sm'],
      }}
    >
      <Ionicons
        name="home-outline"
        size={14}
        color={colors.content.secondary}
      />
      <Text
        style={{
          fontSize: 12,
          color: colors.button.primaryPressed,
          flex: 1,
          fontWeight: '500',
        }}
      >
        {t('grocery.hiddenAtHome', { count: hiddenAtHomeCount })}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={colors.content.body} />
    </AnimatedPressable>
  );
};

interface StatsCardProps {
  itemsToBuy: number;
  checkedItemsToBuy: number;
  totalItems: number;
  checkedCount: number;
  hiddenAtHomeCount: number;
  showAddItem: boolean;
  showClearMenu: boolean;
  onToggleAddItem: () => void;
  onToggleClearMenu: () => void;
  onClearChecked: () => void;
  onClearMealPlanItems: () => void;
  onClearManualItems: () => void;
  onClearAll: () => void;
}

export const StatsCard = ({
  itemsToBuy,
  checkedItemsToBuy,
  totalItems,
  checkedCount,
  hiddenAtHomeCount,
  showAddItem,
  showClearMenu,
  onToggleAddItem,
  onToggleClearMenu,
  onClearChecked,
  onClearMealPlanItems,
  onClearManualItems,
  onClearAll,
}: StatsCardProps) => {
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        boxShadow: '1px 1px 4px 0px rgba(0, 0, 0, 0.06)',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: fontSize.sm,
              color: colors.content.tertiary,
            }}
          >
            {t('grocery.thisWeeksShopping')}
          </Text>
          <Text
            style={{
              fontSize: 17,
              fontWeight: fontWeight.semibold,
              color: colors.content.heading,
              marginTop: 4,
            }}
          >
            {itemsToBuy === 0
              ? t('grocery.noItemsYet')
              : t('grocery.itemsProgress', {
                  checked: checkedItemsToBuy,
                  total: itemsToBuy,
                })}
          </Text>
        </View>

        <ActionButtons
          showAddItem={showAddItem}
          showClearMenu={showClearMenu}
          totalItems={totalItems}
          checkedCount={checkedCount}
          onToggleAddItem={onToggleAddItem}
          onToggleClearMenu={onToggleClearMenu}
          onClearChecked={onClearChecked}
        />
      </View>

      {showClearMenu && (
        <ClearMenu
          onClearMealPlanItems={onClearMealPlanItems}
          onClearManualItems={onClearManualItems}
          onClearAll={onClearAll}
        />
      )}

      <ProgressBar
        itemsToBuy={itemsToBuy}
        checkedItemsToBuy={checkedItemsToBuy}
      />

      <ItemsAtHomeIndicator hiddenAtHomeCount={hiddenAtHomeCount} />
    </View>
  );
};
