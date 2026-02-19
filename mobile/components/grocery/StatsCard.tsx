import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import {
  AnimatedPressable,
  Button,
  ButtonGroup,
  TerminalFrame,
} from '@/components';
import { useTranslation } from '@/lib/i18n';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';
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
}: ActionButtonsProps) => {
  const { colors } = useTheme();
  return (
    <ButtonGroup gap={spacing['xs-sm']}>
      <Button
        variant="icon"
        tone="ai"
        icon={showAddItem ? 'close' : 'add'}
        iconSize={18}
        onPress={onToggleAddItem}
        label={showAddItem ? 'Close' : 'Add'}
        color={colors.ai.primary}
        textColor={colors.white}
        hoverScale={1.08}
        pressScale={0.95}
      />
      {totalItems > 0 && (
        <Button
          variant="icon"
          tone="subtle"
          icon={showClearMenu ? 'close' : 'trash-outline'}
          iconSize={16}
          onPress={onToggleClearMenu}
          label={showClearMenu ? 'Close' : 'Clear'}
          color={showClearMenu ? colors.surface.pressed : colors.surface.hover}
          textColor={colors.content.icon}
          hoverScale={1.08}
          pressScale={0.95}
        />
      )}
      {checkedCount > 0 && (
        <Button
          variant="icon"
          tone="subtle"
          icon="refresh"
          iconSize={16}
          onPress={onClearChecked}
          label="Reset"
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
    <View style={{ marginTop: spacing['md-lg'] }}>
      <View
        style={{
          height: 6,
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
          fontSize: fontSize.base,
          fontFamily: fonts.bodyMedium,
          color: colors.button.primaryPressed,
          flex: 1,
          fontWeight: fontWeight.medium,
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
  const { colors, fonts, borderRadius, shadows, visibility, crt } = useTheme();
  const { t } = useTranslation();

  const content = (
    <View
      style={
        crt
          ? {}
          : {
              backgroundColor: colors.white,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              marginBottom: spacing.sm,
              ...shadows.card,
            }
      }
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
              fontFamily: fonts.body,
              color: colors.content.tertiary,
            }}
          >
            {t('grocery.thisWeeksShopping')}
          </Text>
          <Text
            style={{
              fontSize: fontSize['xl-2xl'],
              fontFamily: fonts.bodySemibold,
              fontWeight: fontWeight.semibold,
              color: colors.content.heading,
              marginTop: spacing.xs,
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

      {visibility.showProgressBar && (
        <ProgressBar
          itemsToBuy={itemsToBuy}
          checkedItemsToBuy={checkedItemsToBuy}
        />
      )}

      <ItemsAtHomeIndicator hiddenAtHomeCount={hiddenAtHomeCount} />
    </View>
  );

  if (crt) {
    const progressLabel =
      itemsToBuy > 0 ? `${checkedItemsToBuy}/${itemsToBuy}` : undefined;
    return (
      <View style={{ marginBottom: spacing.sm }}>
        <TerminalFrame
          label={t('grocery.title').toUpperCase()}
          rightSegments={progressLabel ? [{ label: progressLabel }] : undefined}
          variant="double"
        >
          {content}
        </TerminalFrame>
      </View>
    );
  }

  return content;
};
