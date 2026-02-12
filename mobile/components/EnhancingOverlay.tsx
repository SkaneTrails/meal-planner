/**
 * Fullscreen loading overlay shown while AI enhancement is in progress.
 * Blocks all user interaction until the operation completes.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  spacing,
} from '@/lib/theme';

interface EnhancingOverlayProps {
  visible: boolean;
  message: string;
}

export const EnhancingOverlay = ({ visible, message }: EnhancingOverlayProps) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    onRequestClose={() => {}}
  >
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Ionicons name="sparkles" size={32} color="#7C3AED" />
        <ActivityIndicator
          size="large"
          color={colors.accent}
          style={styles.spinner}
        />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.lg,
    padding: spacing['3xl'],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
    maxWidth: 300,
    width: '100%',
  },
  spinner: {
    marginTop: spacing.lg,
  },
  message: {
    marginTop: spacing.lg,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bodySemibold,
    color: colors.text.inverse,
    textAlign: 'center',
  },
});
