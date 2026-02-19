import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button, ButtonGroup, Chip, ChipGroup } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { fontSize, iconSize, spacing, useTheme } from '@/lib/theme';
import { formatDayHeader } from '@/lib/utils/dateFormatter';

interface DayHeaderProps {
  date: Date;
  isToday: boolean;
  language: string;
  t: TFunction;
  note: string | null;
  isEditing: boolean;
  noteText: string;
  noteSuggestions: string[];
  onNoteTextChange: (text: string) => void;
  onStartEdit: () => void;
  onSaveNote: () => void;
  onCancelEdit: () => void;
  onToggleTag: (tag: string) => void;
  onCollapse?: () => void;
}

export const DayHeader = ({
  date,
  isToday,
  language,
  t,
  note,
  isEditing,
  noteText,
  noteSuggestions,
  onNoteTextChange,
  onStartEdit,
  onSaveNote,
  onCancelEdit,
  onToggleTag,
  onCollapse,
}: DayHeaderProps) => {
  const { colors, fonts, borderRadius, visibility } = useTheme();
  return (
    <>
      <Pressable
        onPress={onCollapse}
        disabled={!onCollapse}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isEditing ? spacing.sm : spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isToday && visibility.showTodayBadge && (
            <View
              style={{
                backgroundColor: colors.ai.primary,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.sm,
                marginRight: spacing.sm,
              }}
            >
              <Text
                style={{
                  fontSize: fontSize.base,
                  fontFamily: fonts.bodyBold,
                  color: colors.white,
                }}
              >
                {t('mealPlan.today')}
              </Text>
            </View>
          )}
          <Text
            style={{
              fontSize: fontSize.xl,
              fontFamily: fonts.bodySemibold,
              color: isToday ? colors.primary : colors.content.headingMuted,
              letterSpacing: -0.2,
            }}
          >
            {formatDayHeader(
              date,
              language,
              !visibility.showTodayBadge && isToday ? '' : t('mealPlan.today'),
            )}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          {!isEditing && visibility.showDayNotes && (
            <Pressable onPress={onStartEdit}>
              {note ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                  }}
                >
                  {note
                    .split(' ')
                    .filter((t) => t.trim())
                    .map((tag, index) => {
                      const tagIndex = noteSuggestions.indexOf(tag);
                      const tagDotColor =
                        tagIndex >= 0
                          ? colors.tagDot[tagIndex % colors.tagDot.length]
                          : colors.content.icon;
                      return (
                        <Chip
                          key={`${tag}-${index}`}
                          label={tag}
                          variant="display"
                          dot={tagDotColor}
                        />
                      );
                    })}
                </View>
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surface.hover,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: borderRadius.md,
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSize.base,
                      color: colors.content.icon,
                    }}
                  >
                    {t('mealPlan.addNote')}
                  </Text>
                </View>
              )}
            </Pressable>
          )}
          {onCollapse && visibility.showChevrons && (
            <Ionicons
              name="chevron-up"
              size={iconSize.sm}
              color={colors.content.subtitle}
            />
          )}
        </View>
      </Pressable>

      {isEditing && (
        <NoteEditor
          noteText={noteText}
          noteSuggestions={noteSuggestions}
          t={t}
          onNoteTextChange={onNoteTextChange}
          onSave={onSaveNote}
          onCancel={onCancelEdit}
          onToggleTag={onToggleTag}
        />
      )}
    </>
  );
};

interface NoteEditorProps {
  noteText: string;
  noteSuggestions: string[];
  t: TFunction;
  onNoteTextChange: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onToggleTag: (tag: string) => void;
}

const NoteEditor = ({
  noteText,
  noteSuggestions,
  t,
  onNoteTextChange,
  onSave,
  onCancel,
  onToggleTag,
}: NoteEditorProps) => {
  const { colors, fonts, borderRadius } = useTheme();
  const activeTags = noteText.split(' ').filter((w) => w.trim());
  return (
    <View style={{ marginBottom: spacing.md }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface.tint,
          borderRadius: borderRadius.md,
          padding: spacing.sm,
          gap: spacing.xs,
        }}
      >
        <TextInput
          value={noteText}
          onChangeText={onNoteTextChange}
          placeholder={t('mealPlan.notePlaceholder')}
          style={{
            flex: 1,
            fontSize: fontSize.lg,
            fontFamily: fonts.body,
            color: colors.content.headingWarm,
            padding: 0,
          }}
          placeholderTextColor={colors.content.placeholderHex}
          autoFocus
        />
        <ButtonGroup>
          <Button
            variant="text"
            label={t('mealPlan.notesSave')}
            size="md"
            onPress={onSave}
            textColor={colors.content.headingWarm}
          />
          <Button
            variant="text"
            tone="subtle"
            label={t('mealPlan.notesCancel')}
            size="md"
            onPress={onCancel}
          />
        </ButtonGroup>
      </View>
      <View style={{ marginTop: spacing.xs }}>
        <ChipGroup layout="horizontal">
          {noteSuggestions.map((suggestion) => {
            const isActive = activeTags.includes(suggestion);
            return (
              <Chip
                key={suggestion}
                label={suggestion}
                variant="toggle"
                active={isActive}
                dot={
                  colors.tagDot[
                    noteSuggestions.indexOf(suggestion) % colors.tagDot.length
                  ]
                }
                onPress={() => onToggleTag(suggestion)}
              />
            );
          })}
        </ChipGroup>
      </View>
    </View>
  );
};
