/**
 * Household-scoped notes section for recipe detail screen.
 * Displays existing notes and lets authenticated users add/delete notes.
 */

import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { Button, Section } from '@/components';
import { showAlert, showNotification } from '@/lib/alert';
import { hapticLight } from '@/lib/haptics';
import {
  useCreateRecipeNote,
  useDeleteRecipeNote,
  useRecipeNotes,
} from '@/lib/hooks';
import type { TFunction } from '@/lib/i18n';
import { fontSize, lineHeight, spacing, useTheme } from '@/lib/theme';

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
  const { colors, fonts, borderRadius } = useTheme();
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

  const isDisabled = !text.trim() || createNote.isPending;

  return (
    <Section
      title={t('recipe.notes')}
      icon="chatbubble-ellipses-outline"
      size="sm"
      spacing={0}
      style={{ marginTop: spacing.xl }}
    >
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
            backgroundColor: colors.input.bg,
            borderWidth: 1,
            borderColor: colors.input.border,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            fontSize: fontSize.lg,
            fontFamily: fonts.body,
            color: colors.content.body,
            minHeight: 42,
            maxHeight: 100,
          }}
        />
        <Button
          variant="text"
          tone="alt"
          label={t('recipe.addNote')}
          onPress={handleAdd}
          disabled={isDisabled}
          isPending={createNote.isPending}
          style={{ marginLeft: spacing.sm, minHeight: 42 }}
        />
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
            fontFamily: fonts.body,
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
            borderBottomWidth: 1,
            borderBottomColor: colors.surface.divider,
            paddingVertical: spacing.md,
          }}
        >
          <Text
            style={{
              color: colors.content.body,
              fontFamily: fonts.body,
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
                fontFamily: fonts.body,
                fontSize: fontSize.sm,
              }}
            >
              {formatDate(note.created_at)}
            </Text>
            <Button
              variant="text"
              tone="warning"
              icon="trash-outline"
              size="sm"
              onPress={() => handleDelete(note.id)}
              hitSlop={8}
            />
          </View>
        </View>
      ))}
    </Section>
  );
};
