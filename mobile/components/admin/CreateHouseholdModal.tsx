import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AnimatedPressable } from '@/components';
import { useTranslation } from '@/lib/i18n';
import {
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
  spacing,
  useTheme,
} from '@/lib/theme';

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
  const { colors } = useTheme();
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
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={28} color={colors.content.secondary} />
          </Pressable>
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

        <AnimatedPressable
          onPress={onCreate}
          disabled={!householdName.trim() || isPending}
          hoverScale={1.02}
          pressScale={0.97}
          disableAnimation={!householdName.trim() || isPending}
          style={{
            backgroundColor: !householdName.trim()
              ? colors.button.disabled
              : colors.content.body,
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            marginTop: spacing.xl,
            alignItems: 'center',
          }}
        >
          {isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text
              style={{
                color: colors.white,
                fontSize: fontSize.lg,
                fontWeight: fontWeight.semibold,
              }}
            >
              {t('admin.createHousehold.button')}
            </Text>
          )}
        </AnimatedPressable>
      </View>
    </Modal>
  );
};
