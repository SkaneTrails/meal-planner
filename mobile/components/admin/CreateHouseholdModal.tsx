import { TextInput, View } from 'react-native';
import { BottomSheetModal, Button } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { fontSize, spacing, useTheme } from '@/lib/theme';

interface CreateHouseholdModalProps {
  visible: boolean;
  householdName: string;
  onHouseholdNameChange: (name: string) => void;
  onCreate: () => void;
  onClose: () => void;
  isPending: boolean;
}

export const CreateHouseholdModal = ({
  visible,
  householdName,
  onHouseholdNameChange,
  onCreate,
  onClose,
  isPending,
}: CreateHouseholdModalProps) => {
  const { colors, fonts, borderRadius, shadows } = useTheme();
  const { t } = useTranslation();

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t('admin.createHousehold.button')}
      subtitle={t('admin.createHousehold.nameLabel')}
      headerRight={
        <Button
          variant="text"
          tone="cancel"
          onPress={onClose}
          label={t('common.cancel')}
          size="lg"
        />
      }
      footer={
        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing['4xl'],
          }}
        >
          <Button
            variant="primary"
            onPress={onCreate}
            disabled={!householdName.trim()}
            isPending={isPending}
            label={t('admin.createHousehold.button')}
          />
        </View>
      }
    >
      <TextInput
        value={householdName}
        onChangeText={onHouseholdNameChange}
        placeholder={t('admin.createHousehold.namePlaceholder')}
        placeholderTextColor={colors.input.placeholder}
        style={{
          backgroundColor: colors.input.bg,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          fontSize: fontSize.lg,
          fontFamily: fonts.body,
          color: colors.input.text,
          ...shadows.sm,
        }}
        autoFocus
      />
    </BottomSheetModal>
  );
};
