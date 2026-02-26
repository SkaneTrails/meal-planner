/**
 * Contextual help-tip primitives.
 *
 * - `HelpTipIcon` — standalone ⓘ button + modal popup. Drop into any header
 *   row where you need a tooltip without wrapping children.
 * - `HelpTip` — convenience wrapper that renders children in a flex row with
 *   the ⓘ icon on the right. Use when you don't control the parent layout.
 *
 * Theme-aware components (`Section`, `SectionLabel`, `ContentCard`) accept a
 * `tooltip` prop and render `HelpTipIcon` internally — prefer that over
 * wrapping with `HelpTip`.
 */

import { type ReactNode, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { fontSize, spacing, useTheme } from '@/lib/theme';
import { ContentCard } from './ContentCard';
import { ThemeIcon } from './ThemeIcon';

/* ── Standalone icon + popup ─────────────────────────────────── */

interface HelpTipIconProps {
  /** Translatable help text shown in the popup. */
  helpText: string;
}

export const HelpTipIcon = ({ helpText }: HelpTipIconProps) => {
  const [open, setOpen] = useState(false);
  const { colors, fonts } = useTheme();

  return (
    <>
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
    </>
  );
};

/* ── Wrapper variant (children + icon row) ───────────────────── */

interface HelpTipProps {
  /** Translatable help text shown in the popup. */
  helpText: string;
  children: ReactNode;
}

export const HelpTip = ({ helpText, children }: HelpTipProps) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    }}
  >
    <View style={{ flex: 1 }}>{children}</View>
    <HelpTipIcon helpText={helpText} />
  </View>
);
