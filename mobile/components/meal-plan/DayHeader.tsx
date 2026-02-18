import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { TFunction } from '@/lib/i18n';
import { dotSize, fontSize, iconSize, spacing, useTheme } from '@/lib/theme';
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
  const { colors, fonts, borderRadius } = useTheme();
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
          {isToday && (
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
            {formatDayHeader(date, language, t('mealPlan.today'))}
          </Text>
          {onCollapse && (
            <Ionicons
              name="chevron-up"
              size={iconSize.sm}
              color={colors.content.subtitle}
              style={{ marginLeft: spacing.xs }}
            />
          )}
        </View>

        {!isEditing && (
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
                      <View
                        key={`${tag}-${index}`}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.xs,
                          backgroundColor: colors.surface.tint,
                          paddingHorizontal: spacing.sm,
                          paddingVertical: spacing.xs,
                          borderRadius: borderRadius.md,
                        }}
                      >
                        <View
                          style={{
                            width: dotSize.md,
                            height: dotSize.md,
                            borderRadius: dotSize.md / 2,
                            backgroundColor: tagDotColor,
                          }}
                        />
                        <Text
                          style={{
                            fontSize: fontSize.base,
                            color: colors.content.secondary,
                          }}
                        >
                          {tag}
                        </Text>
                      </View>
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
            color: colors.content.headingWarm,
            padding: 0,
          }}
          placeholderTextColor={colors.content.placeholderHex}
          autoFocus
        />
        <Pressable onPress={onSave}>
          <Text
            style={{
              fontSize: fontSize.lg,
              fontFamily: fonts.bodySemibold,
              color: colors.content.headingWarm,
            }}
          >
            {t('mealPlan.notesSave')}
          </Text>
        </Pressable>
        <Pressable onPress={onCancel}>
          <Text style={{ fontSize: fontSize.lg, color: colors.content.icon }}>
            {t('mealPlan.notesCancel')}
          </Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: spacing.xs }}
      >
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {noteSuggestions.map((suggestion, index) => (
            <Pressable
              key={suggestion}
              onPress={() => onToggleTag(suggestion)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                backgroundColor: noteText.split(' ').includes(suggestion)
                  ? colors.surface.active
                  : colors.white,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.full,
                borderWidth: 1,
                borderColor: noteText.split(' ').includes(suggestion)
                  ? colors.content.headingWarm
                  : colors.surface.divider,
              }}
            >
              <View
                style={{
                  width: dotSize.md,
                  height: dotSize.md,
                  borderRadius: dotSize.md / 2,
                  backgroundColor: colors.tagDot[index % colors.tagDot.length],
                }}
              />
              <Text
                style={{
                  fontSize: fontSize.md,
                  color: colors.content.headingWarm,
                }}
              >
                {suggestion}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
