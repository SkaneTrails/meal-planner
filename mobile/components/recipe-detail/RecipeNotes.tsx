/**
 * Household-scoped notes section for recipe detail screen.
 * Displays existing notes and lets authenticated users add/delete notes.
 */

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { showAlert, showNotification } from '@/lib/alert';
import { hapticLight } from '@/lib/haptics';
import {
  useCreateRecipeNote,
  useDeleteRecipeNote,
  useRecipeNotes,
} from '@/lib/hooks';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  circleStyle,
  colors,
  fontFamily,
  fontSize,
  iconContainer,
  lineHeight,
  spacing,
  typography,
} from '@/lib/theme';

interface RecipeNotesProps {
  recipeId: string;
  isOwned: boolean | undefined;
  canCopy: boolean;
  t: TFunction;
  onCopy: () => void;
}

export const RecipeNotes = ({
  recipeId,
  isOwned,
  canCopy,
  t,
  onCopy,
}: RecipeNotesProps) => {
  const [text, setText] = useState('');
  const { data: notes, isLoading } = useRecipeNotes(recipeId);
  const createNote = useCreateRecipeNote();
  const deleteNote = useDeleteRecipeNote();

  const handleAdd = () => {
    if (!isOwned) {
      if (canCopy) {
        showAlert(
          t('recipe.belongsToAnother'),
          t('recipe.belongsToAnotherNote'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('recipe.copy'), onPress: onCopy },
          ],
        );
      } else {
        showAlert(t('recipe.cannotAddNote'), t('recipe.cannotAddNoteMessage'), [
          { text: t('common.ok') },
        ]);
      }
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;
    hapticLight();
    createNote.mutate(
      { recipeId, note: { text: trimmed } },
      {
        onSuccess: () => {
          setText('');
          showNotification(t('common.success'), t('recipe.noteAdded'));
        },
        onError: () =>
          showNotification(t('common.error'), t('recipe.noteAddFailed')),
      },
    );
  };

  const handleDelete = (noteId: string) => {
    showAlert(t('recipe.deleteNote'), t('recipe.deleteNoteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          hapticLight();
          deleteNote.mutate(
            { recipeId, noteId },
            {
              onError: () =>
                showNotification(
                  t('common.error'),
                  t('recipe.noteDeleteFailed'),
                ),
            },
          );
        },
      },
    ]);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={{ marginTop: spacing.xl }}>
      {/* Section header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <View
          style={{
            ...circleStyle(iconContainer.xs),
            backgroundColor: colors.surface.active,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
          }}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={18}
            color={colors.content.heading}
          />
        </View>
        <Text
          style={{
            ...typography.displaySmall,
            color: colors.content.heading,
          }}
        >
          {t('recipe.notes')}
        </Text>
      </View>

      {/* Input row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.md,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t('recipe.notesPlaceholder')}
          placeholderTextColor={colors.content.placeholderHex}
          multiline
          style={{
            flex: 1,
            backgroundColor: colors.glass.subtle,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            fontSize: fontSize.lg,
            fontFamily: fontFamily.body,
            color: colors.content.body,
            minHeight: 42,
            maxHeight: 100,
          }}
        />
        <Pressable
          onPress={handleAdd}
          disabled={!text.trim() || createNote.isPending}
          style={({ pressed }) => ({
            marginLeft: spacing.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
            backgroundColor:
              !text.trim() || createNote.isPending
                ? colors.surface.active
                : pressed
                  ? colors.ai.primaryDark
                  : colors.ai.primary,
            minHeight: 42,
            justifyContent: 'center',
          })}
        >
          {createNote.isPending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text
              style={{
                color: !text.trim() ? colors.content.placeholder : colors.white,
                fontFamily: fontFamily.bodySemibold,
                fontSize: fontSize.lg,
              }}
            >
              {t('recipe.addNote')}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Notes list */}
      {isLoading && (
        <ActivityIndicator
          size="small"
          color={colors.content.placeholder}
          style={{ marginVertical: spacing.md }}
        />
      )}

      {!isLoading && (!notes || notes.length === 0) && (
        <Text
          style={{
            color: colors.content.placeholder,
            fontFamily: fontFamily.body,
            fontSize: fontSize.lg,
            textAlign: 'center',
            paddingVertical: spacing.md,
          }}
        >
          {t('recipe.noNotes')}
        </Text>
      )}

      {notes?.map((note) => (
        <View
          key={note.id}
          style={{
            backgroundColor: colors.glass.faint,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.sm,
          }}
        >
          <Text
            style={{
              color: colors.content.body,
              fontFamily: fontFamily.body,
              fontSize: fontSize.lg,
              lineHeight: lineHeight.lg,
            }}
          >
            {note.text}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: spacing.xs,
            }}
          >
            <Text
              style={{
                color: colors.content.placeholder,
                fontFamily: fontFamily.body,
                fontSize: fontSize.sm,
              }}
            >
              {formatDate(note.created_at)}
            </Text>
            <Pressable
              onPress={() => handleDelete(note.id)}
              hitSlop={8}
              style={{ padding: spacing.xs }}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color={colors.content.placeholder}
              />
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
};
