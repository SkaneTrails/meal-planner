import { useState } from 'react';
import { Text, View } from 'react-native';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LanguagePicker } from '@/components/settings/LanguagePicker';
import { useTranslation } from '@/lib/i18n';
import type { AppLanguage } from '@/lib/settings-context';
import { colors, fontSize, fontWeight, spacing } from '@/lib/theme';

interface LanguagePromptModalProps {
  visible: boolean;
  onConfirm: (language: AppLanguage) => void;
  isSaving: boolean;
}

export const LanguagePromptModal = ({
  visible,
  onConfirm,
  isSaving,
}: LanguagePromptModalProps) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<AppLanguage>('en');

  return (
    <BottomSheetModal
      visible={visible}
      onClose={() => {}}
      title={t('settings.chooseLanguageTitle')}
      dismissOnBackdropPress={false}
      showCloseButton={false}
      scrollable={false}
      testID="language-prompt-modal"
    >
      <View style={{ paddingHorizontal: spacing.md, gap: spacing.lg }}>
        <Text
          style={{
            fontSize: fontSize.md,
            color: colors.content.body,
            fontWeight: fontWeight.normal,
          }}
        >
          {t('settings.chooseLanguageMessage')}
        </Text>
        <LanguagePicker
          currentLanguage={selected}
          onChangeLanguage={setSelected}
        />
        <PrimaryButton
          label={t('common.confirm')}
          onPress={() => onConfirm(selected)}
          isPending={isSaving}
          disabled={isSaving}
        />
      </View>
    </BottomSheetModal>
  );
};
