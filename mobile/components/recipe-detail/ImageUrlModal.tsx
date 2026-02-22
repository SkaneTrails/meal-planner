import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { BottomSheetModal, Button } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { fontSize, spacing, useTheme } from '@/lib/theme';

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

  const handleSave = () => {
    if (imageUrlInput.trim()) {
      onSave(imageUrlInput.trim());
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
          />
        </View>
      }
    >
      <TextInput
        value={imageUrlInput}
        onChangeText={setImageUrlInput}
        placeholder="https://example.com/image.jpg"
        placeholderTextColor={colors.gray[400]}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        style={{
          borderWidth: 1,
          borderColor: colors.input.border,
          borderRadius: borderRadius.sm,
          padding: spacing.md,
          fontSize: fontSize.xl,
          fontFamily: fonts.body,
          color: colors.input.text,
          backgroundColor: colors.input.bgSubtle,
          marginBottom: spacing.lg,
        }}
      />
    </BottomSheetModal>
  );
};
