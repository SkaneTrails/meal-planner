import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import {
  Button,
  SettingToggleRow,
  StepperControl,
  SurfaceCard,
} from '@/components';
import { useTranslation } from '@/lib/i18n';
import {
  borderRadius,
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
  const { colors, circleStyle } = useTheme();
  const { t } = useTranslation();

  return (
    <SurfaceCard radius="lg">
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
            <Button
              variant="icon"
              icon="checkmark"
              onPress={onSaveName}
              isPending={isRenamePending}
              style={circleStyle(iconContainer.xs)}
            />
            <Button
              variant="icon"
              tone="cancel"
              icon="close"
              onPress={onCancelEditName}
              style={circleStyle(iconContainer.xs)}
            />
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
      <View style={{ marginTop: spacing.lg }}>
        <SettingToggleRow
          label={t('householdSettings.general.includeBreakfast')}
          subtitle={t('householdSettings.general.includeBreakfastDesc')}
          value={settings.include_breakfast ?? false}
          onValueChange={onUpdateIncludeBreakfast}
          disabled={!canEdit}
        />
      </View>
    </SurfaceCard>
  );
};
