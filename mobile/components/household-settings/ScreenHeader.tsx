import { View } from 'react-native';
import { Button } from '@/components';
import { ScreenHeaderBar } from '@/components/ScreenHeaderBar';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useTranslation } from '@/lib/i18n';
import { layout, spacing, useTheme } from '@/lib/theme';

interface ScreenHeaderProps {
  canEdit: boolean;
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onBack: () => void;
}

export const ScreenHeader = ({
  canEdit,
  hasChanges,
  isSaving,
  onSave,
  onBack,
}: ScreenHeaderProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <ScreenHeaderBar>
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: layout.screenPaddingTop,
          paddingBottom: spacing.md,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Button
            variant="text"
            tone="alt"
            onPress={onBack}
            icon="chevron-back"
            iconSize={24}
            label={t('common.back')}
            style={{
              padding: spacing.sm,
              marginLeft: -spacing.sm,
            }}
          />
          {canEdit && hasChanges && (
            <Button
              variant="primary"
              onPress={onSave}
              isPending={isSaving}
              label={t('common.save')}
              style={{
                boxShadow: `0px 2px 4px 0px ${colors.accent}4D`,
              }}
            />
          )}
        </View>
        <ScreenTitle
          variant="large"
          title={t('householdSettings.title')}
          subtitle={t('householdSettings.subtitle')}
          style={{ marginTop: spacing.md }}
        />
      </View>
    </ScreenHeaderBar>
  );
};
