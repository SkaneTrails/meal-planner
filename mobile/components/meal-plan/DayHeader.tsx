import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  dotSize,
  fontFamily,
  spacing,
} from '@/lib/theme';
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
}: DayHeaderProps) => (
  <>
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isEditing ? 8 : 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {isToday && (
          <View
            style={{
              backgroundColor: colors.ai.primary,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
              marginRight: 10,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: fontFamily.bodyBold,
                color: colors.white,
              }}
            >
              {t('mealPlan.today')}
            </Text>
          </View>
        )}
        <Text
          style={{
            fontSize: 15,
            fontFamily: fontFamily.bodySemibold,
            color: isToday ? colors.primary : 'rgba(45, 45, 45, 0.75)',
            letterSpacing: -0.2,
          }}
        >
          {formatDayHeader(date, language, t('mealPlan.today'))}
        </Text>
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
                          fontSize: 12,
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
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: borderRadius.md,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.content.icon }}>
                {t('mealPlan.addNote')}
              </Text>
            </View>
          )}
        </Pressable>
      )}
    </View>

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
}: NoteEditorProps) => (
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
          fontSize: 14,
          color: colors.content.headingWarm,
          padding: 0,
        }}
        placeholderTextColor={colors.content.placeholderHex}
        autoFocus
      />
      <Pressable onPress={onSave}>
        <Text
          style={{
            fontSize: 14,
            fontFamily: fontFamily.bodySemibold,
            color: colors.content.headingWarm,
          }}
        >
          {t('mealPlan.notesSave')}
        </Text>
      </Pressable>
      <Pressable onPress={onCancel}>
        <Text style={{ fontSize: 14, color: colors.content.icon }}>
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
            <Text style={{ fontSize: 13, color: colors.content.headingWarm }}>
              {suggestion}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  </View>
);
