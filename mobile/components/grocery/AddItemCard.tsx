import { Text, TextInput, View } from 'react-native';
import { Button, ContentCard } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { fontSize, spacing, useTheme } from '@/lib/theme';

interface AddItemCardProps {
  newItemText: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
}

export const AddItemCard = ({
  newItemText,
  onChangeText,
  onSubmit,
}: AddItemCardProps) => {
  const { colors, fonts, borderRadius, visibility } = useTheme();
  const { t } = useTranslation();

  return (
    <ContentCard frameVariant="single" framePadding={spacing.sm}>
      {visibility.showAddItemLabel && (
        <Text
          style={{
            fontSize: fontSize.base,
            fontFamily: fonts.bodySemibold,
            color: colors.content.tertiary,
            marginBottom: spacing.sm,
          }}
        >
          {t('grocery.addItemLabel')}
        </Text>
      )}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
      >
        <TextInput
          style={{
            flex: 1,
            backgroundColor: colors.input.bgSubtle,
            borderRadius: borderRadius.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing['sm-md'],
            fontSize: fontSize.lg,
            color: colors.input.text,
            fontFamily: fonts.body,
            borderWidth: 1,
            borderColor: colors.input.border,
          }}
          placeholder={t('grocery.addItemExamplePlaceholder')}
          placeholderTextColor={colors.input.placeholder}
          value={newItemText}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          blurOnSubmit={false}
          returnKeyType="done"
          autoFocus
        />
        <Button
          variant="text"
          onPress={onSubmit}
          disabled={!newItemText.trim()}
          disableAnimation={!newItemText.trim()}
          label={t('grocery.addButton')}
          tone="primary"
          style={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing['sm-md'],
            borderRadius: borderRadius.sm,
          }}
        />
      </View>
    </ContentCard>
  );
};
