import { Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { borderRadius, colors, fontFamily, spacing } from '@/lib/theme';

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
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        boxShadow: '1px 1px 3px 0px rgba(0, 0, 0, 0.04)',
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontFamily: fontFamily.bodySemibold,
          color: colors.content.tertiary,
          marginBottom: 8,
        }}
      >
        {t('grocery.addItemLabel')}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TextInput
          style={{
            flex: 1,
            backgroundColor: colors.surface.tint,
            borderRadius: borderRadius.sm,
            paddingHorizontal: 12,
            paddingVertical: spacing['sm-md'],
            fontSize: 14,
            color: colors.content.heading,
          }}
          placeholder={t('grocery.addItemExamplePlaceholder')}
          placeholderTextColor="#A09080"
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
              : 'rgba(200, 190, 180, 0.5)',
            paddingHorizontal: 16,
            paddingVertical: spacing['sm-md'],
            borderRadius: borderRadius.sm,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: fontFamily.bodySemibold,
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
