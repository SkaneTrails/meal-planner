import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
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
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.sm,
                backgroundColor: pressed ? colors.gray[100] : 'transparent',
              })}
            >
              <Text
                style={{
                  fontSize: fontSize.xl,
                  fontFamily: fonts.bodyMedium,
                  color: colors.gray[500],
                }}
              >
                {t('common.cancel')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (imageUrlInput.trim()) {
                  onSave(imageUrlInput.trim());
                }
                onClose();
              }}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.sm,
                backgroundColor: pressed ? colors.primaryDark : colors.primary,
              })}
            >
              <Text
                style={{
                  fontSize: fontSize.xl,
                  fontFamily: fonts.bodyMedium,
                  color: colors.white,
                }}
              >
                {t('common.save')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
