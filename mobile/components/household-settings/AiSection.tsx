import { Text, View } from 'react-native';
import {
  IconButton,
  SectionLabel,
  SettingToggleRow,
  StepperControl,
  SurfaceCard,
  ThemedTextInput,
} from '@/components';
import { useTranslation } from '@/lib/i18n';
import { fontSize, spacing, useTheme } from '@/lib/theme';
import type { HouseholdSettings, IngredientReplacement } from '@/lib/types';
import { AvailableEquipment, SelectedEquipment } from './EquipmentSection';

const MAX_REPLACEMENTS = 10;

interface AiSectionProps {
  dietary: HouseholdSettings['dietary'];
  defaultServings: number;
  equipment: string[];
  canEdit: boolean;
  onUpdateDietary: <K extends keyof HouseholdSettings['dietary']>(
    key: K,
    value: HouseholdSettings['dietary'][K],
  ) => void;
  onToggleEquipment: (key: string) => void;
}

export const AiSection = ({
  dietary,
  defaultServings,
  equipment,
  canEdit,
  onUpdateDietary,
  onToggleEquipment,
}: AiSectionProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const meatPortions = Math.min(
    dietary.meat_portions ?? defaultServings,
    defaultServings,
  );

  const handleMeatPortionsChange = (delta: number) => {
    const next = Math.max(0, Math.min(defaultServings, meatPortions + delta));
    onUpdateDietary('meat_portions', next);
    if (next === 0) {
      onUpdateDietary('meat', 'none');
    } else if (next >= defaultServings) {
      onUpdateDietary('meat', 'all');
    } else {
      onUpdateDietary('meat', 'split');
    }
  };

  const replacements = dietary.ingredient_replacements ?? [];

  const updateReplacements = (updated: IngredientReplacement[]) => {
    onUpdateDietary('ingredient_replacements', updated);
  };

  const handleUpdateRow = (
    index: number,
    field: keyof IngredientReplacement,
    value: string | boolean,
  ) => {
    const updated = replacements.map((r, i) =>
      i === index ? { ...r, [field]: value } : r,
    );
    updateReplacements(updated);
  };

  const handleRemoveRow = (index: number) => {
    updateReplacements(replacements.filter((_, i) => i !== index));
  };

  const handleAddRow = () => {
    if (replacements.length >= MAX_REPLACEMENTS) return;
    updateReplacements([
      ...replacements,
      { original: '', replacement: '', meat_substitute: true },
    ]);
  };

  const disabledByAi = !canEdit;

  return (
    <>
      {/* Meat Portions Stepper */}
      <SectionLabel text={t('householdSettings.dietary.meatDishes')} />
      <SurfaceCard radius="lg" style={{ marginBottom: spacing.md }}>
        <Text
          style={{
            fontSize: fontSize.sm,
            color: colors.content.strong,
            marginBottom: spacing.md,
          }}
        >
          {t('householdSettings.dietary.meatPortionsDesc')}
        </Text>
        <StepperControl
          value={meatPortions}
          onDecrement={() => handleMeatPortionsChange(-1)}
          onIncrement={() => handleMeatPortionsChange(1)}
          decrementDisabled={disabledByAi || meatPortions <= 0}
          incrementDisabled={disabledByAi || meatPortions >= defaultServings}
          subtitle={t('householdSettings.dietary.portionsOf', {
            total: defaultServings,
          })}
        />
        {meatPortions === 0 && (
          <Text
            style={{
              fontSize: fontSize.sm,
              color: colors.content.subtitle,
              textAlign: 'center',
              marginTop: spacing.sm,
              fontStyle: 'italic',
            }}
          >
            {t('householdSettings.dietary.meatNoneHint')}
          </Text>
        )}
      </SurfaceCard>

      {/* Ingredient Replacements */}
      <SectionLabel text={t('householdSettings.dietary.replacements')} />
      <SurfaceCard radius="lg" style={{ marginBottom: spacing.lg }}>
        <Text
          style={{
            fontSize: fontSize.sm,
            color: colors.content.subtitle,
            marginBottom: spacing.md,
          }}
        >
          {t('householdSettings.dietary.replacementsDesc')}
        </Text>

        {replacements.map((row, index) => (
          <ReplacementRow
            key={index}
            row={row}
            index={index}
            disabled={disabledByAi}
            onUpdate={handleUpdateRow}
            onRemove={handleRemoveRow}
          />
        ))}

        {replacements.length < MAX_REPLACEMENTS && (
          <IconButton
            icon="add"
            onPress={handleAddRow}
            disabled={disabledByAi}
            tone="alt"
            size={26}
            iconSize={16}
            label={t('householdSettings.dietary.addReplacement')}
          />
        )}

        {replacements.length >= MAX_REPLACEMENTS && (
          <Text
            style={{
              fontSize: fontSize.xs,
              color: colors.content.subtitle,
              fontStyle: 'italic',
              textAlign: 'center',
            }}
          >
            {t('householdSettings.dietary.maxReplacements', {
              max: MAX_REPLACEMENTS,
            })}
          </Text>
        )}
      </SurfaceCard>

      {/* Equipment */}
      <SectionLabel text={t('householdSettings.equipment.title')} />
      <SelectedEquipment
        equipment={equipment}
        canEdit={!disabledByAi}
        onToggle={onToggleEquipment}
      />
      <AvailableEquipment
        equipment={equipment}
        canEdit={!disabledByAi}
        onToggle={onToggleEquipment}
      />
    </>
  );
};

/* ── Replacement row sub-component ──────────────────────────── */

interface ReplacementRowProps {
  row: IngredientReplacement;
  index: number;
  disabled: boolean;
  onUpdate: (
    index: number,
    field: keyof IngredientReplacement,
    value: string | boolean,
  ) => void;
  onRemove: (index: number) => void;
}

const ReplacementRow = ({
  row,
  index,
  disabled,
  onUpdate,
  onRemove,
}: ReplacementRowProps) => {
  const { colors, fonts } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{
        marginBottom: spacing.md,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {/* Original → Replacement inputs */}
      <View
        style={{
          flexDirection: 'row',
          gap: spacing.sm,
          alignItems: 'center',
          marginBottom: spacing.sm,
        }}
      >
        <ThemedTextInput
          value={row.original}
          onChangeText={(v) => onUpdate(index, 'original', v)}
          disabled={disabled}
          placeholder={t('householdSettings.dietary.originalPlaceholder')}
          maxLength={30}
          testID={`replacement-original-${index}`}
        />
        <Text
          style={{
            color: colors.content.subtitle,
            fontSize: fontSize.md,
            fontFamily: fonts.body,
          }}
        >
          →
        </Text>
        <ThemedTextInput
          value={row.replacement}
          onChangeText={(v) => onUpdate(index, 'replacement', v)}
          disabled={disabled}
          placeholder={t('householdSettings.dietary.replacementPlaceholder')}
          maxLength={30}
          testID={`replacement-replacement-${index}`}
        />
        <IconButton
          icon="trash-outline"
          onPress={() => onRemove(index)}
          disabled={disabled}
          tone="danger"
          size="sm"
          label={t('common.remove')}
        />
      </View>

      {/* Meat substitute toggle */}
      <SettingToggleRow
        label={t('householdSettings.dietary.meatSubstitute')}
        subtitle={t('householdSettings.dietary.meatSubstituteDesc')}
        value={row.meat_substitute}
        onValueChange={(v) => onUpdate(index, 'meat_substitute', v)}
        disabled={disabled}
      />
    </View>
  );
};
