import { Text, View } from 'react-native';
import type { DropdownOption } from '@/components';
import {
  ContentCard,
  DropdownPicker,
  IconButton,
  Section,
  SectionLabel,
  SettingToggleRow,
  StepperControl,
  ThemedTextInput,
} from '@/components';
import { useTranslation } from '@/lib/i18n';
import { fontSize, spacing, useTheme } from '@/lib/theme';
import type {
  DairyPreference,
  DietType,
  HouseholdSettings,
  IngredientReplacement,
} from '@/lib/types';
import { AvailableEquipment, SelectedEquipment } from './EquipmentSection';

const MAX_REPLACEMENTS = 10;
const MAX_WORDS = 3;
/** Strip characters so only Unicode letters, numbers, whitespace, underscores, and hyphens remain (roughly matching the API's allowed set). */
const ALLOWED_RE = /[^\p{L}\p{N}\s_-]/gu;

/** Sanitize ingredient text: strip banned chars, cap at MAX_WORDS words. */
const sanitizeIngredientInput = (raw: string): string => {
  const cleaned = raw.replace(ALLOWED_RE, '');
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length <= MAX_WORDS) return cleaned;
  // Keep only the first MAX_WORDS words, preserve trailing space if user just typed it
  return words.slice(0, MAX_WORDS).join(' ');
};

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
  const { borderRadius, colors } = useTheme();
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
    const sanitized =
      typeof value === 'string' ? sanitizeIngredientInput(value) : value;
    const updated = replacements.map((r, i) =>
      i === index ? { ...r, [field]: sanitized } : r,
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

  const dietTypeOptions: DropdownOption<DietType>[] = [
    {
      value: 'no_restrictions',
      label: t('householdSettings.dietary.dietNoRestrictions'),
    },
    {
      value: 'pescatarian',
      label: t('householdSettings.dietary.dietPescatarian'),
    },
    {
      value: 'vegetarian',
      label: t('householdSettings.dietary.dietVegetarian'),
    },
    {
      value: 'vegan',
      label: t('householdSettings.dietary.dietVegan'),
    },
  ];

  const dietType = dietary.diet_type ?? 'no_restrictions';
  const isVegan = dietType === 'vegan';
  const isMixedEligible =
    dietType === 'vegetarian' || dietType === 'pescatarian';

  const dairyOptions: DropdownOption<DairyPreference>[] = [
    {
      value: 'regular',
      label: t('householdSettings.dietary.dairyRegular'),
    },
    {
      value: 'lactose_free',
      label: t('householdSettings.dietary.dairyLactoseFree'),
    },
    {
      value: 'dairy_free',
      label: t('householdSettings.dietary.dairyFree'),
    },
  ];

  return (
    <>
      {/* Diet Type & Dairy */}
      <ContentCard
        label={t('householdSettings.dietary.title')}
        cardStyle={{ borderRadius: borderRadius.lg, padding: spacing['md-lg'] }}
        style={{ marginBottom: spacing.lg }}
      >
        <Section
          icon="nutrition"
          title={t('householdSettings.dietary.title')}
          spacing={0}
        />
        <SectionLabel
          text={t('householdSettings.dietary.dietType')}
          tooltip={t('householdSettings.dietary.dietTypeHelp')}
        />
        <DropdownPicker
          options={dietTypeOptions}
          value={dietary.diet_type ?? 'no_restrictions'}
          onSelect={(value) => onUpdateDietary('diet_type', value)}
          disabled={disabledByAi}
        />

        <SectionLabel text={t('householdSettings.dietary.dairy')} />
        <DropdownPicker
          options={dairyOptions}
          value={isVegan ? 'dairy_free' : dietary.dairy}
          onSelect={(value) => onUpdateDietary('dairy', value)}
          disabled={disabledByAi || isVegan}
        />

        {/* Mixed Household — only for no_restrictions */}
        {isMixedEligible && (
          <>
            <SectionLabel
              text={t('householdSettings.dietary.mixedHousehold')}
              tooltip={t('householdSettings.dietary.mixedHouseholdHelp')}
            />
            <ContentCard variant="surface">
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
                incrementDisabled={
                  disabledByAi || meatPortions >= defaultServings
                }
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
            </ContentCard>
          </>
        )}
      </ContentCard>

      {/* Ingredient Replacements */}
      <ContentCard
        label={t('householdSettings.dietary.replacements')}
        cardStyle={{ borderRadius: borderRadius.lg, padding: spacing['md-lg'] }}
        style={{ marginBottom: spacing.lg }}
      >
        <Section
          icon="swap-horizontal"
          title={t('householdSettings.dietary.replacements')}
          tooltip={t('householdSettings.dietary.replacementsHelp')}
          spacing={0}
        />

        {replacements.map((row, index) => (
          <ReplacementRow
            key={index}
            row={row}
            index={index}
            disabled={disabledByAi}
            showMeatSubstitute={
              isMixedEligible &&
              meatPortions > 0 &&
              meatPortions < defaultServings
            }
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
      </ContentCard>

      {/* Equipment */}
      <ContentCard
        label={t('householdSettings.equipment.title')}
        cardStyle={{ borderRadius: borderRadius.lg, padding: spacing['md-lg'] }}
        style={{ marginBottom: spacing.lg }}
      >
        <Section
          icon="construct"
          title={t('householdSettings.equipment.title')}
          tooltip={t('householdSettings.equipment.help')}
          spacing={0}
        />
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
      </ContentCard>
    </>
  );
};

/* ── Replacement row sub-component ──────────────────────────── */

interface ReplacementRowProps {
  row: IngredientReplacement;
  index: number;
  disabled: boolean;
  showMeatSubstitute: boolean;
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
  showMeatSubstitute,
  onUpdate,
  onRemove,
}: ReplacementRowProps) => {
  const { colors, fonts, borderRadius } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: colors.surface.subtle,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
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
      </View>

      {/* Meat substitute toggle + delete — or standalone delete when no toggle */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: showMeatSubstitute ? 'space-between' : 'flex-end',
        }}
      >
        {showMeatSubstitute && (
          <View style={{ flex: 1, minWidth: 0 }}>
            <SettingToggleRow
              label={t('householdSettings.dietary.meatSubstitute')}
              subtitle={t('householdSettings.dietary.meatSubstituteDesc')}
              value={row.meat_substitute}
              onValueChange={(v) => onUpdate(index, 'meat_substitute', v)}
              disabled={disabled}
            />
          </View>
        )}
        <IconButton
          icon="trash-outline"
          onPress={() => onRemove(index)}
          disabled={disabled}
          tone="danger"
          size="sm"
          label={t('common.remove')}
        />
      </View>
    </View>
  );
};
