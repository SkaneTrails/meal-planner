import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { CRTOverlay } from '@/components/CRTOverlay';
import { ThemeIcon } from '@/components/ThemeIcon';
import { useTranslation } from '@/lib/i18n';
import {
  fontSize,
  layout,
  letterSpacing,
  spacing,
  useTheme,
} from '@/lib/theme';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Prevents backdrop dismiss and hides the close button. */
  blocking?: boolean;
  /** Override backdrop dismiss (e.g. disable during async work). Defaults to `true` unless `blocking`. */
  dismissable?: boolean;
  subtitle?: string;
  /** Replaces the default close button in the header. */
  headerRight?: ReactNode;
  footer?: ReactNode;
  testID?: string;
}

export const BottomSheetModal = ({
  visible,
  onClose,
  title,
  children,
  blocking = false,
  dismissable: dismissableProp,
  subtitle,
  headerRight,
  footer,
  testID,
}: BottomSheetModalProps) => {
  const { colors, fonts, borderRadius, chrome } = useTheme();
  const { t } = useTranslation();
  const dismissable = dismissableProp ?? !blocking;
  const showCloseButton = !blocking && !headerRight;
  const isFlat = chrome === 'flat';

  const sheetContent = (
    <View
      style={{
        backgroundColor: colors.surface.modal,
        borderTopLeftRadius: isFlat ? 0 : borderRadius.xl,
        borderTopRightRadius: isFlat ? 0 : borderRadius.xl,
        maxWidth: layout.contentMaxWidth,
        width: '100%',
        alignSelf: 'center',
        paddingBottom: footer ? 0 : 40,
        flexShrink: 1,
        minHeight: 0,
        overflow: 'hidden',
        ...(isFlat && {
          borderTopWidth: 2,
          borderLeftWidth: 2,
          borderRightWidth: 2,
          borderColor: colors.border,
        }),
      }}
      testID={testID}
    >
      {!isFlat && (
        <View
          style={{
            alignItems: 'center',
            paddingTop: spacing.sm,
            paddingBottom: spacing.xs,
          }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.surface.divider,
            }}
          />
        </View>
      )}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.xl,
          paddingTop: isFlat ? spacing.xl : spacing.md,
          marginBottom: subtitle ? spacing.xs : spacing.lg,
        }}
      >
        <Text
          style={{
            fontSize: fontSize['xl-2xl'],
            fontFamily: fonts.display,
            letterSpacing: letterSpacing.tight,
            color: colors.content.heading,
            flex: 1,
          }}
        >
          {title}
        </Text>
        {headerRight}
        {showCloseButton && (
          <Pressable
            onPress={onClose}
            testID="close-button"
            accessibilityLabel={t('common.close')}
            accessibilityRole="button"
            hitSlop={12}
          >
            <ThemeIcon name="close" size={22} color={colors.content.body} />
          </Pressable>
        )}
      </View>

      {subtitle && (
        <Text
          style={{
            fontSize: fontSize.base,
            fontFamily: fonts.body,
            color: colors.content.tertiary,
            paddingHorizontal: spacing.xl,
            marginBottom: spacing.md,
          }}
        >
          {subtitle}
        </Text>
      )}

      <ScrollView
        style={{ flexGrow: 0, flexShrink: 1, minHeight: 0 }}
        contentContainerStyle={{ paddingHorizontal: spacing.xl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {footer}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {dismissable ? (
        <Pressable
          style={{
            flex: 1,
            backgroundColor: colors.overlay.backdropLight,
          }}
          onPress={onClose}
          testID="backdrop"
        >
          <View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxHeight: '90%',
                maxWidth: layout.contentMaxWidth,
                alignSelf: 'center',
              }}
            >
              {sheetContent}
            </Pressable>
          </View>
        </Pressable>
      ) : (
        <View
          style={{
            flex: 1,
            backgroundColor: colors.overlay.backdrop,
          }}
          testID="backdrop"
        >
          <View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                maxHeight: '90%',
                width: '100%',
                maxWidth: layout.contentMaxWidth,
              }}
            >
              {sheetContent}
            </View>
          </View>
        </View>
      )}
      <CRTOverlay />
    </Modal>
  );
};
