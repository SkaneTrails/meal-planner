import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { BottomSheetModal, Button } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { fontSize, spacing, useTheme } from '@/lib/theme';

const isValidImageUrl = (url: string): boolean => {
  const lower = url.trim().toLowerCase();
  return lower.startsWith('http://') || lower.startsWith('https://');
};

interface ImageUrlModalProps {
  visible: boolean;
  initialUrl: string;
  t: TFunction;
  onClose: () => void;
  onSave: (url: string) => void;
}

export const ImageUrlModal = ({
  visible,
  initialUrl,
  t,
  onClose,
  onSave,
}: ImageUrlModalProps) => {
  const { colors, fonts, borderRadius } = useTheme();
  const [imageUrlInput, setImageUrlInput] = useState(initialUrl);

  useEffect(() => {
    if (visible) {
      setImageUrlInput(initialUrl);
    }
  }, [visible, initialUrl]);

  const trimmed = imageUrlInput.trim();
  const hasInput = trimmed.length > 0;
  const validScheme = !hasInput || isValidImageUrl(trimmed);

  const handleSave = () => {
    if (hasInput && validScheme) {
      onSave(trimmed);
    }
    onClose();
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t('recipe.imageUrl')}
      subtitle={t('recipe.imageUrlPrompt')}
      headerRight={
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button
            variant="text"
            tone="cancel"
            onPress={onClose}
            label={t('common.cancel')}
            size="lg"
          />
          <Button
            variant="primary"
            onPress={handleSave}
            label={t('common.save')}
            size="sm"
            disabled={hasInput && !validScheme}
          />
        </View>
      }
    >
      <TextInput
        value={imageUrlInput}
        onChangeText={setImageUrlInput}
        placeholder="https://example.com/image.jpg"
        placeholderTextColor={colors.input.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        style={{
          borderWidth: 1,
          borderColor:
            hasInput && !validScheme ? colors.error : colors.input.border,
          borderRadius: borderRadius.sm,
          padding: spacing.md,
          fontSize: fontSize.xl,
          fontFamily: fonts.body,
          color: colors.input.text,
          backgroundColor: colors.input.bgSubtle,
          marginBottom: hasInput && !validScheme ? spacing.xs : spacing.lg,
        }}
      />
      {hasInput && !validScheme && (
        <Text
          style={{
            color: colors.error,
            fontSize: fontSize.sm,
            fontFamily: fonts.body,
            marginBottom: spacing.lg,
          }}
        >
          {t('recipe.imageUrlInvalidScheme')}
        </Text>
      )}
    </BottomSheetModal>
  );
};
