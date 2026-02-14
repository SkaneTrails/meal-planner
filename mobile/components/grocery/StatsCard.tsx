import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { AnimatedPressable } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { borderRadius, fontSize, spacing } from '@/lib/theme';
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
  <View style={{ flexDirection: 'row', gap: 6 }}>
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
        backgroundColor: '#6B8E6B',
      }}
    >
      <Ionicons
        name={showAddItem ? 'close' : 'add'}
        size={18}
        color="#FFFFFF"
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
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderRadius: 10,
          backgroundColor: showClearMenu
            ? 'rgba(93, 78, 64, 0.15)'
            : 'rgba(93, 78, 64, 0.08)',
        }}
      >
        <Ionicons
          name={showClearMenu ? 'close' : 'trash-outline'}
          size={16}
          color="rgba(93, 78, 64, 0.5)"
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
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderRadius: 10,
          backgroundColor: 'rgba(93, 78, 64, 0.08)',
        }}
      >
        <Ionicons name="refresh" size={16} color="rgba(93, 78, 64, 0.5)" />
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
    <View style={{ marginTop: 14 }}>
      <View
        style={{
          height: 6,
          backgroundColor: 'rgba(107, 142, 107, 0.15)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            backgroundColor: '#6B8E6B',
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
        marginTop: 10,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(139, 115, 85, 0.15)',
        borderRadius: 8,
        gap: 6,
      }}
    >
      <Ionicons name="home-outline" size={14} color="#8B7355" />
      <Text
        style={{
          fontSize: 12,
          color: '#6B5B4B',
          flex: 1,
          fontWeight: '500',
        }}
      >
        {t('grocery.hiddenAtHome', { count: hiddenAtHomeCount })}
      </Text>
      <Ionicons name="chevron-forward" size={14} color="#5D4E40" />
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
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
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
              color: 'rgba(93, 78, 64, 0.7)',
            }}
          >
            {t('grocery.thisWeeksShopping')}
          </Text>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '600',
              color: '#3D3D3D',
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
