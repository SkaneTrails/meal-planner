import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  letterSpacing,
  spacing,
} from '@/lib/theme';

interface TagEditorProps {
  editTags: string;
  setEditTags: (tags: string) => void;
  t: TFunction;
}

export const TagEditor = ({ editTags, setEditTags, t }: TagEditorProps) => {
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
          fontFamily: fontFamily.bodySemibold,
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
          placeholderTextColor={colors.gray[400]}
          autoCapitalize="none"
          onSubmitEditing={handleAddTag}
          returnKeyType="done"
          style={{
            flex: 1,
            backgroundColor: colors.gray[50],
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            fontSize: fontSize.xl,
            fontFamily: fontFamily.body,
            color: colors.text.inverse,
            borderWidth: 1,
            borderColor: colors.bgDark,
          }}
        />
        <Pressable
          onPress={handleAddTag}
          disabled={!newTag.trim()}
          style={({ pressed }) => ({
            backgroundColor: newTag.trim()
              ? pressed
                ? colors.primaryDark
                : colors.primary
              : colors.gray[200],
            paddingHorizontal: spacing.lg,
            borderRadius: borderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Ionicons
            name="add"
            size={24}
            color={newTag.trim() ? colors.white : colors.gray[400]}
          />
        </Pressable>
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
                    fontFamily: fontFamily.bodyMedium,
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
            fontFamily: fontFamily.body,
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
