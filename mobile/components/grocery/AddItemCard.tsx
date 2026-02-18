import { Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from '@/components';
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
  const { colors, fonts, borderRadius, shadows } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        ...shadows.sm,
      }}
    >
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
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
      >
        <TextInput
          style={{
            flex: 1,
            backgroundColor: colors.surface.tint,
            borderRadius: borderRadius.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing['sm-md'],
            fontSize: fontSize.lg,
            color: colors.content.heading,
          }}
          placeholder={t('grocery.addItemExamplePlaceholder')}
          placeholderTextColor={colors.content.placeholder}
          value={newItemText}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          blurOnSubmit={false}
          returnKeyType="done"
          autoFocus
        />
        <AnimatedPressable
          onPress={onSubmit}
          disabled={!newItemText.trim()}
          hoverScale={1.05}
          pressScale={0.95}
          disableAnimation={!newItemText.trim()}
          style={{
            backgroundColor: newItemText.trim()
              ? colors.ai.primary
              : colors.surface.pressed,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing['sm-md'],
            borderRadius: borderRadius.sm,
          }}
        >
          <Text
            style={{
              fontSize: fontSize.lg,
              fontFamily: fonts.bodySemibold,
              color: colors.white,
            }}
          >
            {t('grocery.addButton')}
          </Text>
        </AnimatedPressable>
      </View>
    </View>
  );
};
