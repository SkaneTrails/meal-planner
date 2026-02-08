import React from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shadows, borderRadius, colors, spacing, fontSize, letterSpacing, iconContainer } from '@/lib/theme';
import type { useAddRecipeActions } from './useAddRecipeActions';

type Actions = ReturnType<typeof useAddRecipeActions>;

interface EnhancementSummaryModalProps {
  actions: Actions;
}

export const EnhancementSummaryModal = ({ actions }: EnhancementSummaryModalProps) => {
  const { t, showSummaryModal, setShowSummaryModal, importedRecipe, handleViewRecipe, handleAddAnother } = actions;

  return (
    <Modal
      visible={showSummaryModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSummaryModal(false)}
    >
      <View style={{
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center', padding: spacing['2xl'],
      }}>
        <View style={{
          backgroundColor: colors.white, borderRadius: borderRadius.lg,
          padding: spacing['2xl'], width: '100%', maxWidth: 400, maxHeight: '80%', ...shadows.xl,
        }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
            <View style={{
              width: iconContainer.lg, height: iconContainer.lg, borderRadius: iconContainer.lg / 2,
              backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
            }}>
              <Ionicons name="sparkles" size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize['3xl'], fontWeight: '700', color: colors.text.inverse, letterSpacing: letterSpacing.normal }}>
                {t('addRecipe.enhanced.title')}
              </Text>
              <Text style={{ fontSize: fontSize.lg, color: colors.gray[600], marginTop: spacing.xs }} numberOfLines={1}>
                {importedRecipe?.title}
              </Text>
            </View>
          </View>

          {/* Changes list */}
          <ScrollView style={{ maxHeight: 300, marginBottom: spacing.xl }}>
            <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text.inverse, marginBottom: spacing.md }}>
              {t('addRecipe.enhanced.changesLabel')}
            </Text>
            {importedRecipe?.changes_made?.map((change, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm,
                  backgroundColor: colors.successBg, padding: spacing.md, borderRadius: borderRadius.sm,
                }}
              >
                <Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginRight: spacing.sm, marginTop: 1 }} />
                <Text style={{ flex: 1, fontSize: fontSize.lg, color: colors.text.inverse, lineHeight: 22 }}>
                  {change}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Pressable
              onPress={handleAddAnother}
              style={({ pressed }) => ({
                flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md,
                backgroundColor: colors.glass.light, alignItems: 'center', opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text.inverse }}>
                {t('addRecipe.enhanced.addMore')}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleViewRecipe}
              style={({ pressed }) => ({
                flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md,
                backgroundColor: colors.primary, alignItems: 'center',
                opacity: pressed ? 0.9 : 1, ...shadows.sm,
              })}
            >
              <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.white }}>
                {t('addRecipe.enhanced.viewRecipe')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
