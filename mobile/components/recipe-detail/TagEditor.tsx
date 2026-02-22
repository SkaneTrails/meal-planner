import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { fontSize, letterSpacing, spacing, useTheme } from '@/lib/theme';

interface TagEditorProps {
  editTags: string;
  setEditTags: (tags: string) => void;
  t: TFunction;
}

export const TagEditor = ({ editTags, setEditTags, t }: TagEditorProps) => {
  const { colors, fonts, borderRadius } = useTheme();
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase().replace(/^#/, '');
    const existingTags = editTags
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean);
    if (tag && !existingTags.includes(tag)) {
      setEditTags(editTags ? `${editTags}, ${tag}` : tag);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const tagsArray = editTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase());
    setEditTags(tagsArray.join(', '));
  };

  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text
        style={{
          fontSize: fontSize.lg,
          fontFamily: fonts.bodySemibold,
          color: colors.gray[500],
          marginBottom: spacing.sm,
          textTransform: 'uppercase',
          letterSpacing: letterSpacing.wide,
        }}
      >
        {t('recipe.tags')}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        <TextInput
          value={newTag}
          onChangeText={setNewTag}
          placeholder={t('recipe.addTag')}
          placeholderTextColor={colors.input.placeholder}
          autoCapitalize="none"
          onSubmitEditing={handleAddTag}
          returnKeyType="done"
          style={{
            flex: 1,
            backgroundColor: colors.input.bgSubtle,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            fontSize: fontSize.xl,
            fontFamily: fonts.body,
            color: colors.input.text,
            borderWidth: 1,
            borderColor: colors.input.border,
          }}
        />
        <Button
          variant="icon"
          onPress={handleAddTag}
          disabled={!newTag.trim()}
          icon="add"
          iconSize={24}
          color={newTag.trim() ? colors.primary : colors.gray[200]}
          textColor={newTag.trim() ? colors.white : colors.gray[400]}
          style={{
            paddingHorizontal: spacing.lg,
            borderRadius: borderRadius.md,
          }}
        />
      </View>

      {editTags ? (
        <View
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}
        >
          {editTags.split(',').map((tag) => {
            const trimmedTag = tag.trim();
            if (!trimmedTag) return null;
            return (
              <View
                key={trimmedTag}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.primary,
                  paddingLeft: spacing.md,
                  paddingRight: spacing.xs,
                  paddingVertical: spacing.xs,
                  borderRadius: borderRadius.lg,
                }}
              >
                <Text
                  style={{
                    fontSize: fontSize.md,
                    fontFamily: fonts.bodyMedium,
                    color: colors.white,
                    marginRight: spacing.xs,
                  }}
                >
                  #{trimmedTag}
                </Text>
                <Pressable
                  onPress={() => handleRemoveTag(trimmedTag)}
                  style={({ pressed }) => ({
                    width: 20,
                    height: 20,
                    borderRadius: borderRadius['sm-md'],
                    backgroundColor: pressed
                      ? colors.glass.button
                      : colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  })}
                >
                  <Ionicons name="close" size={14} color={colors.white} />
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        <Text
          style={{
            fontSize: fontSize.lg,
            fontFamily: fonts.body,
            color: colors.gray[400],
            fontStyle: 'italic',
          }}
        >
          {t('recipe.noTags')}
        </Text>
      )}
    </View>
  );
};
