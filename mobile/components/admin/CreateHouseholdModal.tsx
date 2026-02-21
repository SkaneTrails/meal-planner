import { Modal, Text, TextInput, View } from 'react-native';
import { Button } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';

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
  const { colors, borderRadius, shadows } = useTheme();
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bgLight,
          padding: spacing.lg,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: fontSize['2xl'],
              fontWeight: fontWeight.bold,
              color: colors.content.heading,
            }}
          >
            {t('admin.createHousehold.button')}
          </Text>
          <Button
            variant="icon"
            tone="cancel"
            onPress={onClose}
            icon="close"
            iconSize={28}
          />
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Text
            style={{
              fontSize: fontSize.md,
              fontWeight: fontWeight.semibold,
              color: colors.content.heading,
              marginBottom: spacing.sm,
            }}
          >
            {t('admin.createHousehold.nameLabel')}
          </Text>
          <TextInput
            value={householdName}
            onChangeText={onHouseholdNameChange}
            placeholder={t('admin.createHousehold.namePlaceholder')}
            placeholderTextColor={colors.content.placeholderHex}
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              fontSize: fontSize.lg,
              color: colors.content.heading,
              ...shadows.sm,
            }}
            autoFocus
          />
        </View>

        <Button
          variant="primary"
          onPress={onCreate}
          disabled={!householdName.trim()}
          isPending={isPending}
          label={t('admin.createHousehold.button')}
          style={{
            marginTop: spacing.xl,
          }}
        />
      </View>
    </Modal>
  );
};
