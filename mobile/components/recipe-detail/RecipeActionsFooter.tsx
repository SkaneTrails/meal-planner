import React from 'react';
import { Text, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shadows, borderRadius, colors, spacing, fontFamily, fontSize } from '@/lib/theme';
import { showNotification } from '@/lib/alert';
import type { TFunction } from '@/lib/i18n';

const FOOTER_BOTTOM_MARGIN = 100;

interface RecipeActionsFooterProps {
  url: string;
  t: TFunction;
  onShowPlanModal: () => void;
}

export const RecipeActionsFooter = ({ url, t, onShowPlanModal }: RecipeActionsFooterProps) => (
  <>
    {url && (
      <Pressable
        onPress={() => {
          try {
            const parsed = new URL(url);
            if (!['http:', 'https:'].includes(parsed.protocol)) {
              showNotification(t('common.error'), t('recipe.couldNotOpenUrl'));
              return;
            }
            Linking.openURL(url).catch(() => {
              showNotification(t('common.error'), t('recipe.couldNotOpenUrl'));
            });
          } catch {
            showNotification(t('common.error'), t('recipe.couldNotOpenUrl'));
          }
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.lg,
          marginTop: spacing.sm,
          backgroundColor: 'rgba(180, 175, 168, 0.4)',
          borderRadius: borderRadius.md,
        }}
      >
        <Ionicons name="link" size={18} color="#5D4E40" />
        <Text style={{ color: '#5D4E40', marginLeft: spacing.sm, fontSize: fontSize.xl, fontFamily: fontFamily.bodyMedium }} numberOfLines={1}>
          {t('recipe.viewSource')}
        </Text>
      </Pressable>
    )}

    <Pressable
      onPress={onShowPlanModal}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        marginTop: spacing.md,
        marginBottom: FOOTER_BOTTOM_MARGIN,
        backgroundColor: pressed ? '#5A7A5A' : '#6B8E6B',
        borderRadius: borderRadius.sm,
        ...shadows.md,
      })}
    >
      <Ionicons name="calendar" size={20} color={colors.white} />
      <Text style={{ color: colors.white, marginLeft: spacing.sm, fontSize: fontSize['2xl'], fontFamily: fontFamily.bodySemibold }}>
        {t('recipe.addToMealPlan')}
      </Text>
    </Pressable>
  </>
);
