import { Pressable, Text, TextInput, View } from 'react-native';
import { Button } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';

interface AddMemberFormProps {
  newMemberEmail: string;
  onEmailChange: (email: string) => void;
  newMemberRole: 'admin' | 'member';
  onRoleChange: (role: 'admin' | 'member') => void;
  onSubmit: () => void;
  onClose: () => void;
  isPending: boolean;
}

export const AddMemberForm = ({
  newMemberEmail,
  onEmailChange,
  newMemberRole,
  onRoleChange,
  onSubmit,
  onClose,
  isPending,
}: AddMemberFormProps) => {
  const { colors, borderRadius, shadows } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.bgLight,
        padding: spacing.lg,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        ...shadows.lg,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.md,
        }}
      >
        <Text
          style={{
            fontSize: fontSize.lg,
            fontWeight: fontWeight.semibold,
            color: colors.content.heading,
          }}
        >
          {t('admin.addMember.title')}
        </Text>
        <Button
          variant="icon"
          onPress={onClose}
          icon="close"
          iconSize={24}
          textColor={colors.content.secondary}
        />
      </View>

      <TextInput
        value={newMemberEmail}
        onChangeText={onEmailChange}
        placeholder={t('admin.addMember.emailPlaceholder')}
        placeholderTextColor={colors.content.placeholderHex}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          fontSize: fontSize.md,
          color: colors.content.heading,
          marginBottom: spacing.sm,
        }}
      />

      <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
        {(['member', 'admin'] as const).map((role) => (
          <Pressable
            key={role}
            onPress={() => onRoleChange(role)}
            style={{
              flex: 1,
              padding: spacing.sm,
              marginRight: role === 'member' ? spacing.sm : 0,
              backgroundColor:
                newMemberRole === role ? colors.content.heading : colors.white,
              borderRadius: borderRadius.md,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color:
                  newMemberRole === role
                    ? colors.white
                    : colors.content.heading,
                fontWeight: fontWeight.medium,
              }}
            >
              {t(`labels.role.${role}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button
        variant="primary"
        onPress={onSubmit}
        disabled={!newMemberEmail.trim()}
        isPending={isPending}
        label={t('admin.addMember.button')}
        color={colors.content.heading}
      />
    </View>
  );
};
