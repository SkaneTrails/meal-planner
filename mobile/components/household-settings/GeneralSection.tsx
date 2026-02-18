import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StepperControl, ThemeToggle } from '@/components';
import { useTranslation } from '@/lib/i18n';
import {
  fontSize,
  fontWeight,
  iconContainer,
  spacing,
  useTheme,
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
  onUpdateIncludeBreakfast: (enabled: boolean) => void;
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
  onUpdateIncludeBreakfast,
}: GeneralSectionProps) => {
  const { colors, borderRadius, shadows, circleStyle } = useTheme();
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
        <StepperControl
          value={settings.default_servings}
          onDecrement={() =>
            settings.default_servings > 1 &&
            onUpdateServings(settings.default_servings - 1)
          }
          onIncrement={() => onUpdateServings(settings.default_servings + 1)}
          decrementDisabled={!canEdit || settings.default_servings <= 1}
          incrementDisabled={!canEdit}
        />
      </View>

      {/* Include Breakfast */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: spacing.lg,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: fontSize.sm,
              color: colors.content.strong,
            }}
          >
            {t('householdSettings.general.includeBreakfast')}
          </Text>
          <Text
            style={{
              fontSize: fontSize.xs,
              color: colors.content.subtitle,
              marginTop: spacing['2xs'],
            }}
          >
            {t('householdSettings.general.includeBreakfastDesc')}
          </Text>
        </View>
        <ThemeToggle
          value={settings.include_breakfast ?? false}
          onValueChange={onUpdateIncludeBreakfast}
          disabled={!canEdit}
        />
      </View>
    </View>
  );
};
