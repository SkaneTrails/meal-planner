import { useEffect, useRef } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button, ContentCard } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { fontSize, spacing, useTheme } from '@/lib/theme';

interface AddItemCardProps {
  newItemText: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onDismiss?: () => void;
}

export const AddItemCard = ({
  newItemText,
  onChangeText,
  onSubmit,
  onDismiss,
}: AddItemCardProps) => {
  const { colors, fonts, borderRadius, visibility } = useTheme();
  const { t } = useTranslation();
  const containerRef = useRef<View>(null);

  useEffect(() => {
    if (!onDismiss) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };

    const handlePointerDown = (e: PointerEvent) => {
      const node = containerRef.current as unknown as HTMLElement | null;
      if (node && !node.contains(e.target as Node)) onDismiss();
    };

    document.addEventListener('keydown', handleKeyDown);
    // Defer pointerdown to avoid catching the click that opened the input
    const raf = requestAnimationFrame(() => {
      document.addEventListener('pointerdown', handlePointerDown);
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(raf);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [onDismiss]);

  return (
    <View ref={containerRef}>
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
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
          }}
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
            style={{
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing['sm-md'],
              borderRadius: borderRadius.sm,
            }}
          />
        </View>
      </ContentCard>
    </View>
  );
};
