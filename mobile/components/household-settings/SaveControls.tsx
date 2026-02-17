import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { BottomActionBar, PrimaryButton } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { borderRadius, fontSize, spacing, useTheme } from '@/lib/theme';

export const ReadOnlyBanner = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: colors.glass.dim,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        marginBottom: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
      }}
    >
      <Ionicons name="lock-closed" size={16} color={colors.text.secondary} />
      <Text
        style={{ color: colors.text.secondary, fontSize: fontSize.sm, flex: 1 }}
      >
        {t('householdSettings.readOnly')}
      </Text>
    </View>
  );
};

export const BottomSaveBar = ({
  isSaving,
  onSave,
}: {
  isSaving: boolean;
  onSave: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <BottomActionBar>
      <PrimaryButton
        onPress={onSave}
        isPending={isSaving}
        label={t('householdSettings.saveChanges')}
        icon="checkmark"
      />
    </BottomActionBar>
  );
};
