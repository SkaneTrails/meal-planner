/**
 * Contextual help-tip popup.
 *
 * Renders an ⓘ icon next to children. Pressing it opens a modal overlay
 * with a ContentCard containing the help text. Tap the backdrop to dismiss.
 */

import { type ReactNode, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { fontSize, spacing, useTheme } from '@/lib/theme';
import { ContentCard } from './ContentCard';
import { ThemeIcon } from './ThemeIcon';

interface HelpTipProps {
  /** Translatable help text shown in the popup. */
  helpText: string;
  children: ReactNode;
}

export const HelpTip = ({ helpText, children }: HelpTipProps) => {
  const [open, setOpen] = useState(false);
  const { colors, fonts } = useTheme();

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        <View style={{ flex: 1 }}>{children}</View>
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Toggle help"
          testID="help-tip-toggle"
          hitSlop={8}
        >
          <ThemeIcon
            name="information-circle-outline"
            size={18}
            color={colors.content.secondary}
          />
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.surface.overlay,
            padding: spacing.xl,
          }}
          testID="help-tip-backdrop"
          onPress={() => setOpen(false)}
        >
          <ContentCard
            cardStyle={{ maxWidth: 360, padding: spacing.lg }}
            style={{ width: '100%' }}
          >
            <Text
              style={{
                fontSize: fontSize.sm,
                fontFamily: fonts.body,
                color: colors.content.body,
                lineHeight: fontSize.sm * 1.5,
              }}
            >
              {helpText}
            </Text>
          </ContentCard>
        </Pressable>
      </Modal>
    </View>
  );
};
