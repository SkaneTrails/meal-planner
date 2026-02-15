import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { SectionHeader } from '@/components';
import { useTranslation } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  shadows,
  spacing,
} from '@/lib/theme';
import { EQUIPMENT_CATEGORIES } from './constants';

interface EquipmentSectionProps {
  equipment: string[];
  canEdit: boolean;
  onToggleEquipment: (key: string) => void;
}

const SelectedEquipment = ({
  equipment,
  canEdit,
  onToggle,
}: {
  equipment: string[];
  canEdit: boolean;
  onToggle: (key: string) => void;
}) => {
  const { t } = useTranslation();

  if (equipment.length === 0) return null;

  return (
    <View
      style={{
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        ...shadows.sm,
      }}
    >
      <Text
        style={{
          fontSize: fontSize.xs,
          fontWeight: fontWeight.semibold,
          color: colors.text.dark + '80',
          marginBottom: spacing.sm,
        }}
      >
        {t('householdSettings.equipment.yourEquipment', {
          count: equipment.length,
        })}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {equipment.map((item) => (
          <Pressable
            key={item}
            onPress={() => canEdit && onToggle(item)}
            disabled={!canEdit}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: pressed ? colors.errorBg : colors.bgDark,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: borderRadius.full,
              gap: 4,
            })}
          >
            <Text style={{ fontSize: fontSize.sm, color: colors.text.dark }}>
              {t(`householdSettings.equipment.items.${item}`)}
            </Text>
            {canEdit && (
              <Ionicons
                name="close-circle"
                size={14}
                color={colors.text.dark + '60'}
              />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const AvailableEquipment = ({
  equipment,
  canEdit,
  onToggle,
}: {
  equipment: string[];
  canEdit: boolean;
  onToggle: (key: string) => void;
}) => {
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.sm,
      }}
    >
      {EQUIPMENT_CATEGORIES.map(({ key, items }) => {
        const available = items.filter((item) => !equipment.includes(item));
        if (available.length === 0) return null;
        return (
          <View key={key} style={{ marginBottom: spacing.lg }}>
            <Text
              style={{
                fontSize: fontSize.xs,
                fontWeight: fontWeight.semibold,
                color: colors.text.dark + '80',
                marginBottom: spacing.sm,
                textTransform: 'uppercase',
              }}
            >
              {t(`householdSettings.equipment.categories.${key}`)}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {available.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => canEdit && onToggle(item)}
                  disabled={!canEdit}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: pressed ? colors.successBg : 'transparent',
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: borderRadius.full,
                    borderWidth: 1,
                    borderColor: colors.text.dark + '30',
                    borderStyle: 'dashed',
                    gap: 4,
                  })}
                >
                  <Ionicons
                    name="add"
                    size={14}
                    color={colors.text.dark + '80'}
                  />
                  <Text
                    style={{
                      fontSize: fontSize.sm,
                      color: colors.text.dark + '80',
                    }}
                  >
                    {t(`householdSettings.equipment.items.${item}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
};

export const EquipmentSection = ({
  equipment,
  canEdit,
  onToggleEquipment,
}: EquipmentSectionProps) => {
  const { t } = useTranslation();

  return (
    <View style={{ marginBottom: spacing['2xl'] }}>
      <SectionHeader
        icon="hardware-chip"
        title={t('householdSettings.equipment.title')}
        subtitle={t('householdSettings.equipment.subtitle')}
      />

      <SelectedEquipment
        equipment={equipment}
        canEdit={canEdit}
        onToggle={onToggleEquipment}
      />
      <AvailableEquipment
        equipment={equipment}
        canEdit={canEdit}
        onToggle={onToggleEquipment}
      />
    </View>
  );
};
