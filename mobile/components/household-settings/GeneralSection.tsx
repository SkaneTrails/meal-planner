import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  shadows,
  spacing,
} from '@/lib/theme';
import type { HouseholdSettings } from '@/lib/types';

interface GeneralSectionProps {
  settings: HouseholdSettings;
  canEdit: boolean;
  householdName: string | undefined;
  isEditingName: boolean;
  editedName: string;
  onEditedNameChange: (name: string) => void;
  onStartEditName: () => void;
  onSaveName: () => void;
  onCancelEditName: () => void;
  isRenamePending: boolean;
  onUpdateServings: (servings: number) => void;
}

export const GeneralSection = ({
  settings,
  canEdit,
  householdName,
  isEditingName,
  editedName,
  onEditedNameChange,
  onStartEditName,
  onSaveName,
  onCancelEditName,
  isRenamePending,
  onUpdateServings,
}: GeneralSectionProps) => {
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.sm,
      }}
    >
      {/* Household Name */}
      <View style={{ marginBottom: spacing.lg }}>
        <Text
          style={{
            fontSize: fontSize.sm,
            color: colors.text.dark + '80',
            marginBottom: spacing.xs,
          }}
        >
          {t('householdSettings.general.nameLabel')}
        </Text>
        {isEditingName ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <TextInput
              value={editedName}
              onChangeText={onEditedNameChange}
              autoFocus
              maxLength={100}
              onSubmitEditing={onSaveName}
              style={{
                flex: 1,
                fontSize: fontSize.lg,
                fontWeight: fontWeight.bold,
                color: colors.text.dark,
                backgroundColor: colors.bgLight,
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              }}
            />
            <Pressable
              onPress={onSaveName}
              disabled={isRenamePending}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isRenamePending ? 0.6 : 1,
              }}
            >
              {isRenamePending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons name="checkmark" size={20} color="white" />
              )}
            </Pressable>
            <Pressable
              onPress={onCancelEditName}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.bgLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={20} color={colors.text.dark} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={canEdit ? onStartEditName : undefined}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <Text
              style={{
                fontSize: fontSize.lg,
                fontWeight: fontWeight.bold,
                color: colors.text.dark,
                flex: 1,
              }}
            >
              {householdName ?? '—'}
            </Text>
            {canEdit && (
              <Ionicons
                name="create-outline"
                size={18}
                color={colors.text.dark + '60'}
              />
            )}
          </Pressable>
        )}
      </View>

      {/* Default Servings */}
      <View>
        <Text
          style={{
            fontSize: fontSize.sm,
            color: colors.text.dark + '80',
            marginBottom: spacing.xs,
          }}
        >
          {t('householdSettings.general.defaultServings')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() =>
              settings.default_servings > 1 &&
              onUpdateServings(settings.default_servings - 1)
            }
            disabled={!canEdit}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: pressed ? colors.bgDark : colors.bgLight,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: canEdit ? 1 : 0.4,
            })}
          >
            <Ionicons name="remove" size={20} color={colors.text.dark} />
          </Pressable>
          <Text
            style={{
              fontSize: fontSize['2xl'],
              fontWeight: fontWeight.bold,
              color: colors.text.dark,
              minWidth: 60,
              textAlign: 'center',
            }}
          >
            {settings.default_servings}
          </Text>
          <Pressable
            onPress={() => onUpdateServings(settings.default_servings + 1)}
            disabled={!canEdit}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: pressed ? colors.bgDark : colors.bgLight,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: canEdit ? 1 : 0.4,
            })}
          >
            <Ionicons name="add" size={20} color={colors.text.dark} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};
