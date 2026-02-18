import { View } from 'react-native';
import { Button, ButtonGroup } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { spacing } from '@/lib/theme';

interface ClearMenuProps {
  onClearMealPlanItems: () => void;
  onClearManualItems: () => void;
  onClearAll: () => void;
}

export const ClearMenu = ({
  onClearMealPlanItems,
  onClearManualItems,
  onClearAll,
}: ClearMenuProps) => {
  const { t } = useTranslation();

  return (
    <View style={{ marginTop: spacing.sm }}>
      <ButtonGroup gap={spacing.xs} style={{ flexWrap: 'wrap' }}>
        <Button
          variant="text"
          tone="subtle"
          size="sm"
          icon="calendar-outline"
          label={t('grocery.clearMealPlanItems')}
          onPress={onClearMealPlanItems}
        />
        <Button
          variant="text"
          tone="subtle"
          size="sm"
          icon="create-outline"
          label={t('grocery.clearManualItems')}
          onPress={onClearManualItems}
        />
        <Button
          variant="text"
          tone="destructive"
          size="sm"
          icon="trash-outline"
          label={t('grocery.clearEntireList')}
          onPress={onClearAll}
        />
      </ButtonGroup>
    </View>
  );
};
