import { useEffect, useState } from 'react';
import { Modal, Text, TextInput, View } from 'react-native';
import { Button } from '@/components';
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay.backdrop,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.xl,
        }}
      >
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
            width: '100%',
            maxWidth: 400,
          }}
        >
          <Text
            style={{
              fontSize: fontSize['2xl'],
              fontFamily: fonts.bodySemibold,
              color: colors.text.inverse,
              marginBottom: spacing.sm,
            }}
          >
            {t('recipe.imageUrl')}
          </Text>
          <Text
            style={{
              fontSize: fontSize.lg,
              fontFamily: fonts.body,
              color: colors.gray[500],
              marginBottom: spacing.lg,
            }}
          >
            {t('recipe.imageUrlPrompt')}
          </Text>
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
              borderColor: colors.bgDark,
              borderRadius: borderRadius.sm,
              padding: spacing.md,
              fontSize: fontSize.xl,
              fontFamily: fonts.body,
              color: colors.text.inverse,
              marginBottom: spacing.lg,
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: spacing.md,
            }}
          >
            <Button
              variant="text"
              tone="cancel"
              onPress={onClose}
              label={t('common.cancel')}
            />
            <Button
              variant="primary"
              onPress={() => {
                if (imageUrlInput.trim()) {
                  onSave(imageUrlInput.trim());
                }
                onClose();
              }}
              label={t('common.save')}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};
