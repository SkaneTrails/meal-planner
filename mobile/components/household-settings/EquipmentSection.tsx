import { useTranslation } from '@/lib/i18n';
import { spacing } from '@/lib/theme';
import { ItemChipList } from '../ItemChipList';
import type { SuggestionGroup } from '../SuggestionChipList';
import { SuggestionChipList } from '../SuggestionChipList';
import { EQUIPMENT_CATEGORIES } from './constants';

interface EquipmentProps {
  equipment: string[];
  canEdit: boolean;
  onToggle: (key: string) => void;
}

export const SelectedEquipment = ({
  equipment,
  canEdit,
  onToggle,
}: EquipmentProps) => {
  const { t } = useTranslation();

  const items = equipment.map((key) => ({
    key,
    label: t(`householdSettings.equipment.items.${key}`),
  }));

  return (
    <ItemChipList
      heading={t('householdSettings.equipment.yourEquipment', {
        count: equipment.length,
      })}
      items={items}
      onRemove={onToggle}
      disabled={!canEdit}
      gap={spacing['xs-sm']}
    />
  );
};

export const AvailableEquipment = ({
  equipment,
  canEdit,
  onToggle,
}: EquipmentProps) => {
  const { t } = useTranslation();

  const groups: SuggestionGroup[] = EQUIPMENT_CATEGORIES.map(
    ({ key, items }) => ({
      heading: t(`householdSettings.equipment.categories.${key}`),
      items: items
        .filter((item) => !equipment.includes(item))
        .map((item) => ({
          key: item,
          label: t(`householdSettings.equipment.items.${item}`),
        })),
    }),
  );

  return (
    <SuggestionChipList
      groups={groups}
      onAdd={onToggle}
      disabled={!canEdit}
      gap={spacing['xs-sm']}
    />
  );
};
