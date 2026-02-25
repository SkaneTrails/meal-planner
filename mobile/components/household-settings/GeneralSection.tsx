import { useMemo } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import {
  DropdownPicker,
  IconButton,
  SettingToggleRow,
  StepperControl,
} from '@/components';
import { ThemeIcon } from '@/components/ThemeIcon';
import { useTranslation } from '@/lib/i18n';
import {
  borderRadius,
  fontSize,
  iconSize,
  letterSpacing,
  spacing,
  useTheme,
} from '@/lib/theme';
import type { HouseholdSettings } from '@/lib/types';
import { WEEK_DAYS, type WeekStart } from '@/lib/utils/dateFormatter';

const WEEKDAY_I18N_KEY: Record<WeekStart, string> = {
  sunday: 'settings.weekStartSunday',
  monday: 'settings.weekStartMonday',
  tuesday: 'settings.weekStartTuesday',
  wednesday: 'settings.weekStartWednesday',
  thursday: 'settings.weekStartThursday',
  friday: 'settings.weekStartFriday',
  saturday: 'settings.weekStartSaturday',
};

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
  weekStart: WeekStart;
  onSetWeekStart: (day: WeekStart) => void;
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
  weekStart,
  onSetWeekStart,
}: GeneralSectionProps) => {
  const { colors, fonts } = useTheme();
  const { t } = useTranslation();

  const weekStartOptions = useMemo(
    () =>
      WEEK_DAYS.map((day) => ({
        value: day,
        label: t(WEEKDAY_I18N_KEY[day]),
      })),
    [t],
  );

  const dividerStyle = {
    height: 1,
    backgroundColor: colors.surface.divider,
    marginVertical: spacing.lg,
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface.subtle,
        borderRadius: borderRadius.md,
        padding: spacing.md,
      }}
    >
      {/* Household Name */}
      <View>
        <Text
          style={{
            fontSize: fontSize.xs,
            fontFamily: fonts.bodySemibold,
            color: colors.content.subtitle,
            textTransform: 'uppercase' as const,
            letterSpacing: letterSpacing.wide,
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
                fontSize: fontSize['2xl'],
                fontFamily: fonts.bodyBold,
                color: colors.input.text,
                backgroundColor: colors.input.bg,
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              }}
            />
            <IconButton
              icon="checkmark"
              onPress={onSaveName}
              isPending={isRenamePending}
            />
            <IconButton tone="cancel" icon="close" onPress={onCancelEditName} />
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
                fontSize: fontSize['2xl'],
                fontFamily: fonts.bodyBold,
                color: colors.content.heading,
                flex: 1,
              }}
            >
              {householdName ?? '—'}
            </Text>
            {canEdit && (
              <ThemeIcon
                name="create-outline"
                size={iconSize.md}
                color={colors.content.subtitle}
              />
            )}
          </Pressable>
        )}
      </View>

      <View style={dividerStyle} />

      {/* Default Servings */}
      <View>
        <Text
          style={{
            fontSize: fontSize.xs,
            fontFamily: fonts.bodySemibold,
            color: colors.content.subtitle,
            textTransform: 'uppercase' as const,
            letterSpacing: letterSpacing.wide,
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

      <View style={dividerStyle} />

      {/* Include Breakfast */}
      <SettingToggleRow
        label={t('householdSettings.general.includeBreakfast')}
        subtitle={t('householdSettings.general.includeBreakfastDesc')}
        value={settings.include_breakfast ?? false}
        onValueChange={onUpdateIncludeBreakfast}
        disabled={!canEdit}
      />

      <View style={dividerStyle} />

      {/* Week Start Day */}
      <View>
        <Text
          style={{
            fontSize: fontSize.xs,
            fontFamily: fonts.bodySemibold,
            color: colors.content.subtitle,
            textTransform: 'uppercase' as const,
            letterSpacing: letterSpacing.wide,
            marginBottom: spacing.xs,
          }}
        >
          {t('settings.weekStart')}
        </Text>
        <DropdownPicker
          options={weekStartOptions}
          value={weekStart}
          onSelect={onSetWeekStart}
          testID="week-start-picker"
        />
      </View>
    </View>
  );
};
