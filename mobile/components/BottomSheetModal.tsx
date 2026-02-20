import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { CRTOverlay } from '@/components/CRTOverlay';
import { fontSize, fontWeight, layout, spacing, useTheme } from '@/lib/theme';

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
  const { colors, fonts, borderRadius } = useTheme();
  const dismissable = dismissableProp ?? !blocking;
  const showCloseButton = !blocking && !headerRight;

  const sheetContent = (
    <View
      style={{
        backgroundColor: colors.surface.modal,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxWidth: layout.contentMaxWidth,
        width: '100%',
        alignSelf: 'center',
        paddingBottom: footer ? 0 : 40,
        flexShrink: 1,
        minHeight: 0,
        overflow: 'hidden',
      }}
      testID={testID}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xl,
          marginBottom: subtitle ? spacing.xs : spacing.lg,
        }}
      >
        <Text
          style={{
            fontSize: fontSize['3xl'],
            fontFamily: fonts.bodyBold,
            fontWeight: fontWeight.bold,
            color: colors.content.headingWarm,
            flex: 1,
          }}
        >
          {title}
        </Text>
        {headerRight}
        {showCloseButton && (
          <Pressable onPress={onClose} testID="close-button">
            <Ionicons
              name="close"
              size={24}
              color={colors.content.headingWarm}
            />
          </Pressable>
        )}
      </View>

      {subtitle && (
        <Text
          style={{
            fontSize: fontSize.md,
            fontFamily: fonts.body,
            color: colors.gray[500],
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
