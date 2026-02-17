import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import type { DimensionValue } from 'react-native';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import {
  borderRadius,
  fontFamily,
  fontSize,
  fontWeight,
  spacing,
  useTheme,
} from '@/lib/theme';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  animationType?: 'slide' | 'fade';
  dismissOnBackdropPress?: boolean;
  showDragHandle?: boolean;
  showCloseButton?: boolean;
  subtitle?: string;
  headerRight?: ReactNode;
  footer?: ReactNode;
  maxHeight?: DimensionValue;
  backgroundColor?: string;
  scrollable?: boolean;
  testID?: string;
}

export const BottomSheetModal = ({
  visible,
  onClose,
  title,
  children,
  animationType = 'slide',
  dismissOnBackdropPress = false,
  showDragHandle = false,
  showCloseButton = true,
  subtitle,
  headerRight,
  footer,
  maxHeight = '80%' as DimensionValue,
  backgroundColor: backgroundColorProp,
  scrollable = true,
  testID,
}: BottomSheetModalProps) => {
  const { colors } = useTheme();
  const backgroundColor = backgroundColorProp ?? colors.white;
  const backdropContent = (
    <View
      style={{
        backgroundColor,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight,
        paddingBottom: footer ? 0 : 40,
      }}
      testID={testID}
    >
      {showDragHandle && (
        <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: colors.button.disabled,
              borderRadius: borderRadius['3xs'],
            }}
            testID="drag-handle"
          />
        </View>
      )}

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.xl,
          paddingTop: showDragHandle ? 0 : spacing.xl,
          marginBottom: subtitle ? spacing.xs : spacing.lg,
        }}
      >
        <Text
          style={{
            fontSize: fontSize['3xl'],
            fontFamily: fontFamily.bodyBold,
            fontWeight: fontWeight.bold,
            color: colors.content.headingWarm,
            flex: 1,
          }}
        >
          {title}
        </Text>
        {headerRight}
        {showCloseButton && !headerRight && (
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
            fontFamily: fontFamily.body,
            color: colors.gray[500],
            paddingHorizontal: spacing.xl,
            marginBottom: spacing.md,
          }}
        >
          {subtitle}
        </Text>
      )}

      {scrollable ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: spacing.xl }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}

      {footer}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
    >
      {dismissOnBackdropPress ? (
        <Pressable
          style={{
            flex: 1,
            backgroundColor: colors.overlay.backdropLight,
            justifyContent: 'flex-end',
          }}
          onPress={onClose}
          testID="backdrop"
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {backdropContent}
          </Pressable>
        </Pressable>
      ) : (
        <View
          style={{
            flex: 1,
            backgroundColor: colors.overlay.backdrop,
            justifyContent: 'flex-end',
          }}
          testID="backdrop"
        >
          {backdropContent}
        </View>
      )}
    </Modal>
  );
};
