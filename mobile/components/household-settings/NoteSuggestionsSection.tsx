import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import {
  Chip,
  ChipGroup,
  IconCircle,
  InlineAddInput,
  SurfaceCard,
} from '@/components';
import { useTranslation } from '@/lib/i18n';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';

const DEFAULT_SUGGESTION_KEYS = [
  'office',
  'home',
  'gym',
  'dinnerOut',
  'travel',
  'party',
] as const;

interface NoteSuggestionsSectionProps {
  suggestions: string[];
  canEdit: boolean;
  onAdd: (suggestion: string) => void;
  onRemove: (suggestion: string) => void;
}

export const NoteSuggestionsSection = ({
  suggestions,
  canEdit,
  onAdd,
  onRemove,
}: NoteSuggestionsSectionProps) => {
  const { colors, borderRadius, shadows } = useTheme();
  const { t } = useTranslation();
  const [newSuggestion, setNewSuggestion] = useState('');

  const defaultSuggestions = useMemo(
    () => DEFAULT_SUGGESTION_KEYS.map((key) => t(`mealPlan.dayLabels.${key}`)),
    [t],
  );

  const handleAdd = () => {
    const trimmed = newSuggestion.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewSuggestion('');
  };

  const presetsNotAdded = defaultSuggestions.filter(
    (item) => !suggestions.includes(item),
  );

  return (
    <>
      {suggestions.length > 0 && (
        <CurrentSuggestions
          items={suggestions}
          canEdit={canEdit}
          onRemove={onRemove}
        />
      )}

      {canEdit && (
        <InlineAddInput
          value={newSuggestion}
          onChangeText={setNewSuggestion}
          onSubmit={handleAdd}
          placeholder={t('settings.addSuggestionPlaceholder')}
        />
      )}

      {canEdit && presetsNotAdded.length > 0 && (
        <PresetSuggestions items={presetsNotAdded} onAdd={onAdd} />
      )}

      {suggestions.length === 0 && <EmptyState />}
    </>
  );
};

const CurrentSuggestions = ({
  items,
  canEdit,
  onRemove,
}: {
  items: string[];
  canEdit: boolean;
  onRemove: (item: string) => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <SurfaceCard padding={spacing.md} style={{ marginBottom: spacing.md }}>
      <Text
        style={{
          fontSize: fontSize.xs,
          fontWeight: fontWeight.semibold,
          color: colors.content.icon,
          marginBottom: spacing.sm,
        }}
      >
        {t('settings.yourSuggestions', { count: items.length })}
      </Text>
      <ChipGroup>
        {items.map((item, index) => (
          <Chip
            key={item}
            label={item}
            variant="filled"
            dot={colors.tagDot[index % colors.tagDot.length]}
            disabled={!canEdit}
            onPress={() => onRemove(item)}
          />
        ))}
      </ChipGroup>
    </SurfaceCard>
  );
};

const PresetSuggestions = ({
  items,
  onAdd,
}: {
  items: string[];
  onAdd: (item: string) => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <SurfaceCard padding={spacing.md}>
      <Text
        style={{
          fontSize: fontSize.xs,
          fontWeight: fontWeight.semibold,
          color: colors.content.icon,
          marginBottom: spacing.sm,
        }}
      >
        {t('settings.suggestions')}
      </Text>
      <ChipGroup>
        {items.map((item) => (
          <Chip
            key={item}
            label={item}
            variant="outline"
            showAdd={false}
            dot={colors.surface.borderLight}
            onPress={() => onAdd(item)}
          />
        ))}
      </ChipGroup>
    </SurfaceCard>
  );
};

const EmptyState = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <SurfaceCard style={{ alignItems: 'center', marginTop: spacing.sm }}>
      <IconCircle
        size={48}
        bg={colors.bgDark}
        style={{ marginBottom: spacing.sm }}
      >
        <Ionicons
          name="document-text-outline"
          size={24}
          color={colors.content.body}
        />
      </IconCircle>
      <Text
        style={{
          fontSize: fontSize.md,
          fontWeight: fontWeight.semibold,
          color: colors.content.body,
          marginBottom: spacing['2xs'],
        }}
      >
        {t('settings.noSuggestionsYet')}
      </Text>
      <Text
        style={{
          fontSize: fontSize.sm,
          color: colors.content.icon,
          textAlign: 'center',
        }}
      >
        {t('settings.addSuggestionsHint')}
      </Text>
    </SurfaceCard>
  );
};
