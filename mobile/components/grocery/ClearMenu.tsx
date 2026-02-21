import { View } from 'react-native';
import { Button, ButtonGroup } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { spacing } from '@/lib/theme';

interface ClearMenuProps {
  onClearChecked: () => void;
  onClearMealPlanItems: () => void;
  onClearManualItems: () => void;
  onClearAll: () => void;
  checkedCount: number;
}

export const ClearMenu = ({
  onClearChecked,
  onClearMealPlanItems,
  onClearManualItems,
  onClearAll,
  checkedCount,
}: ClearMenuProps) => {
  const { t } = useTranslation();

  return (
    <View style={{ marginTop: spacing.sm }}>
      <ButtonGroup gap={spacing.xs} style={{ flexWrap: 'wrap' }}>
        {checkedCount > 0 && (
          <Button
            variant="text"
            tone="warning"
            size="sm"
            icon="refresh"
            label={t('grocery.clearChecked')}
            onPress={onClearChecked}
          />
        )}
        <Button
          variant="text"
          tone="warning"
          size="sm"
          icon="calendar-outline"
          label={t('grocery.clearMealPlanItems')}
          onPress={onClearMealPlanItems}
        />
        <Button
          variant="text"
          tone="warning"
          size="sm"
          icon="create-outline"
          label={t('grocery.clearManualItems')}
          onPress={onClearManualItems}
        />
        <Button
          variant="text"
          tone="warning"
          size="sm"
          icon="trash-outline"
          label={t('grocery.clearEntireList')}
          onPress={onClearAll}
        />
      </ButtonGroup>
    </View>
  );
};
