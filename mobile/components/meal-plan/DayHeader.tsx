import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { TFunction } from '@/lib/i18n';
import { colors, fontFamily } from '@/lib/theme';
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
            color: isToday ? '#2D2D2D' : 'rgba(45, 45, 45, 0.75)',
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
                backgroundColor: colors.ai.bgPressed,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Ionicons
                name="reader-outline"
                size={12}
                color={colors.ai.primary}
                style={{ marginRight: 4 }}
              />
              <Text style={{ fontSize: 12, color: colors.ai.primaryDark }}>
                {note}
              </Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(139, 115, 85, 0.08)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
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
  <View style={{ marginBottom: 12 }}>
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f5f0',
        borderRadius: 12,
        padding: 10,
        gap: 8,
      }}
    >
      <TextInput
        value={noteText}
        onChangeText={onNoteTextChange}
        placeholder={t('mealPlan.notePlaceholder')}
        style={{ flex: 1, fontSize: 14, color: '#4A3728', padding: 0 }}
        autoFocus
      />
      <Pressable onPress={onSave}>
        <Text
          style={{
            fontSize: 14,
            fontFamily: fontFamily.bodySemibold,
            color: '#4A3728',
          }}
        >
          {t('mealPlan.notesSave')}
        </Text>
      </Pressable>
      <Pressable onPress={onCancel}>
        <Text style={{ fontSize: 14, color: '#9ca3af' }}>
          {t('mealPlan.notesCancel')}
        </Text>
      </Pressable>
    </View>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: 8 }}
    >
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {noteSuggestions.map((suggestion) => (
          <Pressable
            key={suggestion}
            onPress={() => onToggleTag(suggestion)}
            style={{
              backgroundColor: noteText.includes(suggestion)
                ? '#e8dfd4'
                : colors.white,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: noteText.includes(suggestion)
                ? '#4A3728'
                : '#e5e7eb',
            }}
          >
            <Text style={{ fontSize: 13, color: '#4A3728' }}>{suggestion}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  </View>
);
