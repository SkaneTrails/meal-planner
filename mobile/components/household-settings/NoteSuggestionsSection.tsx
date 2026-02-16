import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  shadows,
  spacing,
} from '@/lib/theme';

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
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.glass.card,
            borderRadius: borderRadius.md,
            padding: 4,
            marginBottom: spacing.md,
            ...shadows.sm,
          }}
        >
          <TextInput
            style={{
              flex: 1,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              fontSize: fontSize.md,
              color: colors.text.dark,
            }}
            placeholder={t('settings.addSuggestionPlaceholder')}
            placeholderTextColor={`${colors.text.dark}60`}
            value={newSuggestion}
            onChangeText={setNewSuggestion}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <Pressable
            onPress={handleAdd}
            disabled={!newSuggestion.trim()}
            style={({ pressed }) => ({
              backgroundColor: newSuggestion.trim()
                ? colors.primary
                : colors.bgDark,
              borderRadius: borderRadius.sm,
              padding: spacing.sm,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Ionicons
              name="add"
              size={20}
              color={
                newSuggestion.trim() ? colors.white : `${colors.text.inverse}60`
              }
            />
          </Pressable>
        </View>
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
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
      }}
    >
      <Text
        style={{
          fontSize: fontSize.xs,
          fontWeight: fontWeight.semibold,
          color: `${colors.text.dark}80`,
          marginBottom: spacing.sm,
        }}
      >
        {t('settings.yourSuggestions', { count: items.length })}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {items.map((item) => (
          <Pressable
            key={item}
            onPress={() => canEdit && onRemove(item)}
            disabled={!canEdit}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor:
                pressed && canEdit ? colors.errorBg : colors.bgDark,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: borderRadius.full,
              gap: 6,
            })}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor:
                  colors.tagDot[items.indexOf(item) % colors.tagDot.length],
              }}
            />
            <Text
              style={{
                fontSize: fontSize.sm,
                color: colors.text.dark,
              }}
            >
              {item}
            </Text>
            {canEdit && (
              <Ionicons
                name="close-circle"
                size={14}
                color={`${colors.text.dark}60`}
              />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const PresetSuggestions = ({
  items,
  onAdd,
}: {
  items: string[];
  onAdd: (item: string) => void;
}) => {
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        ...shadows.sm,
      }}
    >
      <Text
        style={{
          fontSize: fontSize.xs,
          fontWeight: fontWeight.semibold,
          color: `${colors.text.dark}80`,
          marginBottom: spacing.sm,
        }}
      >
        {t('settings.suggestions')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {items.map((item) => (
          <Pressable
            key={item}
            onPress={() => onAdd(item)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: pressed ? colors.successBg : 'transparent',
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: borderRadius.full,
              borderWidth: 1,
              borderColor: `${colors.text.dark}30`,
              borderStyle: 'dashed',
              gap: 6,
            })}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: `${colors.text.dark}40`,
              }}
            />
            <Text
              style={{
                fontSize: fontSize.sm,
                color: `${colors.text.dark}80`,
              }}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const EmptyState = () => {
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        alignItems: 'center',
        marginTop: spacing.sm,
        ...shadows.sm,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.bgDark,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.sm,
        }}
      >
        <Ionicons
          name="document-text-outline"
          size={24}
          color={colors.text.dark}
        />
      </View>
      <Text
        style={{
          fontSize: fontSize.md,
          fontWeight: fontWeight.semibold,
          color: colors.text.dark,
          marginBottom: 2,
        }}
      >
        {t('settings.noSuggestionsYet')}
      </Text>
      <Text
        style={{
          fontSize: fontSize.sm,
          color: `${colors.text.dark}80`,
          textAlign: 'center',
        }}
      >
        {t('settings.addSuggestionsHint')}
      </Text>
    </View>
  );
};
