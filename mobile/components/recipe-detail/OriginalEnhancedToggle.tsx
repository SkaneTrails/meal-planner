import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, colors, spacing, fontFamily, fontSize } from '@/lib/theme';
import type { TFunction } from '@/lib/i18n';

interface OriginalEnhancedToggleProps {
  showOriginal: boolean;
  t: TFunction;
  onToggle: () => void;
}

export const OriginalEnhancedToggle = ({
  showOriginal,
  t,
  onToggle,
}: OriginalEnhancedToggleProps) => (
  <View style={{
    marginTop: spacing.xl,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: borderRadius.lg,
    padding: 4,
  }}>
    <Pressable
      onPress={showOriginal ? undefined : onToggle}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: showOriginal ? 'rgba(255, 255, 255, 0.85)' : 'transparent',
      }}
    >
      <Ionicons
        name="document-text-outline"
        size={16}
        color={showOriginal ? '#5D4037' : 'rgba(93, 64, 55, 0.5)'}
        style={{ marginRight: spacing.xs }}
      />
      <Text style={{
        fontSize: fontSize.md,
        fontFamily: showOriginal ? fontFamily.bodySemibold : fontFamily.body,
        color: showOriginal ? '#5D4037' : 'rgba(93, 64, 55, 0.5)',
      }}>
        {t('recipe.showOriginal')}
      </Text>
    </Pressable>
    <Pressable
      onPress={showOriginal ? onToggle : undefined}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: showOriginal ? 'transparent' : 'rgba(255, 255, 255, 0.85)',
      }}
    >
      <Ionicons
        name="sparkles"
        size={16}
        color={showOriginal ? 'rgba(45, 106, 90, 0.5)' : '#2D6A5A'}
        style={{ marginRight: spacing.xs }}
      />
      <Text style={{
        fontSize: fontSize.md,
        fontFamily: showOriginal ? fontFamily.body : fontFamily.bodySemibold,
        color: showOriginal ? 'rgba(45, 106, 90, 0.5)' : '#2D6A5A',
      }}>
        {t('recipe.showEnhanced')}
      </Text>
    </Pressable>
  </View>
);
