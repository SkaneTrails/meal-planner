import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, Text, View } from 'react-native';
import { PrimaryButton } from '@/components';
import { showNotification } from '@/lib/alert';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  spacing,
} from '@/lib/theme';

const FOOTER_BOTTOM_MARGIN = 100;

interface RecipeActionsFooterProps {
  url: string;
  t: TFunction;
  onShowPlanModal: () => void;
}

export const RecipeActionsFooter = ({
  url,
  t,
  onShowPlanModal,
}: RecipeActionsFooterProps) => (
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
        <Ionicons name="link" size={18} color={colors.content.body} />
        <Text
          style={{
            color: colors.content.body,
            marginLeft: spacing.sm,
            fontSize: fontSize.xl,
            fontFamily: fontFamily.bodyMedium,
          }}
          numberOfLines={1}
        >
          {t('recipe.viewSource')}
        </Text>
      </Pressable>
    )}

    <View style={{ marginTop: spacing.md, marginBottom: FOOTER_BOTTOM_MARGIN }}>
      <PrimaryButton
        onPress={onShowPlanModal}
        icon="calendar"
        label={t('recipe.addToMealPlan')}
        color={colors.ai.primary}
        pressedColor={colors.ai.primaryDark}
      />
    </View>
  </>
);
