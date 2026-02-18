import { Text, View } from 'react-native';
import { Chip, ChipGroup, SurfaceCard } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';
import { EQUIPMENT_CATEGORIES } from './constants';

interface EquipmentSectionProps {
  equipment: string[];
  canEdit: boolean;
  onToggleEquipment: (key: string) => void;
}

export const SelectedEquipment = ({
  equipment,
  canEdit,
  onToggle,
}: {
  equipment: string[];
  canEdit: boolean;
  onToggle: (key: string) => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (equipment.length === 0) return null;

  return (
    <SurfaceCard radius="lg" style={{ marginBottom: spacing.md }}>
      <Text
        style={{
          fontSize: fontSize.xs,
          fontWeight: fontWeight.semibold,
          color: colors.content.strong,
          marginBottom: spacing.sm,
        }}
      >
        {t('householdSettings.equipment.yourEquipment', {
          count: equipment.length,
        })}
      </Text>
      <ChipGroup gap={spacing['xs-sm']}>
        {equipment.map((item) => (
          <Chip
            key={item}
            label={t(`householdSettings.equipment.items.${item}`)}
            variant="filled"
            disabled={!canEdit}
            onPress={() => onToggle(item)}
          />
        ))}
      </ChipGroup>
    </SurfaceCard>
  );
};

export const AvailableEquipment = ({
  equipment,
  canEdit,
  onToggle,
}: {
  equipment: string[];
  canEdit: boolean;
  onToggle: (key: string) => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <SurfaceCard radius="lg">
      {EQUIPMENT_CATEGORIES.map(({ key, items }) => {
        const available = items.filter((item) => !equipment.includes(item));
        if (available.length === 0) return null;
        return (
          <View key={key} style={{ marginBottom: spacing.lg }}>
            <Text
              style={{
                fontSize: fontSize.xs,
                fontWeight: fontWeight.semibold,
                color: colors.content.strong,
                marginBottom: spacing.sm,
                textTransform: 'uppercase',
              }}
            >
              {t(`householdSettings.equipment.categories.${key}`)}
            </Text>
            <ChipGroup gap={spacing['xs-sm']}>
              {available.map((item) => (
                <Chip
                  key={item}
                  label={t(`householdSettings.equipment.items.${item}`)}
                  variant="outline"
                  disabled={!canEdit}
                  onPress={() => onToggle(item)}
                />
              ))}
            </ChipGroup>
          </View>
        );
      })}
    </SurfaceCard>
  );
};

export const EquipmentSection = ({
  equipment,
  canEdit,
  onToggleEquipment,
}: EquipmentSectionProps) => {
  return (
    <>
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
    </>
  );
};
