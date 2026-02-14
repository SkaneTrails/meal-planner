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
  colors,
  fontSize,
  fontWeight,
  shadows,
  spacing,
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
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.bgLight, padding: spacing.lg }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text
            style={{ fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: '#3D3D3D' }}
          >
            {t('admin.createHousehold.button')}
          </Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={28} color="#8B7355" />
          </Pressable>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Text
            style={{
              fontSize: fontSize.md,
              fontWeight: fontWeight.semibold,
              color: '#3D3D3D',
              marginBottom: spacing.sm,
            }}
          >
            {t('admin.createHousehold.nameLabel')}
          </Text>
          <TextInput
            value={householdName}
            onChangeText={onHouseholdNameChange}
            placeholder={t('admin.createHousehold.namePlaceholder')}
            placeholderTextColor="#8B735580"
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              fontSize: fontSize.lg,
              color: '#3D3D3D',
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
            backgroundColor: !householdName.trim() ? '#C5B8A8' : '#5D4E40',
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            marginTop: spacing.xl,
            alignItems: 'center',
          }}
        >
          {isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              style={{ color: 'white', fontSize: fontSize.lg, fontWeight: fontWeight.semibold }}
            >
              {t('admin.createHousehold.button')}
            </Text>
          )}
        </AnimatedPressable>
      </View>
    </Modal>
  );
};
