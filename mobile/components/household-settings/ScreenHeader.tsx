import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useTranslation } from '@/lib/i18n';
import { borderRadius, colors, spacing } from '@/lib/theme';

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
        paddingTop: 44,
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
            padding: 8,
            marginLeft: -8,
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          <Text
            style={{ color: colors.text.primary, fontSize: 17, marginLeft: 2 }}
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
              paddingHorizontal: 24,
              paddingVertical: 10,
              borderRadius: borderRadius.lg,
              opacity: isSaving ? 0.6 : 1,
              shadowColor: colors.accent,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 3,
            })}
          >
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text
                style={{ color: colors.white, fontSize: 15, fontWeight: '600' }}
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
