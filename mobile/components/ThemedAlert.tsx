/**
 * In-app themed alert modal.
 *
 * Renders as a centered card over a backdrop — no native dialogs.
 * Inherits all theme attributes: border radius, shadows, borders,
 * fonts, colors. Buttons use the shared Button component.
 *
 * Used internally by AlertProvider; not imported directly by screens.
 */

import { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BodyPortal } from '@/components/BodyPortal';

import { Button } from '@/components/Button';
import type { AlertButton, AlertRequest } from '@/lib/alert-context';
import { fontSize, spacing, useTheme } from '@/lib/theme';

interface ThemedAlertProps {
  alert: AlertRequest | null;
  onDismiss: (button?: AlertButton) => void;
}

const ANIMATION_DURATION = 200;

const buttonTone = (style?: AlertButton['style']) => {
  if (style === 'destructive') return 'destructive' as const;
  return 'default' as const;
};

// ── Platform wrappers ───────────────────────────────────────────────

interface WrapperProps {
  visible: boolean;
  children: React.ReactNode;
}

const NativeModalWrapper = ({ visible, children }: WrapperProps) => (
  <Modal
    visible={visible}
    transparent
    animationType="none"
    statusBarTranslucent
  >
    {children}
  </Modal>
);

const WebOverlay = ({ visible, children }: WrapperProps) => {
  if (!visible) return null;
  return (
    <BodyPortal>
      <View style={styles.webOverlay}>{children}</View>
    </BodyPortal>
  );
};

// ── Component ───────────────────────────────────────────────────────

export const ThemedAlert = ({ alert, onDismiss }: ThemedAlertProps) => {
  const { colors, fonts, borderRadius, shadows, chrome } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  const visible = alert !== null;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(0);
      scale.setValue(0.9);
    }
  }, [visible, opacity, scale]);

  const handlePress = (button?: AlertButton) => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: ANIMATION_DURATION / 2,
      useNativeDriver: true,
    }).start(() => onDismiss(button));
  };

  const buttons = alert?.buttons;
  const hasButtons = buttons && buttons.length > 0;

  // On web, RN Modal portals all share the same z-index so a second Modal
  // (this alert) can render *under* an already-open BottomSheetModal.
  // Fix: on web, render as a fixed-position overlay with a very high z-index;
  // on native, use <Modal> for proper system-level stacking.
  const Wrapper = Platform.OS === 'web' ? WebOverlay : NativeModalWrapper;

  return (
    <Wrapper visible={visible}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: colors.overlay.backdrop }]}
        onPress={() => {
          const cancel = buttons?.find((b) => b.style === 'cancel');
          handlePress(cancel);
        }}
        testID="alert-backdrop"
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface.modal,
                borderRadius: borderRadius.lg,
                borderWidth: chrome === 'full' ? StyleSheet.hairlineWidth : 1,
                borderColor: colors.card.borderColor,
                ...shadows.md,
                opacity,
                transform: [{ scale }],
              },
            ]}
            testID="alert-card"
          >
            <Text
              style={[
                styles.title,
                {
                  fontFamily: fonts.bodySemibold,
                  color: colors.content.heading,
                },
              ]}
              testID="alert-title"
            >
              {alert?.title}
            </Text>

            {alert?.message ? (
              <Text
                style={[
                  styles.message,
                  {
                    fontFamily: fonts.body,
                    color: colors.content.body,
                  },
                ]}
                testID="alert-message"
              >
                {alert.message}
              </Text>
            ) : null}

            <View
              style={[
                styles.buttonRow,
                { borderTopColor: colors.surface.divider },
              ]}
            >
              {hasButtons ? (
                buttons.map((button) => (
                  <Button
                    key={button.text}
                    label={button.text}
                    variant={button.style === 'cancel' ? 'text' : 'primary'}
                    tone={buttonTone(button.style)}
                    size="md"
                    onPress={() => handlePress(button)}
                    style={styles.alertButton}
                    testID={`alert-button-${button.text}`}
                  />
                ))
              ) : (
                <Button
                  label="OK"
                  variant="primary"
                  size="md"
                  onPress={() => handlePress()}
                  style={styles.alertButton}
                  testID="alert-button-OK"
                />
              )}
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  // 'fixed' is only valid on web (RN Web supports it), breaks out of
  // all parent stacking contexts including RN Modal portals.
  webOverlay: {
    position: 'fixed' as never,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['3xl'],
  },
  card: {
    width: 300,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  title: {
    fontSize: fontSize['2xl'],
    textAlign: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.lg,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    lineHeight: 20,
  },
  buttonRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  alertButton: {
    flex: 1,
  },
});
