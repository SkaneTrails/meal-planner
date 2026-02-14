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
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.md,
        padding: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontFamily: fontFamily.bodySemibold,
          color: 'rgba(93, 78, 64, 0.7)',
          marginBottom: 8,
        }}
      >
        {t('grocery.addItemLabel')}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TextInput
          style={{
            flex: 1,
            backgroundColor: 'rgba(93, 78, 64, 0.06)',
            borderRadius: borderRadius.sm,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 14,
            color: '#3D3D3D',
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
              ? '#6B8E6B'
              : 'rgba(200, 190, 180, 0.5)',
            paddingHorizontal: 16,
            paddingVertical: 10,
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
