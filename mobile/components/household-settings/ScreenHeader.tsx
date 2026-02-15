import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTranslation } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  letterSpacing,
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
      <View style={{ marginTop: spacing.md }}>
        <Text
          style={{
            fontSize: fontSize['4xl'],
            fontFamily: fontFamily.display,
            color: colors.text.primary,
            letterSpacing: letterSpacing.tight,
            textShadowColor: 'rgba(0, 0, 0, 0.15)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
          }}
        >
          {t('householdSettings.title')}
        </Text>
        <Text
          style={{
            fontSize: fontSize.lg,
            fontFamily: fontFamily.body,
            color: colors.text.secondary,
            marginTop: 4,
          }}
        >
          {t('householdSettings.subtitle')}
        </Text>
      </View>
    </View>
  );
};
