import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useTranslation } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  layout,
  spacing,
} from '@/lib/theme';

interface ScreenHeaderProps {
  canEdit: boolean;
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onBack: () => void;
}

export const ScreenHeader = ({
  canEdit,
  hasChanges,
  isSaving,
  onSave,
  onBack,
}: ScreenHeaderProps) => {
  const { t } = useTranslation();

  return (
    <View
      style={{
        paddingHorizontal: spacing.lg,
        paddingTop: layout.screenPaddingTop,
        paddingBottom: spacing.md,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={onBack}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.sm,
            marginLeft: -spacing.sm,
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          <Text
            style={{
              color: colors.text.primary,
              fontSize: fontSize['2xl'],
              marginLeft: spacing['2xs'],
            }}
          >
            {t('common.back')}
          </Text>
        </Pressable>
        {canEdit && hasChanges && (
          <Pressable
            onPress={onSave}
            disabled={isSaving}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.accentDark : colors.accent,
              paddingHorizontal: spacing['2xl'],
              paddingVertical: spacing['sm-md'],
              borderRadius: borderRadius.lg,
              opacity: isSaving ? 0.6 : 1,
              boxShadow: `0px 2px 4px 0px ${colors.accent}4D`,
            })}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text
                style={{
                  color: colors.white,
                  fontSize: fontSize.xl,
                  fontWeight: fontWeight.semibold,
                }}
              >
                {t('common.save')}
              </Text>
            )}
          </Pressable>
        )}
      </View>
      <ScreenTitle
        variant="large"
        title={t('householdSettings.title')}
        subtitle={t('householdSettings.subtitle')}
        style={{ marginTop: spacing.md }}
      />
    </View>
  );
};
