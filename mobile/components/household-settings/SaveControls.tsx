import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTranslation } from '@/lib/i18n';
import { borderRadius, colors, fontSize, spacing } from '@/lib/theme';

export const ReadOnlyBanner = () => {
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
      }}
    >
      <Ionicons name="lock-closed" size={16} color={colors.text.secondary} />
      <Text style={{ color: colors.text.secondary, fontSize: fontSize.sm, flex: 1 }}>
        {t('householdSettings.readOnly')}
      </Text>
    </View>
  );
};

export const BottomSaveBar = ({ isSaving, onSave }: { isSaving: boolean; onSave: () => void }) => {
  const { t } = useTranslation();

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(253, 246, 240, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(139, 115, 85, 0.2)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        paddingBottom: spacing.xl,
      }}
    >
      <Pressable
        onPress={onSave}
        disabled={isSaving}
        style={({ pressed }) => ({
          backgroundColor: pressed ? '#5D4E40' : colors.primary,
          borderRadius: borderRadius.md,
          paddingVertical: 14,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
        })}
      >
        {isSaving ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <Ionicons name="checkmark" size={20} color="white" />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              {t('householdSettings.saveChanges')}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
};
