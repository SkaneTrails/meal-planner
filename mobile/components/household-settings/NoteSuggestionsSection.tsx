import { useMemo, useState } from 'react';
import {
  EmptyState,
  InlineAddInput,
  ItemChipList,
  SuggestionChipList,
} from '@/components';
import { useTranslation } from '@/lib/i18n';
import { spacing, useTheme } from '@/lib/theme';

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
  const { colors } = useTheme();
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
      <ItemChipList
        heading={t('settings.yourSuggestions', { count: suggestions.length })}
        items={suggestions}
        onRemove={onRemove}
        disabled={!canEdit}
        dotColors={colors.tagDot}
      />

      {canEdit && (
        <InlineAddInput
          value={newSuggestion}
          onChangeText={setNewSuggestion}
          onSubmit={handleAdd}
          placeholder={t('settings.addSuggestionPlaceholder')}
        />
      )}

      {canEdit && presetsNotAdded.length > 0 && (
        <SuggestionChipList
          heading={t('settings.suggestions')}
          items={presetsNotAdded}
          onAdd={onAdd}
          dotColor={colors.surface.borderLight}
        />
      )}

      {suggestions.length === 0 && (
        <EmptyState
          variant="compact"
          icon="document-text-outline"
          title={t('settings.noSuggestionsYet')}
          subtitle={t('settings.addSuggestionsHint')}
          style={{ marginTop: spacing.sm }}
        />
      )}
    </>
  );
};
