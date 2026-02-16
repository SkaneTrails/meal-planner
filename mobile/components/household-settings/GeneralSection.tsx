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
  circleStyle,
  colors,
  fontSize,
  fontWeight,
  iconContainer,
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
            color: colors.content.strong,
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
                color: colors.content.body,
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
                ...circleStyle(iconContainer.xs),
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isRenamePending ? 0.6 : 1,
              }}
            >
              {isRenamePending ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Ionicons name="checkmark" size={20} color={colors.white} />
              )}
            </Pressable>
            <Pressable
              onPress={onCancelEditName}
              style={{
                ...circleStyle(iconContainer.xs),
                backgroundColor: colors.bgLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={20} color={colors.content.body} />
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
                color: colors.content.heading,
                flex: 1,
              }}
            >
              {householdName ?? '—'}
            </Text>
            {canEdit && (
              <Ionicons
                name="create-outline"
                size={18}
                color={colors.content.subtitle}
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
            color: colors.content.strong,
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
              ...circleStyle(iconContainer.md),
              backgroundColor: pressed ? colors.bgDark : colors.bgLight,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: canEdit ? 1 : 0.4,
            })}
          >
            <Ionicons name="remove" size={20} color={colors.content.body} />
          </Pressable>
          <Text
            style={{
              fontSize: fontSize['2xl'],
              fontWeight: fontWeight.bold,
              color: colors.content.heading,
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
              ...circleStyle(iconContainer.md),
              backgroundColor: pressed ? colors.bgDark : colors.bgLight,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: canEdit ? 1 : 0.4,
            })}
          >
            <Ionicons name="add" size={20} color={colors.content.body} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};
